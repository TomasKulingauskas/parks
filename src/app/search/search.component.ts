import {
  Component,
  Output,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
  OnChanges,
  EventEmitter
} from '@angular/core';
import { MapService } from '../shared/maps-service/map.service.component';
import { Subscription } from 'rxjs/Subscription';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import { GoogleMapsAPIWrapper, AgmMap, LatLngBounds, LatLngBoundsLiteral } from '@agm/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild('content') modal_content: ElementRef;
  @ViewChild('AgmMap') map: any;
  @ViewChild('infoWindow') infoWindow: any;

  public userLatitude: number;
  public userLongitude: number;
  public sports = [];
  public filteredParks: any[] = [];
  public markerClicked = false;
  public item: any[];
  public distance: number;
  public parkFlag: boolean;
  public showSpinner = true;
  public online$: Observable<boolean>;
  public errorMessage: string;
  public kaunasLat = 54.898521;
  public kaunasLon = 23.903597;
  public currentZoom: number;
  public form: FormGroup;
  public userInputs$: Observable<string[]>;
  public parks$: Observable<any[]>;
  public startAt: BehaviorSubject<string | null> = new BehaviorSubject('');
  public showDropDown = false;
  public subscription: Subscription = new Subscription();
  public dropdownOptions = [
    'Aleksotas',
    'Centras',
    'Dainava',
    'Eiguliai',
    'Gričiupis',
    'Panemunė',
    'Petrašiūnai',
    'Šančiai',
    'Šilainiai',
    'Vilijampolė',
    'Žaliakalnis',
    'Visi'
  ];

  public sportActivity = [
   'Krepšinis',
   'Futbolas',
   'Tinklinis',
   'Kita',
   'Visi'
  ];

  private selectedRadio$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private selectedDropdown$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private selectedSportActivity$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(public mapService: MapService, private http: HttpClient, private modalService: NgbModal) {
    this.online$ = Observable.merge(
      Observable.of(navigator.onLine),
      Observable.fromEvent(window, 'online').mapTo(true),
      Observable.fromEvent(window, 'offline').mapTo(false)
    );
  }

  public ngOnInit() {
    this.createForm();
    this.subscription.add(this.online$.subscribe(online => {
      if (!online) {
        this.form.disable();
        this.errorMessage = 'Nėra ryšio';
        this.openModal(this.modal_content);
      } else {
        this.form.enable();
      }
    }));

    this.setZoom(12);
    this.setCenter(this.kaunasLat, this.kaunasLon);

    this.parks$ = this.mapService
      .getParks(this.startAt);

    this.subscription.add(this.map._mapsWrapper.subscribeToMapEvent('zoom_changed').subscribe(() => {
      this.map._mapsWrapper.getZoom().then((zoom: number) => {
        this.currentZoom = zoom;
      });
    }));
    
    this.subscription.add(this.updateRadioValue());
    this.subscription.add(this.updateDropdownValue());
    this.subscription.add(this.updateSportActivityValue());
    this.userInputs$ = this.selectUserInputs();
    this.subscription.add(this.subscribeUserInputs());

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
          this.userLatitude = pos.coords.latitude;
          this.userLongitude = pos.coords.longitude;
        }, error => {
          console.warn(`ERROR(${error.code}): ${error.message}`);
        },
        {
          maximumAge: 60000,
          timeout: 10000,
          enableHighAccuracy: true
        });
    }
  }

  private createForm() {
    this.form = new FormGroup({
      radioValue: new FormControl('/parks', Validators.required),
      sportActivity: new FormControl('Krepšinis'),
      subdistrictValue: new FormControl('Aleksotas', Validators.required),
    });
    this.selectedRadio$.next(this.form.controls.radioValue.value);
    this.selectedDropdown$.next(this.form.controls.subdistrictValue.value);
    this.selectedSportActivity$.next(this.form.controls.sportActivity.value);
  }

  public setLoading(loading: boolean): void {
    this.showSpinner = loading;
  }

  private updateRadioValue(): Subscription {
    return this.form.controls.radioValue.valueChanges.subscribe(this.selectedRadio$);
  }

  private updateDropdownValue(): Subscription {
    return this.form.controls.subdistrictValue.valueChanges.subscribe(this.selectedDropdown$);
  }

  private updateSportActivityValue(): Subscription {
    return this.form.controls.sportActivity.valueChanges.subscribe(this.selectedSportActivity$);
  }

  private selectUserInputs(): Observable<string[]> {
    return Observable.combineLatest(
      this.selectedDropdown$,
      this.selectedRadio$,
      this.selectedSportActivity$,
    ).map(([dropdown, radio, activity]) => {
      return [dropdown, radio, activity];
    });
  }

  private subscribeUserInputs(): Subscription {
    return this.userInputs$.subscribe(inputs => {
      this.getData(inputs[1], inputs[0], inputs[2]);
    });
  }

  private getData(path: string, subdistricts: string, sportActivity?: string): Subscription {
    if (subdistricts === 'Visi') {
      return this.mapService.db.list(path)
        .valueChanges()
        .take(1)
        .subscribe(queriedItems => {
            this.resetMapPosition(queriedItems, true);
            if (path === '/parks') {
              this.parkFlag = true;
              this.sports = [];
              return this.filteredParks = queriedItems;
            }
            this.parkFlag = false;
            this.filteredParks = [];
            return this.sports = this.filterSports(queriedItems, sportActivity);
          },
          error => {
            this.handleError(error);
          });
    }
    return this.mapService.db.list(path, ref => ref.orderByChild('subdistrict').equalTo(subdistricts))
      .valueChanges().take(1).subscribe(queriedItems => {
          this.resetMapPosition(queriedItems);
          if (path === '/parks') {
            this.parkFlag = true;
            this.sports = [];
            return this.filteredParks = queriedItems;
          }
          this.parkFlag = false;
          this.filteredParks = [];
          return this.sports = this.filterSports(queriedItems, sportActivity);
        },
        error => {
          this.handleError(error);
     });
  }

  public filterSports(items: Array<{}>, activity: string): Array<{}> {
    let filtered = [];
      if (activity === 'Krepšinis') {
         items.forEach(item => {
           if (item['name'] === 'Krepšinio aikštė') {
             filtered.push(item);
           }
         })
         return filtered;
      }
       if (activity === 'Futbolas') {
         items.forEach(item => {
           if (item['name'] === 'Futbolo aikštė') {
             filtered.push(item);
           }
         })
         return filtered;
      }
        if (activity === 'Tinklinis') {
         items.forEach(item => {
           if (item['name'] === 'Tinklinio aikštė') {
             filtered.push(item);
           }
         })
         return filtered;
      }
      if (activity === 'Kita') {
          items.forEach(item => {
           if (item['name'] !== 'Tinklinio aikštė' && item['name'] !== 'Krepšinio aikštė' && 
             item['name'] !== 'Futbolo aikštė') {
             filtered.push(item);
           }
         })
         return filtered;
      }
      if (activity === 'Visi') {
        return items;
      }
     }
  

  public search(searchText: string) {

    if (searchText === 'š' || searchText === 'Š' || searchText === 'Ą' || searchText === 'ą') {
      this.startAt.next(searchText.toUpperCase());
    } else {
      searchText.toLowerCase().replace(/\b[a-za-ža]/g, x => {
        return x;
      });
      console.log('searchText', searchText);
     this.startAt.next(searchText);
    }

  }

  private resetMapPosition(items: Array<{}>, all = false): void {
    this.setLoading(false);
    this.setZoom(12);
    if (all) {
      this.setCenter(this.kaunasLat, this.kaunasLon);
    } else {
      this.setCenter(items[items.length - 1]['latitude'], items[items.length - 1]['longitude']);
    }
  }

  private convertToRadians(x: number): number {
    return x * Math.PI / 180;
  }

  private getDistance(lon1: number, lon2: number, lat1: number, lat2: number): number {
    const R = 6378137; // Earth’s mean radius in meter
    const dLat = this.convertToRadians(lat2 - lat1);
    const dLong = this.convertToRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.convertToRadians(lat1)) * Math.cos(this.convertToRadians(lat2)) *
      Math.sin(dLong / 2) * Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    this.distance = Math.round(((R * c) / 1000));
    return this.distance;
  }

  public select(item: any): void {
    this.resetSearchResults(true);
    this.filteredParks = this.filteredParks.concat(item);
    this.setCenter(item.latitude, item.longitude);
    this.setZoom(16);
    this.showDropDown = false;
  }

  public fbShareLink(lat: number, lon: number): void {
    const strLink = 'https://www.facebook.com/sharer/sharer.php?u=https://www.google.com/maps/place/' +
      lat + ',' + lon + '/@' + lat + ',' + lon + '12z/data=!3m1!1e3';
    document.getElementById('link').setAttribute('href', strLink);
  }

  public onMarkerClick(item: any, itemLat: number, itemLong: number): void {
    this.markerClicked = true;
    this.item = item;
    this.setCenter(item.latitude, item.longitude);
    this.setZoom(16);
    this.getDistance(this.userLongitude, itemLong, this.userLatitude, itemLat);
  }

  public resetSearchResults(parkNameSelected?: boolean): void {
    this.sports = [];
    this.filteredParks = [];
    this.markerClicked = false;
    if (!parkNameSelected) {
      this.redrawMap();
    }
  }

  public onMouseOver(infoWindow): void {
    infoWindow.open();
  }

  public onMouseOut(infoWindow): void {
    infoWindow.close();
  }

  private handleError(error: any) {
    this.showSpinner = false;
    this.errorMessage = error.message;
    this.openModal(this.modal_content);
  }

  private openModal(content) {
    this.modalService.open(content, { centered: true, size: 'sm' });
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private redrawMap() {
    let lat;
    let lon;
    if (this.filteredParks && this.filteredParks.length) {
      lat = this.filteredParks[this.filteredParks.length - 1].latitude;
      lon = this.filteredParks[this.filteredParks.length - 1].longitude;
    } else if (this.sports && this.sports.length) {
      lat = this.sports[this.sports.length - 1].latitude;
      lon = this.sports[this.sports.length - 1].longitude;
    } else {
      lat = this.kaunasLat;
      lon = this.kaunasLon;
    }
    this.setCenter(lat, lon);
    this.setZoom(12);
  }

  public setCenter(lat: number, lon: number): void {
    this.map.triggerResize()
      .then(() => this.map._mapsWrapper.setCenter({ lat: lat, lng: lon }));
  }

  public setZoom(zoom: number): void {
    this.map.triggerResize().then(() => this.map._mapsWrapper.setZoom(zoom));
  }

  @HostListener('window:resize', ['$event'])
  public onResize(event) {
    this.redrawMap();
  }
}
