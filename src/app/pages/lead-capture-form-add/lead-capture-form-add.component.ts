import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FileUploader } from 'ng2-file-upload';
import { ToastrService } from 'ngx-toastr';
import { Automation } from '@models/automation.model';
import { AutomationService } from '@services/automation.service';
import { HelperService } from '@services/helper.service';
import { UserService } from '@services/user.service';
import { environment } from '@environments/environment';
import { CaptureFieldAddComponent } from '@components/capture-field-add/capture-field-add.component';
import { LeadForm } from '@app/models/lead-form.model';
import { Router } from '@angular/router';
import { LeadFormService } from '@app/services/lead-form.service';
import { Location } from '@angular/common';
import { USER_FEATURES } from '@app/constants/feature.constants';

@Component({
  selector: 'app-lead-capture-form-add',
  templateUrl: './lead-capture-form-add.component.html',
  styleUrls: ['./lead-capture-form-add.component.scss']
})
export class LeadCaptureFormAddComponent implements OnInit {
  readonly USER_FEATURES = USER_FEATURES;
  type = 'create';
  submitted = false;
  saving = false;
  name = '';
  tags = [];
  fields = [
    {
      required: true,
      name: 'First Name',
      type: 'text',
      placeholder: ''
    },
    {
      required: true,
      name: 'Last Name',
      type: 'text',
      placeholder: ''
    },
    {
      required: true,
      name: 'Email',
      type: 'email',
      placeholder: ''
    },
    {
      required: false,
      name: 'Phone',
      type: 'phone',
      placeholder: ''
    }
  ];
  selectedAutomation: string;
  automations: Automation[] = [];
  intro_video = '';
  uploadingIntroVideo = false;
  @ViewChild('introVideo') introVideo: ElementRef;
  introVideoPlaying = false;

  videoUploader: FileUploader = new FileUploader({
    url: environment.api + 'garbage/intro_video',
    authToken: this.userService.getToken(),
    itemAlias: 'video'
  });

  data: { type: string; form: LeadForm };

  constructor(
    private dialog: MatDialog,
    public userService: UserService,
    private automationService: AutomationService,
    private helperService: HelperService,
    private toast: ToastrService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    public leadFormService: LeadFormService,
    private location: Location
  ) {
    const path = this.location.path().split('/');
    if (path[3] === 'edit' && path[4]) {
      this.type = 'edit';
      this.leadFormService.getForm(path[4]).subscribe((data) => {
        this.data = data;
        this.name = data.form.name;
        this.tags = data.form.tags;
        this.fields = data.form.fields;
        this.intro_video = data.form.capture_video;
        this.selectedAutomation = data.form?.automation?._id;
      });
    }
  }

  ngOnInit(): void {
    this.automationService.loadOwn(true);
    this.videoUploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
      if (this.videoUploader.queue.length > 1) {
        this.videoUploader.queue.splice(0, 1);
      }
    };
    this.videoUploader.onCompleteItem = (
      item: any,
      response: any,
      status: any,
      headers: any
    ) => {
      this.uploadingIntroVideo = false;
      if (status === 200) {
        try {
          response = JSON.parse(response);
          if (response['data']) {
            this.intro_video = '';
            this.intro_video = response['data']['intro_video'];
            this.replaceVideo();
            this.pauseVideo();
            this.changeDetectorRef.detectChanges();
          }
        } catch (e) {}
      } else {
        this.toast.error('Uploading Intro Video is Failed. Please try again.');
      }
    };
  }

  addForm(): void {
    const data = {
      name: this.name,
      tags: this.tags,
      fields: this.fields,
      capture_delay: 0,
      capture_video: this.intro_video,
      automation: this.selectedAutomation
    };
    if (this.data?.form?._id) {
      data['_id'] = this.data.form._id;
      this.leadFormService.update(data as LeadForm);
    } else this.leadFormService.create(data as LeadForm);
    this.router.navigate(['/lead-hub/lead-capture']);
  }

  requiredStatusChange(evt: any, field_name: string): void {
    const phoneIndex = this.fields.findIndex((e) => e.name == 'Phone');
    const emailIndex = this.fields.findIndex((e) => e.name == 'Email');
    switch (field_name) {
      case 'Email':
        if (!evt.target.checked) {
          if (this.fields[phoneIndex].required) {
            this.fields[emailIndex].required = evt.target.checked;
          } else {
            evt.target.checked = true;
            this.toast.error(
              'At least one of Phone and Email must be selected.'
            );
          }
        } else {
          this.fields[emailIndex].required = evt.target.checked;
        }
        break;
      case 'Name':
        evt.target.checked = true;
        this.toast.error('Name should be checked.');
        break;
      case 'Phone':
        if (!evt.target.checked) {
          if (this.fields[emailIndex].required) {
            this.fields[phoneIndex].required = evt.target.checked;
          } else {
            evt.target.checked = true;
            this.toast.error(
              'At least one of Phone and Email must be selected.'
            );
          }
        } else {
          this.fields[phoneIndex].required = evt.target.checked;
        }
        break;
      default:
        const customIndex = this.fields.findIndex((e) => e.name == field_name);
        this.fields[customIndex].required = evt.target.checked;
        break;
    }
  }

  addField(): void {
    this.dialog
      .open(CaptureFieldAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          type: 'create',
          fields: this.fields
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const data = {
            required: false,
            name: res.name,
            type: res.type,
            placeholder: res.placeholder,
            options: res.options,
            match_field: res.match_field,
            format: res.format
          };
          this.fields.push(data);
        }
      });
  }

  editField(editData: any): void {
    this.dialog
      .open(CaptureFieldAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          type: 'edit',
          editData: editData
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const index = this.fields.findIndex((e) => e.name == editData.name);
          if (index !== -1) {
            this.fields[index].name = res.name;
            this.fields[index].type = res.type;
            this.fields[index].placeholder = res.placeholder;
            this.fields[index]['options'] = res.options;
            this.fields[index]['match_field'] = res.match_field;
            this.fields[index]['format'] = res.format;
          }
        }
      });
  }

  deleteField(deleteData: any): void {
    const index = this.fields.findIndex((e) => e.name == deleteData.name);
    if (index !== -1) {
      this.fields.splice(index, 1);
    }
  }

  browseVideo(): void {
    this.helperService
      .promptForVideo()
      .then((video) => {
        const type = video.type;
        const name = video.name;
        if (
          type.startsWith('video') &&
          (name.toLowerCase().endsWith('mp4') ||
            name.toLowerCase().endsWith('mov'))
        ) {
          this.helperService
            .getVideoDuration(video)
            .then((duration) => {
              if (duration.duration && duration.duration <= 60000) {
                this.videoUploader.clearQueue();
                this.videoUploader.addToQueue([video]);
                this.uploadingIntroVideo = true;
                this.videoUploader.uploadAll();
              } else {
                this.toast.error(
                  '',
                  'Video length should be less than 1 minute.',
                  { closeButton: true }
                );
              }
            })
            .catch((err) => {
              this.toast.error(
                "This video duration can't expected. Please try another video"
              );
            });
        } else {
          this.toast.error('Please select the *.mp4 or *.mov');
        }
      })
      .catch((err) => {
        this.toast.error("Couldn't load the Video File");
      });
  }

  toggleVideo(): void {
    const introVideoElement: HTMLVideoElement = this.introVideo.nativeElement;
    if (introVideoElement.paused) {
      introVideoElement.play();
      this.introVideoPlaying = true;
    } else {
      introVideoElement.pause();
      this.introVideoPlaying = false;
    }
  }

  pauseVideo(): void {
    const introVideoElement: HTMLVideoElement = this.introVideo.nativeElement;
    if (!introVideoElement.paused) {
      introVideoElement.pause();
      this.introVideoPlaying = false;
    }
  }

  removeVideo(): void {
    this.intro_video = '';
  }

  replaceVideo(): void {
    setTimeout(() => {
      const introVideoElement: HTMLVideoElement = this.introVideo.nativeElement;
      introVideoElement.load();
    }, 200);
  }

  selectAutomation(evt: Automation): void {
    if (evt) {
      this.selectedAutomation = evt._id;
    } else {
      this.selectedAutomation = null;
    }
  }

  onSubmit(actionForm) {
    this.submitted = true;
    if (actionForm.form.valid) {
      this.addForm();
    } else {
      return false;
    }
  }

  getFieldName(field): string {
    if (field) {
      if (field.match_field) {
        return field.match_field;
      }
      if (
        field.name === 'First Name' ||
        field.name === 'Last Name' ||
        field.name === 'Email' ||
        field.name === 'Phone'
      ) {
        return 'Default';
      }
    }
    return '';
  }
}
