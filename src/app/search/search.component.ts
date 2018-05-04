import {Component, OnInit, OnDestroy, ElementRef, ViewChild} from '@angular/core';
import {MapService} from "../shared/maps-service/map.service.component";
import {Subscription} from "rxjs/Subscription";
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/catch';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Observable} from "rxjs/Rx"

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild('nElement') nElement: ElementRef;
  @ViewChild('content') modal_content: ElementRef;

  public query = '';
  public filteredList = [];
  latitude: number;
  longitude: number;
  userLatitude: number;
  userLongitude: number;
  zoom: number = 12;
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

    this.userLatitude = 54.898521;
    this.userLongitude = 23.903597;
    this.latitude = this.userLatitude;
    this.longitude = this.userLongitude;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        console.log(this.userLatitude);
        console.log(this.userLongitude);

        this.latitude = this.userLatitude;
        this.longitude = this.userLongitude;
      });
    }
    this.subscription.add(this.getItems);
    this.subscription.add(this.onFormSubmit);
    this.subscription.add(this.searchFilter);
  }

  onFormSubmit(form): Subscription {
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
      return this.getItems('/parks', subdistricts);
    } else if (formValuesObj['selectType'] === 'Parkai' && !subdistricts.length) {
      this.parkFlag = true;
      return this.getItems('/parks');
    }
    if (formValuesObj['selectType'] === 'Sporto aikštės' && subdistricts.length) {
      this.parkFlag = false;
      return this.getItems('/sports', subdistricts);
    } else if (formValuesObj['selectType'] === 'Sporto aikštės' && !subdistricts.length) {
      this.parkFlag = false;
      return this.getItems('/sports');
    }
  }

  getItems(path, subdistricts?): Subscription {
    if (!subdistricts) {
      return this.mapService.db.list(path)
        .valueChanges()
        .subscribe(queriedItems => {
            this.showSpinner = false;
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
            this.showSpinner = false;
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
    if (this.query.length > 0) {
      return this.mapService.db.list('/parks', ref =>
        ref.orderByChild('name')
          .startAt(this.query)
          .endAt(this.query + '\uf8ff'))
        .valueChanges()
        .subscribe(res => {
            res.forEach(x => {
              if (!this.filteredList.length) {
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
    this.resetSearchResults();
    this.query = item.name;
    this.filteredParks = this.filteredParks.concat(item);
    this.longitude = this.filteredParks[0].longitude;
    this.latitude = this.filteredParks[0].latitude;
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

  public resetSearchResults(): void {
    this.sports = [];
    this.filteredList = [];
    this.filteredParks = [];
    this.markerClicked = false;
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

  handleClick(event) {
    // this.markerClicked = false;
    let clickedComponent = event.target;
    let inside = false;
    do {
      if (clickedComponent === this.nElement.nativeElement) {
        inside = true;
      }
      clickedComponent = clickedComponent.parentNode;
    } while (clickedComponent);
    if (!inside) {
      this.filteredList = [];
    }
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
}
