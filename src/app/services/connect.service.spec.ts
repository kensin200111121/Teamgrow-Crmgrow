import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { ConnectService } from './connect.service';
import { environment } from '@environments/environment';
import { INTEGRATION, SMS } from '@app/constants/api.constant';

describe('ConnectService', () => {
  let service: ConnectService;

  let httpTestingController: HttpTestingController;
  let toastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    const toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error'
    ]);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConnectService,
        { provide: ToastrService, useValue: toastrSpy }
      ]
    });
    service = TestBed.inject(ConnectService);
    httpTestingController = TestBed.inject(HttpTestingController);
    toastrService = TestBed.inject(
      ToastrService
    ) as jasmine.SpyObj<ToastrService>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch data successfully', () => {
    const mockData = { status: true };

    service.disconnectCalendly().subscribe((data) => {
      expect(data).toEqual(mockData);
    });
    const req = httpTestingController.expectOne(
      environment.api + INTEGRATION.DISCONNECT_CALENDLY
    ); // Replace 'api/data' with your actual API endpoint
    expect(req.request.method).toBe('GET');
    req.flush(mockData); // Respond with mock data
  });

  it('should post data successfully', () => {
    const postData = {
      number: '+1000000000'
    };
    const response = { status: true };

    service.buyNumbers(postData).subscribe((data) => {
      expect(data).toEqual(response);
    });
    const req = httpTestingController.expectOne(
      environment.api + SMS.BUY_NUMBER
    ); // Replace 'api/data' with your actual API endpoint
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(postData);

    req.flush(response); // Respond with mock response
  });

  // it('should handle error and show error message', () => {
  //   const errorMessage = 'test 404 error';

  //   service.getApiKey().subscribe(
  //     (data) => {
  //       console.log(data, 'error data');
  //     },
  //     (error: HttpErrorResponse) => {
  //       expect(error.status).toBe(404);
  //       expect(error.statusText).toBe('Not Found');
  //       expect(toastrService.error).toHaveBeenCalledWith(errorMessage, 'Error');
  //     }
  //   );
  //   const req = httpTestingController.expectOne(
  //     environment.api + INTEGRATION.GET_API_KEY
  //   ); // Replace 'api/data' with your actual API endpoint
  //   req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
  // });
});
