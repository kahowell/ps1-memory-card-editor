const BLOCK_AVAILABLE = 0xA0
const BLOCK_UNUSABLE = 0xFF
const BLOCK_FIRST = 0x51
const BLOCK_MIDDLE = 0x52
const BLOCK_LAST = 0x53

const LAST_BLOCK_SENTINAL = 0xFF

const shiftJisDecoder = new TextDecoder('shift_jis');
const utf8Decoder = new TextDecoder('utf-8');

function truncateString(value: string) {
    let end = value.indexOf(String.fromCharCode(0));
    if (end === -1) {
      end = value.length;
    }
    return value.slice(0, end);
}

function writeString(buffer: DataView, offset: number, value: string): number {
    for (let i = 0; i < value.length; i++) {
        buffer.setUint8(offset, value.charCodeAt(i));
        offset += 1;
    }
    return value.length;
}

export class MemoryCard {
  filename: string;
  readonly buffer: DataView;
  readonly header: Header;
  readonly saves: Array<SaveMetadata> = [];

  constructor(filename: string, buffer: DataView = undefined) {
    this.filename = filename;
    if (buffer === undefined) {
      const buffer = new ArrayBuffer(131072);
      this.buffer = new DataView(buffer);
    }
    else {
      this.buffer = buffer;
    }
    this.header = new Header(this.buffer);
    if (buffer === undefined) {
      this.format();
    }
    this.reloadSaves();
  }

  reloadSaves() {
    while (this.saves.length > 0) {
      this.saves.pop();
    }
    this.header.blockMetadata.forEach((block, index) => {
      if (block.blockState == BLOCK_FIRST) {
        const blockCount = this.getSaveBlocks(this.saves.length).length;
        this.saves.push(new SaveMetadata(block, this.buffer, (index + 1) * 8192, blockCount))
      }
    });
  }

  format() {
    this.header.format();
  }

  get usedBlocks(): Array<BlockMetadata> {
    return this.header.blockMetadata
      .filter(block => block.blockState !== BLOCK_AVAILABLE);
  }

  get freeBlocks(): Array<BlockMetadata> {
    return this.header.blockMetadata
      .filter(block => block.blockState === BLOCK_AVAILABLE);
  }

  get saveCount(): number {
    return this.header.blockMetadata
      .filter(block => block.blockState === BLOCK_FIRST).length;
  }

  deleteSave(index: number) {
    const blocks = this.getSaveBlocks(index);
    blocks.forEach(block => {
      const blockIndex = (block.byteOffset / 8192) - 1;
      this.header.blockMetadata[blockIndex].format();
    });
    this.reloadSaves();
  }

  getSaveBlocks(index: number): Array<DataView> {
    const blocks = [];
    const block = this.header.blockMetadata.filter(block => block.blockState == BLOCK_FIRST)[index];
    const blockIndex = block.blockIndex;
    blocks.push(new DataView(this.buffer.buffer, 8192 * (1 + blockIndex), 8192));
    if (block.nextBlock !== LAST_BLOCK_SENTINAL) {
      this.getLinkedBlocks(block.nextBlock).forEach(block => blocks.push(block));
    }
    return blocks;
  }

  getLinkedBlocks(index: number) {
    let block = this.header.blockMetadata[index];
    const blocks = [];
    while (true) {
      blocks.push(new DataView(this.buffer.buffer, 8192 * (1 + index), 8192))
      if (block.nextBlock === LAST_BLOCK_SENTINAL) {
        break;
      }
      index = block.nextBlock;
      block = this.header.blockMetadata[block.nextBlock];
    }
    return blocks;
  }
}

class Header {
  private readonly _buffer: DataView;
  readonly blockMetadata: BlockMetadata[];

  constructor(buffer: DataView) {
    this._buffer = buffer;
    this.blockMetadata = new Array(15);
    for (let i = 0; i < 15; i++) {
      const offset = 0x80 + (i * 128);
      this.blockMetadata[i] = new BlockMetadata(buffer, offset);
    }
  }

  format() {
    writeString(this._buffer, 0, 'MC');
    this._buffer.setUint8(0x7f, 0x0e);
    for (let i = 0; i < 15; i++) {
      this.blockMetadata[i].format();
    }
    for (let i = 0; i < 3456; i++) {
      this._buffer.setUint8(0x1200 + i, 0xff);
    }
    // clear unused frames
    for (let i = 0; i < 20; i++) {
      let offset = 0x1200 + (i * 128);
      this._buffer.setUint8(offset, 0xff); // mark as unusable
      for (let j = 0; j < 3; j++) {
        this._buffer.setUint8(offset + j, 0xff);
      }
      this._buffer.setUint8(offset + 8, 0xff) // mark next block unused
      this._buffer.setUint8(offset + 8, 0xff) // mark next frame unused
    }
  }
}

class BlockMetadata {
  private readonly _buffer: DataView;
  private readonly _offset: number;

  constructor(buffer: DataView, offset: number) {
    this._buffer = buffer;
    this._offset = offset;
  }

  get blockIndex() {
    return (this._offset / 0x80) - 1
  }

  get blockState() {
    return this._buffer.getUint8(this._offset);
  }

  set blockState(value: number) {
    this._buffer.setUint8(this._offset, value);
  }

  get nextBlock(): number {
    return this._buffer.getUint8(this._offset + 8);
  }

  set nextBlock(value: number) {
    this._buffer.setUint8(this._offset + 8, value);
  }

  get countryCode(): string {
    const view = new DataView(this._buffer.buffer, this._buffer.byteOffset + this._offset + 0xA, 2);
    return utf8Decoder.decode(view);
  }

  get productCode(): string {
    const view = new DataView(this._buffer.buffer, this._buffer.byteOffset + this._offset + 0xC, 10);
    return utf8Decoder.decode(view);
  }

  get identifier(): string {
    const view = new DataView(this._buffer.buffer, this._buffer.byteOffset + this._offset + 0x16, 8);
    return utf8Decoder.decode(view);
  }

  format() {
    this.blockState = BLOCK_AVAILABLE;
    this.fixChecksum();
  }

  fixChecksum() {
    let value = 0;
    for (let i = 0; i < 127; i++) {
      value = value ^ this._buffer.getUint8(this._offset + i);
    }
    this._buffer.setUint8(this._offset + 127, value);
  }
}

export class SaveMetadata {

  constructor(
    public readonly block: BlockMetadata,
    public readonly buffer: DataView,
    public readonly offset: number,
    public readonly blockCount: number,
  ) {}

  get filename(): string {
    return truncateString(`${this.block.countryCode}${this.block.productCode}${this.block.identifier}`);
  }

  get title() {
    const array = new Uint8Array(this.buffer.buffer, this.offset + 4, 64);
    return truncateString(shiftJisDecoder.decode(array)).normalize('NFKC');
  }

  get iconFrameCount() {
    return 0b11 & this.buffer.getUint8(2 + this.offset);
  }

  iconDataAsRGBA(frameIndex: number): Uint8ClampedArray {
    const iconPalette = this.iconPalette;
    const array = new Uint8ClampedArray(256 * 4);
    const offset = frameIndex * 128 + this.offset;
    for (let i = 0; i < 128; i++) {
      const byte = this.buffer.getUint8(offset + 128 + i);
      let index1 = (0b00001111 & byte);
      let index2 = (0b11110000 & byte) >>> 4;
      array.set(iconPalette[index1], i * 8);
      array.set(iconPalette[index2], i * 8 + 4);
    }
    return array;
  }

  get iconPalette() {
    const mapping = {};
    for (let i = 0; i < 16; i++) {
      let color = this.buffer.getUint16(96 + (2 * i) + this.offset, true);
      let r = (0b0000000000011111 & color);
      let g = (0b0000001111100000 & color) >>> 5;
      let b = (0b0111110000000000 & color) >>> 10;
      let a = color == 0 ? 0 : 255;
      r = Math.trunc(r * (255.0 / 31.0));
      g = Math.trunc(g * (255.0 / 31.0));
      b = Math.trunc(b * (255.0 / 31.0));
      mapping[i] = new Uint8Array([r, g, b, a]);
    }
    return mapping;
  }
}