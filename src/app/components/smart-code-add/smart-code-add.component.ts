import { SspaService } from '../../services/sspa.service';
import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Automation } from '@models/automation.model';
import { Garbage } from '@models/garbage.model';
import { SmartCode } from '@models/smart-code.model';
import { UserService } from '@services/user.service';
import { environment } from '@environments/environment';
import { HelperService } from '@services/helper.service';
import { StoreService } from '@services/store.service';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { SegmentedMessage } from 'sms-segments-calculator';

@Component({
  selector: 'app-smart-code-add',
  templateUrl: './smart-code-add.component.html',
  styleUrls: ['./smart-code-add.component.scss']
})
export class SmartCodeAddComponent implements OnInit {
  readonly USER_FEATURES = USER_FEATURES;
  updateGarbageSubscription: Subscription;

  garbage: Garbage;
  originalCode = '';

  smartCode: SmartCode = new SmartCode();
  tags: string[] = [];
  creating = false;

  isNew = true;
  isValidCode = true;
  isShowAutomation = true;
  codeErrorMsg = '';
  selectedAutomation = '';
  selectedAutomationDetail: Automation;
  set = 'twitter';
  segments = 0;
  redirectArticleURL =
    'https://kb1.crmgrow.com/kb/guide/en/sms-texting-character-limits-8DWOLjE5ZS/Steps/4023017';
  @ViewChild('messageText') messageText: ElementRef;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<SmartCodeAddComponent>,
    private userService: UserService,
    private storeService: StoreService,
    private helperService: HelperService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {
    if (this.data && this.data.garbage) {
      this.garbage = new Garbage().deserialize(this.data.garbage);
      if (!this.garbage.smart_codes) {
        this.garbage.smart_codes = {};
      }

      if (this.data.smartCode) {
        this.isNew = false;
        this.originalCode = this.data.smartCode.code;
        this.smartCode.deserialize(this.data.smartCode);
        if (this.smartCode.tag) {
          this.tags = this.smartCode.tags;
        }
        if (this.smartCode.automation) {
          this.selectedAutomation = this.smartCode.automation;
        }
      }
    }
    if (!this.smartCode.message) this.smartCode.message = '';
  }

  ngOnInit(): void {}

  validateCode(evt: any): void {
    if (!evt) {
      return;
    }

    const result = /\s/.test(String(evt).toLowerCase());
    if (result) {
      this.isValidCode = false;
      this.codeErrorMsg = 'Space is not allowed';
      return;
    }

    const smart_codes = this.garbage.smart_codes;
    if (evt != this.originalCode && smart_codes[evt]) {
      this.isValidCode = false;
      this.codeErrorMsg = 'Code is already exist';
      return;
    }

    this.isValidCode = true;
    this.codeErrorMsg = '';
  }

  submit(): void {
    this.creating = true;

    const smart_codes = this.garbage.smart_codes;
    if (
      this.originalCode &&
      this.originalCode.toLowerCase() != this.smartCode.code.toLowerCase()
    ) {
      // original code is chagned
      delete smart_codes[this.originalCode];
    }

    if (this.selectedAutomation) {
      smart_codes[this.smartCode.code.toLowerCase()] = {
        tag: this.tags.join(','),
        message: this.smartCode.message,
        automation: this.selectedAutomation
      };
    } else {
      smart_codes[this.smartCode.code.toLowerCase()] = {
        tag: this.tags.join(','),
        message: this.smartCode.message
      };
    }

    const { videoIds, pdfIds, imageIds, materials } =
      this.helperService.getSMSMaterials(this.smartCode.message);
    this.smartCode['video_ids'] = videoIds;
    this.smartCode['pdf_ids'] = pdfIds;
    this.smartCode['image_ids'] = imageIds;
    smart_codes[this.smartCode.code.toLowerCase()]['video_ids'] = videoIds;
    smart_codes[this.smartCode.code.toLowerCase()]['pdf_ids'] = pdfIds;
    smart_codes[this.smartCode.code.toLowerCase()]['image_ids'] = imageIds;
    const ownMaterials = this.storeService.materials.getValue();
    let firstMaterialDoc;
    if (materials.length) {
      const firstMaterial = materials[0];
      firstMaterialDoc = ownMaterials.find((e) => e._id === firstMaterial._id);
    }

    const newDoc = {
      tag: this.tags.join(','),
      message: this.smartCode.message,
      automation: this.selectedAutomation,
      automation_detail: this.selectedAutomationDetail,
      code: this.smartCode.code.toLowerCase(),
      type: firstMaterialDoc?.material_type,
      preview: firstMaterialDoc?.preview,
      thumbnail: firstMaterialDoc?.thumbnail,
      material_count: materials.length,
      video_ids: this.smartCode.video_ids,
      pdf_ids: this.smartCode.pdf_ids,
      image_ids: this.smartCode.image_ids
    };

    this.updateGarbageSubscription &&
      this.updateGarbageSubscription.unsubscribe();
    this.updateGarbageSubscription = this.userService
      .updateGarbage({
        smart_codes
      })
      .subscribe((status) => {
        this.creating = false;
        if (status) {
          this.dialogRef.close({
            data: newDoc,
            code: this.originalCode
          });
        }
      });
  }

  selectAutomation(evt: Automation): void {
    if (evt) {
      this.selectedAutomationDetail = evt;
      this.selectedAutomation = evt._id;
    } else {
      this.selectedAutomationDetail = null;
      this.selectedAutomation = '';
    }
  }

  openMaterialsDlg(): void {
    const { videoIds, imageIds, pdfIds } = this.helperService.getSMSMaterials(
      this.smartCode.message
    );
    const selectedMaterials = [...videoIds, ...imageIds, ...pdfIds].map((e) => {
      return { _id: e };
    });
    const materialDialog = this.dialog.open(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        title: 'Select Material',
        multiple: true,
        hideMaterials: selectedMaterials
      }
    });
    materialDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials && res.materials.length) {
        res.materials.forEach((e, index) => {
          let url;
          switch (e.material_type) {
            case 'video':
              url = `${environment.website}/video/${e._id}`;
              break;
            case 'pdf':
              url = `${environment.website}/pdf/${e._id}`;
              break;
            case 'image':
              url = `${environment.website}/image/${e._id}`;
              break;
          }
          // first element insert
          if (
            index === 0 &&
            (!this.smartCode.message ||
              this.smartCode.message.slice(-1) === '\n')
          ) {
            this.smartCode.message = this.smartCode.message + '\n' + url;
            return;
          }
          if (index === 0) {
            this.smartCode.message = this.smartCode.message + '\n\n' + url;
            return;
          }
          // middle element insert
          this.smartCode.message = this.smartCode.message + '\n' + url;

          if (index === res.materials.length - 1) {
            this.smartCode.message += '\n';
          }
        });
        this.messageChanged();
      }
    });
  }

  insertTextContentValue(value: string): void {
    const field = this.messageText.nativeElement;
    field.focus();
    let cursorStart = this.smartCode.message.length;
    let cursorEnd = this.smartCode.message.length;
    if (field.selectionStart || field.selectionStart === '0') {
      cursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      cursorEnd = field.selectionEnd;
    }
    field.setSelectionRange(cursorStart, cursorEnd);
    document.execCommand('insertText', false, value);
    cursorStart += value.length;
    cursorEnd = cursorStart;
    field.setSelectionRange(cursorStart, cursorEnd);
  }

  switchAutomation(): void {
    this.isShowAutomation = !this.isShowAutomation;
  }

  messageChanged(): void {
    const segmentedMessage = new SegmentedMessage(
      this.smartCode.message || '',
      'auto',
      true
    );
    this.segments = segmentedMessage.segmentsCount || 0;
  }
}
