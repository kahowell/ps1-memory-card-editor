import { Component, Input, AfterViewInit, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { SaveMetadata } from '../memory-card';
import { MemoryCardService } from '../memory-card.service';

@Component({
  selector: 'app-save-icon',
  templateUrl: './save-icon.component.html',
  styleUrls: ['./save-icon.component.scss']
})
export class SaveIconComponent implements AfterViewInit, OnChanges {

  @Input()
  save: SaveMetadata;

  @ViewChild('canvas', {static: false})
  canvas: ElementRef;

  iconFrames = [];

  @Input()
  iconFrame = 0;

  @Input()
  size = '64px';

  @Input()
  margin = '8px';

  context: CanvasRenderingContext2D;

  memoryCardService: MemoryCardService

  constructor(memoryCardService: MemoryCardService) {
    this.memoryCardService = memoryCardService;
  }

  get effectiveIconFrame() {
    return this.iconFrame % this.save.iconFrameCount;
  }

  ngAfterViewInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    for (let i = 0; i < this.save.iconFrameCount; i++) {
      const iconData = this.save.iconDataAsRGBA(i);
      this.iconFrames.push(new ImageData(iconData, 16, 16));
    }
    this.context.putImageData(this.iconFrames[this.effectiveIconFrame], 0, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.context !== undefined) {
      this.context.putImageData(this.iconFrames[this.effectiveIconFrame], 0, 0);
    }
  }

}
