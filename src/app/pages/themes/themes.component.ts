import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '@services/theme.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { STATUS } from '@constants/variable.constants';

@Component({
  selector: 'app-themes',
  templateUrl: './themes.component.html',
  styleUrls: ['./themes.component.scss']
})
export class ThemesComponent implements OnInit {
  STATUS = STATUS;

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // this.themeService.getAllThemes();
  }

  editTheme(id: string): void {
    this.router.navigate(['/theme/edit/' + id]);
  }

  deleteTheme(id: string): void {
    const confirmDialog = this.dialog.open(ConfirmComponent, {
      position: { top: '100px' },
      data: {
        title: 'Delete Theme',
        message: 'Are you sure to delete this theme?',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });
    confirmDialog.afterClosed().subscribe((res) => {
      if (res) {
        this.themeService.deleteTheme(id);
      }
    });
  }

  duplicateTheme(id: string): void {
    this.router.navigate(['/theme/new/' + id]);
  }
}
