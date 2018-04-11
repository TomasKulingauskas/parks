import { Component, OnInit } from '@angular/core';
import {
  Router,
  // import as RouterEvent to avoid confusion with the DOM Event
  Event as RouterEvent,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError
} from '@angular/router'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  showSpinner: boolean = true;

  constructor(private router: Router) {}

  ngOnInit(){
    this.router.events.subscribe( (event: RouterEvent) => {

      if (event instanceof NavigationStart) {
        this.showSpinner = true;
      }
      if (event instanceof NavigationEnd) {
        this.showSpinner = false;
      }

      // Set loading state to false in both of the below events to hide the spinner in case a request fails
      if (event instanceof NavigationCancel) {
        this.showSpinner = false;
      }
      if (event instanceof NavigationError) {
        this.showSpinner = false;
      }
    });
  }
}
