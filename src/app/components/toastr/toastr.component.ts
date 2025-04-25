import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Toast, ToastPackage, ToastrService } from 'ngx-toastr';
import { Contact } from '@models/contact.model';
import { Material } from '@models/material.model';
import { SocketService } from '@services/socket.service';
import { MaterialService } from '@services/material.service';

@Component({
  selector: 'app-toastr',
  templateUrl: './toastr.component.html',
  styleUrls: ['./toastr.component.scss']
})
export class ToastrComponent extends Toast {
  notification: any = null;
  type = '';
  contact: Contact = new Contact();
  material: Material = new Material();
  email: any;
  detail: any;

  MAT_NOTIFICATIONS = [
    'review_pdf',
    'review_image',
    'video_lead_capture',
    'video_interest_capture',
    'pdf_lead_capture',
    'pdf_interest_capture',
    'image_lead_capture',
    'image_interest_capture'
  ];
  TITLES = {
    review_pdf: 'reviewed PDF',
    review_image: 'reviewed image',
    video_lead_capture: 'video lead formed',
    video_interest_capture: 'video lead formed',
    pdf_lead_capture: 'pdf lead formed',
    pdf_interest_capture: 'pdf lead formed',
    image_lead_capture: 'image lead formed',
    image_interest_capture: 'image lead formed',
    open_email: 'opened email',
    click_link: 'clicked link',
    unsubscribe_email: 'unsubscribed',
    unsubscribe_text: 'unsubscribed'
  };

  constructor(
    private socketService: SocketService,
    protected toastrService: ToastrService,
    public toastPackage: ToastPackage,
    public materialService: MaterialService,
    private router: Router
  ) {
    super(toastrService, toastPackage);
    this.notification = this.socketService.notification.getValue();
    if (this.notification) {
      if (this.notification.contact) {
        this.contact = new Contact().deserialize(this.notification.contact);
      }
      this.type = this.notification.criteria;
      switch (this.notification.criteria) {
        case 'watch_video':
          this.material = new Material().deserialize(this.notification.video);
          this.detail = this.notification.detail;
          break;
        case 'review_pdf':
          this.material = new Material().deserialize(this.notification.pdf);
          this.detail = this.notification.detail;
          break;
        case 'review_image':
          this.material = new Material().deserialize(this.notification.image);
          this.detail = this.notification.detail;
          break;
        case 'video_lead_capture':
        case 'video_interest_capture':
          this.material = new Material().deserialize(this.notification.video);
          this.detail = { created_at: new Date() };
          break;
        case 'pdf_lead_capture':
        case 'pdf_interest_capture':
          this.material = new Material().deserialize(this.notification.pdf);
          this.detail = { created_at: new Date() };
          break;
        case 'image_lead_capture':
        case 'image_interest_capture':
          this.material = new Material().deserialize(this.notification.image);
          this.detail = { created_at: new Date() };
          break;
        case 'open_email':
        case 'click_link':
          this.email = this.notification.email;
          this.detail = this.notification.email_tracker;
          break;
        case 'unsubscribe_email':
        case 'unsubscribe_text':
          this.detail = { created_at: new Date() };
          break;
        case 'task_reminder':
          this.detail = this.notification.task;
          break;
        case 'scheduler_reminder':
          this.detail = this.notification.appointment;
          break;
        case 'receive_text':
          this.detail = { text: this.notification.text };
          break;
      }
    }
  }

  tapToast(): void {
    super.tapToast();
    if (this.notification.contact.first_name != 'Someone') {
      this.goToContact(this.notification.contact._id);
    } else {
      this.materialDetail(this.material._id);
    }
  }
  materialDetail(id): void {
    if (this.notification.video) {
      this.router.navigate([
        '/materials/analytics/video/' + id + '/' + this.notification.activity
      ]);
    } else if (this.notification.pdf) {
      this.router.navigate([
        '/materials/analytics/pdf/' + id + '/' + this.notification.activity
      ]);
    } else {
      this.router.navigate([
        '/materials/analytics/image/' + id + '/' + this.notification.activity
      ]);
    }
  }
  goToContact(contact: string): void {
    if (contact) {
      this.router.navigate(['/contacts/' + contact]);
      this.remove();
    }
  }

  close(): void {
    this.remove();
  }
}
