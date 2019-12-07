import { Component, OnInit } from '@angular/core';
import { MemoryCard } from '../memory-card';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {
  memoryCard: MemoryCard;

  constructor() { 
    
    console.log(this.memoryCard);
  }

  ngOnInit() {
  }

}
