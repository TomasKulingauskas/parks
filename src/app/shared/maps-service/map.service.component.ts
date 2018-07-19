import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

@Injectable()
export class MapService {
  constructor(public db: AngularFireDatabase) {
  }

  public getParks(start: BehaviorSubject<string>): Observable<any[]> {
    return start.switchMap(startText => {
      const endText = startText + '\uf8ff';
      return this.db
        .list('/parks', ref =>
          ref
            .orderByChild('name')
            .startAt(startText)
            .endAt(endText)
        )
        .snapshotChanges()
        .debounceTime(200)
        .distinctUntilChanged()
        .map(changes => {
          return changes.map(c => {
            return { key: c.payload.key, ...c.payload.val() };
          });
        });
    });
  }
}
