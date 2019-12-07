import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryCardDetailComponent } from './memory-card-detail.component';

describe('MemoryCardDetailComponent', () => {
  let component: MemoryCardDetailComponent;
  let fixture: ComponentFixture<MemoryCardDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MemoryCardDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemoryCardDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
