import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SphereService } from '@app/services/sphere.service';
import { IBucket } from '@app/types/buckete';
import { Subject, takeUntil } from 'rxjs';
import { BucketCreateComponent } from '../bucket-create/bucket-create.component';

@Component({
  selector: 'app-bucket-list',
  templateUrl: './bucket-list.component.html',
  styleUrls: ['./bucket-list.component.scss']
})
export class BucketListComponent implements OnInit, OnDestroy {
  destroy$ = new Subject();
  buckets: IBucket[] = [];

  @Output() close = new EventEmitter<boolean>();

  constructor(
    private sphereService: SphereService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.sphereService.buckets$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.buckets = data.sort((a, b) => (a.score > b.score ? 1 : -1));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }

  addNew(): void {
    this.dialog
      .open(BucketCreateComponent, {
        width: '90vw',
        maxWidth: '440px',
        data: this.buckets.length + 1
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.buckets.push(res);
          this.updateServiceData();
        }
      });
  }

  onSave(data: IBucket, i: number): void {
    this.buckets.splice(i, 1, data);
    this.updateServiceData();
  }

  onRemove(item: IBucket): void {
    this.buckets.some((e, i) => {
      if (e._id === item._id) {
        this.buckets.splice(i, 1);
        return true;
      }
    });
    this.buckets.forEach((e, index) => {
      e.score = index + 1;
    });
    this.updateServiceData();
  }

  updateScore(event: CdkDragDrop<IBucket[]>): void {
    const prevScore = this.buckets[event.previousIndex].score;
    const nextScore = this.buckets[event.currentIndex].score;
    const id = this.buckets[event.previousIndex]._id;
    moveItemInArray(this.buckets, event.previousIndex, event.currentIndex);
    this.sphereService
      .updateScores({
        id,
        prev: prevScore,
        next: nextScore
      })
      .subscribe((res) => {
        if (res) {
          this.buckets.forEach((e, index) => {
            e.score = index + 1;
          });
          this.updateServiceData();
        }
      });
  }

  closeList(): void {
    this.close.emit(true);
  }

  updateServiceData(): void {
    this.sphereService.buckets.next(this.buckets);
  }
}
