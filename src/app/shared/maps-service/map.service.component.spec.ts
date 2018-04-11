import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Map.ServiceComponent } from './map.service.component';

describe('Map.ServiceComponent', () => {
  let component: Map.ServiceComponent;
  let fixture: ComponentFixture<Map.ServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Map.ServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Map.ServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
