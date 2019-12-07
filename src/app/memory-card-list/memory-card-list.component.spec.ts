import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryCardListComponent } from './memory-card-list.component';

describe('MemoryCardListComponent', () => {
  let component: MemoryCardListComponent;
  let fixture: ComponentFixture<MemoryCardListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MemoryCardListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemoryCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
