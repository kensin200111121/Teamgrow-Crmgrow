import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TagService } from '@services/tag.service';

@Component({
  selector: 'app-tag-merge',
  templateUrl: './tag-merge.component.html',
  styleUrls: ['./tag-merge.component.scss']
})
export class TagMergeComponent implements OnInit {
  mergeList: string[] = [];
  mergeTags: string[] = [];
  mergeTo: string = '';
  mode: string = '';

  isProcessing: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<TagMergeComponent>,
    private tagService: TagService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.mergeTags) {
      this.mergeTags = this.data.mergeTags;
    }
    if (this.data && this.data.mergeList) {
      this.mergeList = this.data.mergeList;
    }
  }

  ngOnInit(): void {}

  getTagsList(): string[] {
    const list = this.mergeList.filter((item) => item !== this.mergeTo);
    return list;
  }

  onMergeTag(): void {
    const filteredTags = this.mergeTags.filter((tag) => tag !== this.mergeTo);
    this.tagService.tagMerge(filteredTags, this.mergeTo).subscribe(
      (res) => {
        if (res.status) {
          this.isProcessing = false;
          this.dialogRef.close(this.mergeTo);
        }
      },
      (err) => {
        this.isProcessing = false;
      }
    );
  }
}
