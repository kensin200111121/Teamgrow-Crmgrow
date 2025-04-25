import { Component, Input, OnInit } from '@angular/core';
import { AutomationListService } from '@services/automation-list.service';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

@Component({
  selector: 'app-automation-resources',
  templateUrl: './automation-resources.component.html',
  styleUrls: ['./automation-resources.component.scss'],
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({ height: '0px', minHeight: '0', display: 'none' })
      ),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      )
    ])
  ]
})
export class AutomationResourcesComponent implements OnInit {
  @Input() item: any;
  @Input() displayColumns: number;
  @Input() level: number;
  data = new Map();
  selectedRows = [] as string[];
  resourceLoading = new Map();

  constructor(protected service: AutomationListService) {}

  ngOnInit(): void {
    this.handleSelect(this.item);
  }

  handleSelect(item: any) {
    if (this.selectedRows.includes(item._id)) {
      this.selectedRows = this.selectedRows.filter(
        (row: string) => row !== item._id
      );
      this.resourceLoading.delete(item._id);
      this.data.delete(item._id);
    } else {
      this.selectedRows.push(item._id);
      this.resourceLoading.set(item._id, true);
      const temp_data = [];

      this.service.getRelatedResources(item._id).subscribe((_res) => {
        if (_res?.status) {
          const count =
            (_res.data?.videos?.length || 0) +
            (_res.data?.pdfs?.length || 0) +
            (_res.data?.images?.length || 0) +
            (_res.data?.automations?.length || 0);

          if (count == 0) {
            this.resourceLoading.set(item._id, false);
          } else {
            _res.data.videos.forEach((video: any) => {
              temp_data.push({ ...video, type: 'Video' });
            });
            _res.data.images.forEach((image: any) => {
              temp_data.push({ ...image, type: 'Image' });
            });
            _res.data.pdfs.forEach((pdf: any) => {
              temp_data.push({ ...pdf, type: 'Pdf' });
            });
            _res.data.automations.forEach((automation: any) => {
              temp_data.push({ ...automation, type: 'Automation' });
            });
            this.data.set(item._id, temp_data);
            this.resourceLoading.set(item._id, false);
          }
        }
      });
    }
  }
}
