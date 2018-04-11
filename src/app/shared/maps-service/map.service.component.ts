import { Injectable} from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as GeoFire from "geofire";
import { BehaviorSubject } from 'rxjs/BehaviorSubject'


@Injectable()
export class MapService {
  hits = new BehaviorSubject([]);

  constructor(public db: AngularFireDatabase) {
  };


}
