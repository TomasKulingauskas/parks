import { Injectable} from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import {Observable, BehaviorSubject} from "rxjs/Rx"
import "rxjs/add/operator/switchMap";
import "rxjs/add/observable/zip";

@Injectable()
export class MapService {
  constructor(public db: AngularFireDatabase) {}
}
