import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss']
})
export class LinkComponent implements OnInit {
  @Input('value')
  public set value(val: string) {
    if (!val) {
      this._value = '';
      this.url = '';
      this.isUrl = false;
      return;
    }
    this._value = val;
    this.isUrl = this.checkUrl(this._value);
    if (this.isUrl) {
      if (this._value.startsWith('http')) {
        this.url = this._value;
      } else {
        this.url = 'http://' + this._value;
      }
    }
  }

  _value: string = '';
  url: string = '';
  isUrl: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  checkUrl(str: string): boolean {
    let url = '';
    if (str && typeof str === 'string' && str.startsWith('http')) {
      url = str;
    } else {
      url = 'http://' + str;
    }
    if (url.indexOf('.') === -1) {
      return false;
    }
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    );
    return !!pattern.test(url);
  }
}
