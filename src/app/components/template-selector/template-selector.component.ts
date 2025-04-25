import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef
} from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { Template } from '@models/template.model';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import {
  FilterParam,
  FolderHistoryData,
  FolderItem,
  ResourceListItem,
  TemplateItem,
  ITemplateItem
} from '@core/interfaces/resources.interface';
import { ResourceCategory, TemplateType } from '@core/enums/resources.enum';
import { TemplateListService } from '@services/template-list.service';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { TemplatesService } from '@app/services/templates.service';
import { USER_FEATURES } from '@app/constants/feature.constants';

@Component({
  selector: 'app-template-selector',
  templateUrl: './template-selector.component.html',
  styleUrls: ['./template-selector.component.scss']
})
export class TemplateSelectorComponent implements OnInit, OnDestroy {
  readonly USER_FEATURES = USER_FEATURES;
  templates: ResourceListItem<TemplateItem>[] = [];
  mat_type: ResourceCategory = ResourceCategory.TEMPLATE;

  currentFolder = '';
  parentFolder = '';

  isLoading = false;
  templateSubscription: Subscription;
  templateSearchStr = '';
  filterParam: FilterParam<TemplateType> = {};

  templatePortal: TemplatePortal;
  overlayRef: OverlayRef;
  @Input() type = 'text';
  @ViewChild('createNewContent') createNewContent: TemplateRef<unknown>;
  @ViewChild('mainDrop') dropdown: NgbDropdown;
  @Output() selectTemplate = new EventEmitter<TemplateItem>();
  changeTemplateSearchStr = new Subject<string>();
  constructor(
    private elRef: ElementRef,
    private service: TemplateListService,
    private templatesService: TemplatesService,
    private _viewContainerRef: ViewContainerRef,
    private appRef: ApplicationRef,
    private cdr: ChangeDetectorRef,
    private overlay: Overlay
  ) {
    this.changeTemplateSearchStr
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((keyword) => {
        this.filterParam.search = keyword;
        this.load();
      });
  }

  ngOnInit(): void {
    this.goToFolder();
  }

  ngOnDestroy(): void {
    this.templateSubscription && this.templateSubscription.unsubscribe();
  }

  goToFolder(folder?: string): void {
    this.filterParam.folder = folder || '';
    this.currentFolder = folder;
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.templateSubscription?.unsubscribe();
    this.templateSubscription = this.service
      .loadOwnList(this.filterParam)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.data) {
          this.templates = res.data.results;
          this.parentFolder = res.data.prevFolder;
          this.sort();
        }
      });
  }

  sort(): void {
    const folders = this.templates.filter((e) => e.item_type === 'folder');
    const files = this.templates.filter(
      (e) => e.item_type !== 'folder' && e.item_type == this.type
    );
    folders.sort((a, b) => (a.title > b.title ? 1 : -1));
    files.sort((a, b) => (a.title > b.title ? 1 : -1));
    this.templates = [...folders, ...files];
  }

  selectTemplateData(template: TemplateItem): void {
    this.dropdown.close();
    this.templatesService.read(template._id).subscribe((res) => {
      this.selectTemplate.emit(new TemplateItem(res));
    });
  }
  closeDropMenu(): void {
    this.dropdown.close();
  }

  createNewTemplate(): void {
    this.templatePortal = new TemplatePortal(
      this.createNewContent,
      this._viewContainerRef
    );
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        return;
      } else {
        this.overlayRef.attach(this.templatePortal);
        return;
      }
    } else {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'template-backdrop',
        panelClass: 'template-panel',
        width: '96vw',
        maxWidth: '480px'
      });
      this.overlayRef.overlayElement.classList.add('top-dialog');
      this.overlayRef.attach(this.templatePortal);
    }
  }

  closeOverlay(flag: boolean): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.detachBackdrop();
    }
    if (flag) {
      setTimeout(() => {
        this.appRef.tick();
        this.goToFolder('');
      }, 1);
    }
    this.cdr.detectChanges();
  }

  clearTemplateSearchStr(): void {
    this.templateSearchStr = '';
    this.changeTemplateSearchStr.next('');
  }
  toggleSearchFocus(isOpened: boolean) {
    console.log('isOpened');
    if (isOpened) {
      setTimeout(() => {
        const element = <HTMLElement>(
          this.elRef.nativeElement.querySelector('[name="search"]')
        );
        element && element.focus();
      }, 100);
    }
  }
}
