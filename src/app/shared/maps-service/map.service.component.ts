import { Injectable} from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { BehaviorSubject } from 'rxjs/BehaviorSubject'


@Injectable()
export class MapService {
  hits = new BehaviorSubject([]);

  constructor(public db: AngularFireDatabase) {
  };


}
