import {
  Component,
  OnInit,
  Output,
  ViewChild,
  EventEmitter
} from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { Router } from '@angular/router';
import { MaterialNavigateService } from '@app/services/material-navigate.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-materials-navigation',
  templateUrl: './materials-navigation.component.html',
  styleUrls: ['./materials-navigation.component.scss']
})
export class MaterialsNavigationComponent implements OnInit {
  @ViewChild(MatAccordion) accordion: MatAccordion;
  @Output() close = new EventEmitter(false);
  activeFolderIdSubscription: Subscription;

  isLibraryRoot = false;
  isLibraryExpanded = true;
  isOwnRoot = true;
  isOwnExpanded = true;

  constructor(
    private router: Router,
    public materialNavigateService: MaterialNavigateService
  ) {}

  ngOnInit(): void {
    this.activeFolderIdSubscription?.unsubscribe();
    this.activeFolderIdSubscription =
      this.materialNavigateService.activeFolder$.subscribe((_activeFolder) => {
        //active root section when root is selected on Main view's app folder tree list
        if(!_activeFolder){
          if(this.router.url.includes('own') && !this.isOwnRoot){
            this.isOwnRoot = true
          } else if(this.router.url.includes('library') && !this.isLibraryRoot){
            this.isLibraryRoot = true
          }
        }      
      });
  }

  gotoRoot(event: any, page: string) {
    event.preventDefault();
    event.stopPropagation();
    if (page === 'own') {
      this.isOwnRoot = true;
      this.isLibraryRoot = false;
    } else {
      this.isOwnRoot = false;
      this.isLibraryRoot = true;
    }
    this.materialNavigateService.activeFolder.next(null);
    this.router.navigate(['/materials/' + page + '/root']);
  }

  closeNav(event: any) {
    event.preventDefault();
    this.close.emit(true);
  }

  setIsExpanded(type: string, flag: boolean): void {
    if (type === 'library') {
      this.isLibraryExpanded = flag;
    } else {
      this.isOwnExpanded = flag;
    }
  }

  unsetRoot() {
    this.isOwnRoot = false;
    this.isLibraryRoot = false;
  }
}
