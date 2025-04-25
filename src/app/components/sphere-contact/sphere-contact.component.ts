import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Contact } from '@app/models/contact.model';
import { ContactService } from '@app/services/contact.service';
import { SphereService } from '@app/services/sphere.service';
import { IBucket } from '@app/types/buckete';
import { Subject, debounceTime, map, takeUntil, tap } from 'rxjs';

interface IActionScore {
  name: string;
  score: number;
  hotkey?: string;
}

const ACTION_SCORES: IActionScore[] = [
  {
    score: 1,
    name: 'No'
    // hotkey: '1'
  },
  {
    score: 2,
    name: `Maybe`
    // hotkey: '2'
  },
  {
    score: 3,
    name: 'Yes'
    // hotkey: '3'
  }
];

@Component({
  selector: 'app-sphere-contact',
  templateUrl: './sphere-contact.component.html',
  styleUrls: ['./sphere-contact.component.scss']
})
export class SphereContactComponent implements OnInit {
  private readonly destroy$ = new Subject();
  _contact: Contact;
  buckets: IBucket[] = [];
  actionScores: IActionScore[] = ACTION_SCORES;

  selectedBucket: IBucket;
  selectedScoreSubject = new Subject<number>();
  selectedScore: number;

  isLoading = false;
  isWaiting = false;

  @Output() sort = new EventEmitter<Contact>();
  @Output() load = new EventEmitter<Contact>();
  @Output() exclude = new EventEmitter<Contact>();

  @Input() isSaving: boolean;

  @Input()
  set contact(value: Contact) {
    this._contact = value;
    this.reset();
    this.loadDetail();
    this.initSphereSettings();
  }

  get contact(): Contact {
    return this._contact;
  }

  constructor(
    private contactService: ContactService,
    private sphereService: SphereService
  ) {}

  ngOnInit(): void {
    this.loadBasics();
    this.initSaving();
  }

  private loadBasics(): void {
    this.sphereService.buckets$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.buckets = res || [];
      });
  }

  private initSaving(): void {
    this.selectedScoreSubject.pipe(debounceTime(750)).subscribe((val) => {
      val && this.sort.emit(this._contact);
    });
  }

  loadDetail(): void {
    this.isLoading = true;
    this.contactService.readImpl(this._contact._id).subscribe((_contact) => {
      if (_contact) {
        this._contact = new Contact().deserialize({
          ...this._contact,
          ..._contact
        });
      }
      this.isLoading = false;
    });
  }

  private initSphereSettings(): void {
    if (this._contact.sphere_bucket_id) {
      const bucket = this.buckets.find(
        (e) => e._id === this._contact.sphere_bucket_id
      );
      this.selectedBucket = bucket;
    } else {
      this.selectedBucket = null;
    }

    if (this._contact.action_score) {
      this.selectedScore = this._contact.action_score;
    } else {
      this.selectedScore = null;
    }
  }

  reset(): void {
    this.selectedBucket = null;
    this.selectedScore = null;
  }

  setBucket(value: IBucket) {
    if (this.selectedBucket?._id !== value['_id']) {
      this.setActionScore(null);
    }
    this.selectedBucket = value;
    this._contact.sphere_bucket_id = this.selectedBucket?._id;
  }

  setActionScore(value: number) {
    this.selectedScore = value;
    this._contact.action_score = this.selectedScore;
    this.selectedScoreSubject.next(value);
  }

  excludeContact(): void {
    this.exclude.emit(this._contact);
  }
}
