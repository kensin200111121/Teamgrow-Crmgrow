import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-ratings',
  templateUrl: './ratings.component.html',
  styleUrls: ['./ratings.component.scss']
})
export class RatingsComponent implements OnInit, AfterViewInit {
  @Input() currentRate: number = 0;
  @Input() favorite: boolean = false;
  @Input() locked: boolean = false;
  @Output() toggleFavorite = new EventEmitter();
  @Output() lockRate = new EventEmitter();
  @Output() unlockRate = new EventEmitter();
  @Output() changeRate = new EventEmitter();
  tempRate: number = 0;

  @ViewChild('rates') rateDom: ElementRef;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    fromEvent(this.rateDom.nativeElement, 'mouseleave')
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.tempRate = 0;
      });
  }

  setTempRate(rate: number): void {
    this.tempRate = rate;
  }

  onChangeRate(rate: number): void {
    if (rate === this.currentRate) {
      return;
    }
    if (this.favorite) {
      const diff = rate - this.currentRate;
      if (diff > 0) {
        this.onLock(rate);
      } else if (Math.abs(diff) > 1) {
        this.onLock(rate);
      } else {
        this.onToggleFavorite(false);
      }
    } else {
      const diff = rate - this.currentRate;
      if (diff === 1) {
        this.onToggleFavorite(true);
      } else if (diff > 1) {
        this.onLock(rate);
      } else {
        this.onLock(rate);
      }
    }
  }

  /**
   * Toggle Favroite
   * @param favorite: Favorite / Unfavorite
   */
  onToggleFavorite(favorite: boolean): void {
    this.toggleFavorite.emit(favorite);
  }

  /**
   * Toggle Lock
   */
  toggleLock(): void {
    if (this.locked) {
      this.onUnlock();
    } else {
      this.onLock(this.currentRate);
    }
  }

  /**
   * Unlock contact
   */
  onUnlock(): void {
    this.unlockRate.emit();
  }

  /**
   * Lock contact
   */
  onLock(rate: number): void {
    if (this.locked) {
      this.changeRate.emit(rate);
    } else {
      this.lockRate.emit(rate);
    }
  }
}
