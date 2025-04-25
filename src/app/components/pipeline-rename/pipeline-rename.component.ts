import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from '@services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Pipeline } from '@app/models/pipeline.model';

@Component({
  selector: 'app-pipeline-rename',
  templateUrl: './pipeline-rename.component.html',
  styleUrls: ['./pipeline-rename.component.scss']
})
export class PipelineRenameComponent implements OnInit {
  title = '';
  submitted = false;
  saving = false;
  pipeline: Pipeline | undefined;

  constructor(
    private dealsService: DealsService,
    private dialogRef: MatDialogRef<PipelineRenameComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      if (this.data.title) {
        this.title = this.data.title;
      }
      if (this.data.pipeline) {
        this.title = this.data.pipeline.title;
        this.pipeline = this.data.pipeline;
      }
    }
  }

  ngOnInit(): void {}

  updatePipelines(): void {
    if (this.title === '' || this.title.trim() === '') {
      return;
    } else {
      this.saving = true;
      const data = {
        title: this.title
      };

      const pipeId = this.pipeline
        ? this.pipeline._id
        : this.dealsService.selectedPipeline.getValue()._id;
      this.dealsService.updatePipeLine(pipeId, data).subscribe((res1) => {
        if (res1.status) {
          this.dialogRef.close(data);
        }
      });
    }
  }
}
