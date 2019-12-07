import { Injectable, OnInit } from '@angular/core';
import { MemoryCard } from './memory-card';

class MemoryCardState {
  filename: string;
  data: string;

  constructor(filename: string, data: string) {
    this.filename = filename;
    this.data = data;
  }
}

@Injectable({
  providedIn: 'root'
})
export class MemoryCardService {

  memoryCards = [];
  state: Array<MemoryCardState> = [];

  constructor() {
    // reload state from localStorage
    let states: Array<MemoryCardState> = JSON.parse(localStorage.getItem('state'));
    if (states !== null) {
      this.state = states;
      states.forEach((state: MemoryCardState) => {
        this.memoryCards.push(new MemoryCard(state.filename, this.b64decode(state.data)));
      });
    }
  }

  public loadMemoryCard(filename: string, buffer: ArrayBuffer) {
    this.memoryCards.push(new MemoryCard(filename, new DataView(buffer)));
    this.state.push(new MemoryCardState(filename, this.b64encode(buffer)));
    localStorage.setItem('state', JSON.stringify(this.state));
  }

  dataURI(data: Uint8ClampedArray) {
    const encoded = this.b64encode(data);
    return `data:image/bmp;base64,${encoded}`;
  }

  b64encode(buffer: ArrayBuffer): string {
    const u8Array = new Uint8Array(buffer);
    return btoa(String.fromCharCode.apply(null, u8Array));
  }

  b64decode(value: string): DataView {
    const decoded = atob(value);
    const array = new Uint8Array(decoded.length);
    array.forEach((value, i) => {
      array[i] = decoded.charCodeAt(i);
    });
    return new DataView(array.buffer);
  }

  closeCard(index: number) {
    this.memoryCards.splice(index, 1);
    this.state.splice(index, 1);
    localStorage.setItem('state', JSON.stringify(this.state));
  }

  persist() {
    console.log('persisting')
    this.memoryCards.forEach((card, index) => {
      this.state[index] = new MemoryCardState(card.filename, this.b64encode(card.buffer.buffer));
    })
    localStorage.setItem('state', JSON.stringify(this.state));
  }

  copySave(source: MemoryCard, saveIndex: number, destination: MemoryCard) {
    const blocks = source.getSaveBlocks(saveIndex);
    const blockIndexes = blocks.map(block => (block.byteOffset / 8192) - 1);
    const destinationBlocks = destination.freeBlocks;
    if (destinationBlocks.length < blocks.length) {
      throw 'Not enough blocks on the destination!';
    }
    blocks.forEach((block, i) => {
      const destinationBlock = destinationBlocks[i];
      const sourceFrame = new Uint8Array(source.buffer.buffer, 128 + (128 * blockIndexes[i]), 128);
      const destFrame = new Uint8Array(destination.buffer.buffer, 128 + (128 * destinationBlock.blockIndex), 128);
      destFrame.set(sourceFrame);
      if (i < blocks.length - 1) {
        destinationBlock.nextBlock = destinationBlocks[i + 1].blockIndex;
      }
      destinationBlock.fixChecksum()
      const sourceBlock = new Uint8Array(source.buffer.buffer, 8192 + (8192 * blockIndexes[i]), 8192);
      const destBlock = new Uint8Array(destination.buffer.buffer, 8192 + (8192 * destinationBlock.blockIndex), 8192);
      destBlock.set(sourceBlock);
    })
    destination.reloadSaves();
  }
}
