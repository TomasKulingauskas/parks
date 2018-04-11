// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyCQnE3PsrkoE9dPI9-T5JjzJKm7SGuKSOQ",
    authDomain: "kaunas-app.firebaseapp.com",
    databaseURL: "https://kaunas-app.firebaseio.com",
    projectId: "kaunas-app",
    storageBucket: "kaunas-app.appspot.com",
    messagingSenderId: "91792972125"
  }
};
