import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MapService } from './map.service.component';

describe('Map.ServiceComponent', () => {
  let component: MapService;
  let fixture: ComponentFixture<MapService>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
