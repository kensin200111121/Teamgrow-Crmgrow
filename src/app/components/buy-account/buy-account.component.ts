import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-buy-account',
  templateUrl: './buy-account.component.html',
  styleUrls: ['./buy-account.component.scss']
})
export class BuyAccountComponent implements OnInit {
  buying = false;
  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<BuyAccountComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  buyAccount(): void {
    this.buying = true;
    this.userService.newSubAccount(this.data).subscribe((res) => {
      this.buying = false;
      if (res && res['status']) {
        this.dialogRef.close(res['data']);
      }
    });
  }
}
