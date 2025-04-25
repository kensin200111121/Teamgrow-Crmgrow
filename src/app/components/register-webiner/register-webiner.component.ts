import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register-webiner',
  templateUrl: './register-webiner.component.html',
  styleUrls: ['./register-webiner.component.scss']
})
export class RegisterWebinerComponent implements OnInit {
  minDate = new Date();

  constructor() {}

  ngOnInit(): void {}
}
