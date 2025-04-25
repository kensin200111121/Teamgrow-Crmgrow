import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TagService } from '@services/tag.service';

@Component({
  selector: 'app-tag-delete',
  templateUrl: './tag-delete.component.html',
  styleUrls: ['./tag-delete.component.scss']
})
export class TagDeleteComponent implements OnInit {
  tags: string[] = [];
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<TagDeleteComponent>,
    private tagService: TagService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.tags = this.data.tags;
    }
  }

  ngOnInit(): void {}

  onDelete(): void {
    this.saving = true;
    this.tagService.tagsDelete(this.tags).subscribe(
      (res: any) => {
        if (res['status']) {
          this.saving = false;
          this.dialogRef.close(this.tags);
        }
      },
      (err) => {
        this.saving = false;
      }
    );
  }
}
