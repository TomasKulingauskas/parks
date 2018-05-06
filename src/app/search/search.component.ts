import {Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener} from '@angular/core';
import {MapService} from "../shared/maps-service/map.service.component";
import {Subscription} from "rxjs/Subscription";
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Observable} from "rxjs/Rx"
import { GoogleMapsAPIWrapper, AgmMap, LatLngBounds, LatLngBoundsLiteral} from '@agm/core';

declare let google: any;

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild('content') modal_content: ElementRef;
  @ViewChild('AgmMap') map: any;

  public query = '';
  public filteredList = [];
  userLatitude: number;
  userLongitude: number;
  defaultZoom: number;
  sports;
  filteredParks: any[] = [];
  markerClicked = false;
  item: any[] = [];
  radio = 'Parkai';
  distance;
  parkFlag: boolean;
  showSpinner = false;
  online$: Observable<boolean>;
  errorMessage: string;
  currentMapLat: number;
  currentMapLon: number;
  kaunasLat = 54.898521;
  kaunasLon = 23.903597;

  checkboxOptions = [
    {name: 'Aleksotas', checked: false},
    {name: 'Centras', checked: false},
    {name: 'Dainava', checked: false},
    {name: 'Eiguliai', checked: false},
    {name: 'Gričiupis', checked: false},
    {name: 'Panemunė', checked: false},
    {name: 'Petrašiūnai', checked: false},
    {name: 'Šančiai', checked: false},
    {name: 'Šilainiai', checked: false},
    {name: 'Vilijampolė', checked: false},
    {name: 'Žaliakalnis', checked: false},
  ];

  subscription: Subscription = new Subscription();

  constructor(public mapService: MapService, private http: HttpClient, private modalService: NgbModal) {
    this.online$ = Observable.merge(
      Observable.of(navigator.onLine),
      Observable.fromEvent(window, 'online').mapTo(true),
      Observable.fromEvent(window, 'offline').mapTo(false)
    );
  }

  ngOnInit() {
    this.online$.subscribe(online => {
      if (!online) {
        this.errorMessage = 'Nėra ryšio';
        this.openModal(this.modal_content);
      }
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        console.log(position);
        this.userLatitude = position.coords.latitude;
        this.userLongitude = position.coords.longitude;
      });
    }
    this.defaultZoom = 12;
    this.currentMapLat = this.kaunasLat;
    this.currentMapLon = this.kaunasLon;

    this.subscription.add(this.getItems);
    this.subscription.add(this.searchFilter);
  }

  onFormSubmit(form): void {
    this.markerClicked = false;
    this.parkFlag = undefined;
    this.filteredParks = [];
    this.sports = [];
    let subdistricts;
    const formValuesObj = form.value;
    subdistricts = Object.keys(formValuesObj).filter((key) => {
      if (key !== 'Parkai' && key !== 'Sporto aikštės') {
        return formValuesObj[key] === true;
      }
    });
    if (formValuesObj['selectType'] === 'Parkai' && subdistricts.length) {
      this.parkFlag = true;
      this.getItems('/parks', subdistricts);
    } else if (formValuesObj['selectType'] === 'Parkai' && !subdistricts.length) {
      this.parkFlag = true;
      this.getItems('/parks');
    }
    if (formValuesObj['selectType'] === 'Sporto aikštės' && subdistricts.length) {
      this.parkFlag = false;
      this.getItems('/sports', subdistricts);
    } else if (formValuesObj['selectType'] === 'Sporto aikštės' && !subdistricts.length) {
      this.parkFlag = false;
      this.getItems('/sports');
    }
  }

  getItems(path, subdistricts?): Subscription {
    if (!subdistricts) {
      return this.mapService.db.list(path)
        .valueChanges()
        .subscribe(queriedItems => {
            this.resetMapPositon(queriedItems);
            if (path === '/parks') {
             return this.filteredParks = this.filteredParks.concat(queriedItems);
            }
            return this.sports = this.sports.concat(queriedItems);
          },
          error => {
            this.handleError(error);
          });
    } else {
      for (let i = 0; i < subdistricts.length; i++) {
        this.mapService.db.list(path, ref => ref.orderByChild('subdistrict').equalTo(subdistricts[i]))
          .valueChanges().subscribe(queriedItems => {
            this.resetMapPositon(queriedItems, subdistricts.length);
            if (path === '/parks') {
              return this.filteredParks = this.filteredParks.concat(queriedItems);
            }
            return this.sports = this.sports.concat(queriedItems);
          },
          error => {
            this.handleError(error);
          });
      }
    }
  }

  searchFilter(form): Subscription {
    this.query = this.query.toLowerCase().replace(/\b[a-z]/g, x => {
      return x.toUpperCase();
    });
    if (!this.query.length) {
      this.resetSearchResults();
      this.parkFlag = undefined;
    }
    if (this.query.length > 1) {
      return this.mapService.db.list('/parks', ref =>
        ref.orderByChild('name')
          .startAt(this.query)
          .endAt(this.query + '\uf8ff'))
        .valueChanges()
        .debounceTime(1000)
        .subscribe(res => {
            res.forEach(x => {
              if (!this.checkItemInList(x) && this.query.length > 1) {
               this.parkFlag = true;
               this.filteredList = this.filteredList.concat(x);
             }
            });
          },
          error => {
            this.handleError(error);
        });
    }
  }

  private resetMapPositon(items, subdistrictsCount?): void {
    this.showSpinner = false;
    if (!subdistrictsCount || subdistrictsCount > 1) {
      this.setCenter(this.kaunasLat, this.kaunasLon);
    } else if (subdistrictsCount === 1) {
      this.setCenter(items[items.length - 1]['latitude'], items[items.length - 1]['longitude']);
    }
  }

  private checkItemInList(item): boolean {
      let itemFound = false;
      if (this.filteredList.length) {
       this.filteredList.forEach(x => {
         if (item['name'] === x['name']) {
           itemFound = true;
         } 
       })
      return itemFound;
    } 
    return false; 
  }

  public convertToRadians(x): number {
    return x * Math.PI / 180;
  }

  public getDistance(lon1, lon2, lat1, lat2): number {
    const R = 6378137; // Earth’s mean radius in meter
    const dLat = this.convertToRadians(lat2 - lat1);
    const dLong = this.convertToRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.convertToRadians(lat1)) * Math.cos(this.convertToRadians(lat2)) *
      Math.sin(dLong / 2) * Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    this.distance = ((R * c) / 1000).toFixed(2);
    return this.distance;
  }

  select(item): void {
    this.resetSearchResults(true);
    this.query = item.name;
    this.filteredParks = this.filteredParks.concat(item);
    this.currentMapLon = this.filteredParks[0].longitude;
    this.currentMapLat = this.filteredParks[0].latitude;
  }

  public fbShareLink(lat, lon): void {
    const strLink = 'https://www.facebook.com/sharer/sharer.php?u=https://www.google.com/maps/place/' +
      lat + ',' + lon + '/@' + lat + ',' + lon + '12z/data=!3m1!1e3';
    document.getElementById('link').setAttribute('href', strLink);
  }

  onMarkerClick(item, itemLat, itemLong): void {
    this.markerClicked = true;
    this.item = item;
    this.getDistance(this.userLongitude, itemLong, this.userLatitude, itemLat);
  }

  public getSportIcon(sport): string {
    console.log(sport[0]);
    if (sport[0] + sport[1] === 'Kr') {
      return '/assets/basketball-icon.png';
    }
    if (sport[0] === 'F') {
      return '/assets/soccer-ball-icon.png';
    }
    if (sport[0] === 'T') {
      return '/assets/blue_MarkerT.png';
    }
    return '/assets/blue_MarkerX.png';
  }

  public resetSearchResults(parkNameSelected?): void {
    this.sports = [];
    this.filteredList = [];
    this.filteredParks = [];
    this.markerClicked = false;
    if (!parkNameSelected) {
      this.redrawMap();
    }
  }

  public resetForm(form): void {
    this.resetSearchResults();
    form.reset({'selectType': 'Parkai'});
    this.query = '';
  }

  onMouseOver(infoWindow): void {
    infoWindow.open();
  }

  onMouseOut(infoWindow): void {
    infoWindow.close();
  }

@HostListener('document:click', ['$event'])
  handleClick(event) {
      this.filteredList = [];
  }

  private handleError(error: any) {
    this.showSpinner = false;
    this.errorMessage = error.message;
    this.openModal(this.modal_content);
  }

  private openModal(content) {
    this.modalService.open(content, {centered: true, size: 'sm'});
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  //  ngAfterViewInit() {
  //   console.log(this.map);
  //   this.map.mapReady.subscribe(map => {
  //     const bounds: LatLngBounds = new google.maps.LatLngBounds();
  //     map.fitBounds(bounds);
  //   });
  // }

  // @HostListener('window:resize', ['$event'])
  // onWindowResize(event) {
  //     if (this.filteredParks && this.filteredParks.length) {
  //       this.currentMapLat = this.filteredParks[0].latitude;
  //       this.currentMapLon = this.filteredParks[0].longitude;
  //     } else if (this.sports && this.sports.length) {
  //       this.currentMapLat = this.sports[0].latitude;
  //       this.currentMapLon = this.sports[0].longitude;
  //     } else {
  //       this.currentMapLat = this.kaunasLat;
  //       this.currentMapLon = this.kaunasLon;
  //   }
  // }

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

  private setCenter(lat: number, lon: number): void {
    this.map.triggerResize()
      .then(() => this.map._mapsWrapper.setCenter({lat: lat, lng: lon}));
  }

  private setZoom(zoom: number): Promise<void> {
    return this.map.triggerResize().then(() => this.map._mapsWrapper.setZoom(zoom));
  }

  @HostListener('window:resize', ['$event'])
  public onResize(event) {
    this.redrawMap();
  }
}
