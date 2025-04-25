import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {MatDrawer} from '@angular/material/sidenav';
import {MatExpansionPanel} from '@angular/material/expansion';

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss']
})
export class AccordionComponent implements OnInit {
  @Input('detail') detailTemplate: TemplateRef<HTMLElement>;
  @Input('showIndicator') showIndicator: TemplateRef<HTMLElement>;
  @Input('hideIndicator') hideIndicator: TemplateRef<HTMLElement>;
  @Input() showText: string = '';
  @Input() hideText: string = '';
  @ViewChild('panel') panel: MatExpansionPanel;
  constructor() {}

  ngOnInit(): void {}
}
