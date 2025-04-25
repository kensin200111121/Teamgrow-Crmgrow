import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'app-play-timelines',
  templateUrl: './play-timelines.component.html',
  styleUrls: ['./play-timelines.component.scss']
})
export class PlayTimelinesComponent implements OnInit, AfterViewInit {
  @Input('data') data: any = {};
  @Input('type') type = 'video_trackers';
  @Input('duration') duration = 0;
  gaps: any[] = [];
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('startBar') startEl: ElementRef;
  @ViewChild('endBar') endEl: ElementRef;
  completion = 0;
  start = 0;
  end = 0;
  read_pages = 0;
  total_pages = 0;
  isLiveVideo = false;
  constructor() {}

  ngOnInit(): void {
    if (this.duration < 0) {
      this.isLiveVideo = true;
      // Because the live video doesn't have duration, we got the max time on the attending times
      const maxPositionOnGap = _.max(_.flatten(this.data?.gap ?? []));
      // Because the gap is second unit (not milisecond unit). So we converted to miliseconds.
      this.duration = maxPositionOnGap * 1000;
    }
    const duration = Math.floor(this.duration / 1000);
    const watched = Math.floor(this.data.duration / 1000);
    this.completion = parseFloat(
      ((this.data.duration / this.duration) * 100).toFixed(1)
    );

    if (watched / duration > 0.98) {
      this.gaps = [[0, duration]];
      this.start = 0;
      this.end = this.duration;
      return;
    }

    if (this.data.read_pages) {
      this.read_pages = this.data.read_pages;
    }

    if (this.data.total_pages) {
      this.total_pages = this.data.total_pages;
    }

    let start = 0;
    let end = 0;
    if (this.data.start || this.data.end) {
      start = Math.floor(this.data.start);
      end = Math.round(this.data.end);
    } else {
      end = Math.round(this.data.material_last);
      start = end - watched;
    }

    this.start = start < 0 ? 0 : start * 1000;
    this.end =
      end < 0 || this.data.end * 1000 > this.duration
        ? this.duration
        : this.data.end * 1000;

    if (this.data.gap && this.data.gap.length) {
      //Update gap
      this.data.gap.forEach((e) => {
        if (e.length == 2) {
          if (e[0] !== 0 && e[1] === 0) {
            this.gaps.push([e[0], duration]);
          } else {
            this.gaps.push([e[0], e[1]]);
          }
        } else {
          this.gaps.push(e);
        }
      });
      //this.gaps = this.data.gap;
    } else {
      if (this.data.start || this.data.end) {
        if (start > end) {
          this.gaps = [
            [0, end],
            [this.data.start, duration]
          ];
        } else {
          this.gaps = [[start, end]];
        }
      } else if (this.data.material_last) {
        if (start < 0) {
          this.gaps = [
            [0, end],
            [duration - start, duration]
          ];
        } else {
          this.gaps = [[start, end]];
        }
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.canvas && this.duration) {
      const duration = Math.ceil(this.duration / 1000);
      const canvas = <HTMLCanvasElement>this.canvas.nativeElement;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      this.gaps.forEach((e) => {
        if (e.length == 2) {
          if (e[0] < e[1]) {
            const start = Math.floor((e[0] / duration) * 300);
            const end = Math.floor((e[1] / duration) * 300);
            ctx.moveTo(start, 2);
            ctx.lineTo(end, 2);
          }
        }
      });
      ctx.stroke();
      const startBar = <HTMLElement>this.startEl.nativeElement;
      const endBar = <HTMLElement>this.endEl.nativeElement;
      let start = this.start || 0;
      let end = this.data.material_last || this.end || duration;

      end = end < 0 ? duration : end;
      endBar.style.left = ((end / duration) * 100).toFixed(2) + '%';
      start = start < 0 ? 0 : start;
      startBar.style.left = ((start / duration) * 100).toFixed(2) + '%';
    }
  }
}
