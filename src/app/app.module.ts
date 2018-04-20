import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireModule } from 'angularfire2';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { environment } from './../environments/environment';
import { HttpClientModule } from "@angular/common/http";
import { AgmCoreModule } from '@agm/core';

import { AppComponent } from './app.component';
import { MapService } from './shared/maps-service/map.service.component';
import { LoadingSpinnerComponent } from './shared/loading-spinner/loading-spinner.component';
import { SearchComponent } from './search/search.component';
import { Routes, RouterModule } from "@angular/router";

const appRoutes: Routes = [
  { path: '', component: SearchComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LoadingSpinnerComponent,
    SearchComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    RouterModule.forRoot(appRoutes),
    HttpClientModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCQnE3PsrkoE9dPI9-T5JjzJKm7SGuKSOQ'
    })
  ],
  providers: [MapService],
  bootstrap: [AppComponent]
})
export class AppModule { }
