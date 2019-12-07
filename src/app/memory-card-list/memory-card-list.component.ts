import { Component, AfterViewInit } from '@angular/core';
import { MemoryCard } from '../memory-card';
import { MemoryCardService } from '../memory-card.service';

@Component({
  selector: 'app-memory-card-list',
  templateUrl: './memory-card-list.component.html',
  styleUrls: ['./memory-card-list.component.scss']
})
export class MemoryCardListComponent implements AfterViewInit {

  memoryCardService: MemoryCardService;
  iconFrame = 0;

  constructor(memoryCardService: MemoryCardService) {
    this.memoryCardService = memoryCardService;
  }

  ngAfterViewInit(): void {
    setInterval(() => {
      this.iconFrame += 1;
    }, 500);
  }

  get memoryCards(): Array<MemoryCard> {
    return this.memoryCardService.memoryCards;
  }

  dataURI(data: Uint8ClampedArray): string {
    return this.memoryCardService.dataURI(data);
  }

  openMemoryCard() {
    document.getElementById('mc-file').click();
  }

  loadMemoryCard() {
    const fileInput = <HTMLInputElement>document.getElementById('mc-file');
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => this.memoryCardService.loadMemoryCard(file.name, <ArrayBuffer>reader.result);
    reader.readAsArrayBuffer(file);
  }

  closeCard(index: number) {
    this.memoryCardService.closeCard(index);
  }
}
