import { Component, Input } from '@angular/core';
import { MemoryCard } from '../memory-card';
import { MemoryCardService } from '../memory-card.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-memory-card-detail',
  templateUrl: './memory-card-detail.component.html',
  styleUrls: ['./memory-card-detail.component.scss']
})
export class MemoryCardDetailComponent {

  @Input()
  card: MemoryCard;

  @Input()
  iconFrame = 0;

  @Input()
  index: number;

  memoryCardService: MemoryCardService;

  dialog: MatDialog;

  constructor(memoryCardService: MemoryCardService, dialog: MatDialog) {
    this.memoryCardService = memoryCardService;
    this.dialog = dialog;
  }

  downloadCard() {
    const buffer = this.card.buffer;
    const blob = new Blob([new Uint8Array(buffer.buffer)]);
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', downloadUrl);
    link.setAttribute('download', this.card.filename);
    link.setAttribute('style', 'display: none');
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(downloadUrl);
    link.remove();
  }

  closeCard() {
    const dialogRef = this.dialog.open(
      ConfirmDialogComponent, {
        data: {
          message: 'If the card has been edited, changes will be lost!'
        }
      });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.memoryCardService.closeCard(this.index);
      }
    });
  }

  deleteSave(index: number) {
    const dialogRef = this.dialog.open(
      ConfirmDialogComponent, {
        data: {
          message: 'Deleting a save is not undoable!'
        }
      });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.card.deleteSave(index);
        this.memoryCardService.persist();
      }
    })
  }

  drop(event: CdkDragDrop<any>) {
    if (event.container !== event.previousContainer) {
      // copying save
      const source: MemoryCard = event.previousContainer.data;
      const destination: MemoryCard = event.container.data;
      const saveIndex: number = event.item.data;
      this.memoryCardService.copySave(source, saveIndex, destination);
      this.memoryCardService.persist();
    }
  }

  downloadSave(index: number) {
    const save = this.card.saves[index];
    const saveBlocks = this.card.getSaveBlocks(index);
    console.log(saveBlocks);
    const blob = new Blob(saveBlocks.map(block => new Uint8Array(block.buffer, block.byteOffset, block.byteLength)));
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', downloadUrl);
    link.setAttribute('download', save.filename);
    link.setAttribute('style', 'display: none');
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(downloadUrl);
    link.remove();
  }

}
