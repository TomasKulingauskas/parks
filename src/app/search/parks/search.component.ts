import {Component, OnInit, OnDestroy, ElementRef, ViewChild} from '@angular/core';
import {MapService} from "../../shared/maps-service/map.service.component";
import {Subscription} from "rxjs/Subscription";
import {Observable} from "rxjs/Rx";
import {FormControl, FormGroup, Validators} from '@angular/forms';
import 'rxjs/add/operator/debounceTime';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild('nElement') nElement: ElementRef;
  public query = '';
  public filteredList = [];
  latitude: number;
  longitude: number;
  userLatitude: number;
  userLongitude: number;
  zoom: number = 12;
  sports;
  filteredParks: any[] = [];
  markerClicked: boolean = false;
  itemDetails: any[] = [];
  inputDirty: boolean = false;
  radio: string = 'Parkai';
  distance;

  checkboxOptions = [
    {name: 'Aleksotas', checked: true},
    {name: 'Gričiupis', checked: false},
    {name: 'Šilainiai', checked: false},
  ];

  subscription: Subscription;

  constructor(public mapService: MapService) {
  };

  ngOnInit() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.userLatitude = position.coords.latitude;
        this.userLongitude = position.coords.longitude;
        this.latitude = this.userLatitude;
        this.longitude = this.userLongitude;
      });
    }
  }


  onFormSubmit(form) {
    this.filteredParks = [];
    this.sports = [];
    let subdistricts;
    let formValuesObj = form.value;
    subdistricts = Object.keys(formValuesObj).filter((key) => {
      if (key !== 'Parkai' && key !== 'Sporto aikštės') {
        return formValuesObj[key] === true;
      }
    });
    if (formValuesObj['selectType'] === 'Parkai' && subdistricts.length) {
      return this.getItems('/parks', subdistricts);
    } else if (formValuesObj['selectType'] === 'Parkai' && !subdistricts.length) {
      return this.getItems('/parks');
    }
    if (formValuesObj['selectType'] === 'Sporto aikštės' && subdistricts.length) {
      return this.getItems('/sports', subdistricts);
    } else if (formValuesObj['selectType'] === 'Sporto aikštės' && !subdistricts.length) {
      return this.getItems('/sports');
    }
  }

  getItems(path, subdistricts?) {
    if (!subdistricts) {
      this.mapService.db.list(path).valueChanges().subscribe(queriedItems => {
        if (path === '/parks') {
          return this.filteredParks = this.filteredParks.concat(queriedItems);
        }
        return this.sports = this.sports.concat(queriedItems);
      });
    } else {
      for (let i = 0; i < subdistricts.length; i++) {
        this.mapService.db.list(path, ref => ref.orderByChild('subdistrict').equalTo(subdistricts[i]))
          .valueChanges().subscribe(queriedItems => {
          if (path === '/parks') {
            return this.filteredParks = this.filteredParks.concat(queriedItems);
          }
          return this.sports = this.sports.concat(queriedItems);
        });
      }
    }
  }

  searchFilter(form) {
    this.query = this.query.toLowerCase().replace(/\b[a-z]/g, x => {
      return x.toUpperCase();
    });
    if (this.query.length > 0) {
      form.reset();
      console.log(this.query);
      this.mapService.db.list('/parks', ref =>
        ref.orderByChild('name')
          .startAt(this.query)
          .endAt(this.query + "\uf8ff"))
        .valueChanges()
        .debounceTime(1000)
        .subscribe(res => {
          console.log(res);
          console.log('list', this.filteredList);
          res.forEach(x => {
            if (!this.filteredList.length) {
              this.filteredList = this.filteredList.concat(x);
            }
          })
        });
    }
    if (!this.query.length) {
      this.filteredList = [];
    }
  }

  getDistance(lon1, lon2, lat1, lat2) {

  }

  select(item) {
    this.filteredParks = [];
    this.query = item.name;
    this.filteredParks = this.filteredParks.concat(item);
    this.longitude = this.filteredParks[0].longitude;
    this.latitude = this.filteredParks[0].latitude;
    this.filteredList = [];
  }

  onMarkerClick(item, lat, long) {
    let R = 6371; // km
    let x = (long - this.userLongitude) * Math.cos((lat + this.userLatitude) / 2);
    let y = (this.userLongitude - lat);
    this.distance = Math.sqrt(x * x + y * y) * R;
    this.markerClicked = !this.markerClicked;
    this.itemDetails = item;
    if (!this.markerClicked) {
      this.latitude = 54.89687210;
      this.longitude = 23.89242640;
      this.zoom = 12;
    } else {
      this.latitude = item.latitude;
      this.longitude = item.longitude;
      this.zoom = 17;
    }
  }

  onMouseOver(infoWindow) {
    infoWindow.open();
  }

  onMouseOut(infoWindow) {
    infoWindow.close();
  }

  handleClick(event) {
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

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

//   return this.mapService.db.list('/sports', ref => ref.orderByChild('subdistrict').equalTo(this.currentChecked))
// .valueChanges().subscribe(queriedSports => {
//   this.sports = this.sports.concat(queriedSports);
// })

}
