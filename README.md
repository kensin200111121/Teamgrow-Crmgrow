# Crmgrow

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.6.

## How to install the project on Local.

### Node Version
Node version is `18.x`
After node version switching using `nvm use 18`, please execute the `yarn cache clean`.

### How to install the package
Run the `yarn install` command.

### How to run the project
#### crmgrow standalone mode
Please use `yarn start` command to run the project as crmgrow standalone
It will use the `environment.ts` file for the project environment.
After running, you can visit the `http://localhost:4200`.

#### Vortex sub mode
Please use `yarn start:dev-sspa` command to run the project for the vortex sub module
It will use the `environment.dev-sspa.ts` file for the project environment.
After running, you can use the `http://localhost:4200/main.js`.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Project Structure

- App Module + App Routing Module (This is the Top Parent Module of the project)
- App Module has App components and Two main Components (Admin-Layout, Auth-Layout)
- App Module consists of two Sub Module (Admin-Layout Module, Auth-Layout Module)
- All Components would be defined in Components Module
- SharedModule is included in three modules (Admin Layout Module, Auth Layout Module, ComponetsModule)

## How to create component

- ng g c components/[component-name]
- Add new component in exports array in ComponentsModule

## How to create Page

- ng g c pages/[page-name] --module=[parent-module-folder]/[parent-module-name]  
ex: ng g c pages/settings --module=layouts/admin-layout

- Add route in admin-layout.routing.module.ts

## Create Pipe / Services / Directives / ..

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Which Main Module is imported.

- Angular CLI Version (10.0.6)
- Add Angular material
ng add @angular/material
- Add Bootstrap
ng add @ng-bootstrap

## How to run the project

- Angular Cli Version (10.0.6)
- npm install ( package install )
- npm run start ( ng serve --port=4201 )


## Components

### Contact Select Component (Contact Search Component)

```
Usage:   
<app-select-contact [resultItem]="result" (onSelect)="changeContact($event)">
  <ng-template #result let-data>
    <div>{{data | json}}</div>
  </ng-template>
</app-select-contact>

<app-select-contact (onSelect)="changeContact($event)">
</app-select-contact>


Input: 
  placeholder: String (form)
  formPlaceholder: String (for dropdown search form)
  mustField: string (indicate the field name that the searched contact must include)
  resultItem: ngTemplate (Please reference above first code example -> You can define the style of the selected contact)
```

### Contact Input Component (Contact Multiple Select Component)
```

```

### How to build the custom form control accessor