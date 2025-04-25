import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { ErrorService } from '@services/error.service';
import { StoreService } from './store.service';
import { AUTH, USER } from '@constants/api.constant';
import '../../test/localStorage.mock';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;
  let storeServiceSpy: jasmine.SpyObj<StoreService>;

  beforeEach(() => {
    const errorServiceMock = jasmine.createSpyObj('ErrorService', [
      'handleError',
      'addError'
    ]);
    const storeServiceMock = jasmine.createSpyObj('StoreService', [
      'someMethod'
    ]); // Add relevant methods if needed

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: ErrorService, useValue: errorServiceMock },
        { provide: StoreService, useValue: storeServiceMock }
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    errorServiceSpy = TestBed.inject(
      ErrorService
    ) as jasmine.SpyObj<ErrorService>;
    storeServiceSpy = TestBed.inject(
      StoreService
    ) as jasmine.SpyObj<StoreService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#login', () => {
    it('should return an Observable<any> on successful login', () => {
      const mockUser = { email: 'test@example.com', password: 'password' };
      const mockResponse = { status: 'success' };

      service.login(mockUser).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.server + AUTH.SIGNIN);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('No-Auth')).toBe('True');

      req.flush(mockResponse);
    });

    it('should handle an error response', () => {
      const mockUser = { email: 'test@example.com', password: 'password' };
      const mockError = { message: 'Invalid credentials' };
      service.login(mockUser).subscribe({
        next: () => {
          // Use explicit fail condition
          expect(false).toBeFalse(); // Test should not reach here
        },
        error: (error) => {
          expect(error.message).toBe(mockError.message);
        }
      });
      const req = httpMock.expectOne(service.server + AUTH.SIGNIN);
      expect(req.request.method).toBe('POST');
      // Simulating an error response with a 401 status
      req.flush(mockError, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('#logout', () => {
    it('should return an Observable<boolean> on successful logout', () => {
      const mockResponse = { status: true };

      service.logout().subscribe((status) => {
        expect(status).toBeTrue();
      });

      const req = httpMock.expectOne(service.server + AUTH.LOG_OUT);
      expect(req.request.method).toBe('POST');

      req.flush(mockResponse);
    });

    it('should handle an error response during logout', () => {
      const mockError = { message: 'Logout failed' };

      service.logout().subscribe({
        next: () => {
          // Use explicit fail condition
          expect(false).toBeFalse(); // Test should not reach here
        },
        error: (error) => {
          expect(error.message).toBe(mockError.message);
        }
      });

      const req = httpMock.expectOne(service.server + AUTH.LOG_OUT);
      req.flush(mockError, {
        status: 500,
        statusText: 'Internal Server Error'
      });
    });
  });

  describe('#signup', () => {
    it('should return an Observable<any> on successful signup', () => {
      const mockUser = {
        email: 'newuser@example.com',
        password: 'newpassword'
      };
      const mockResponse = { status: 'success' };

      service.signup(mockUser).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.server + AUTH.SIGNUP);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('No-Auth')).toBe('True');

      req.flush(mockResponse);
    });

    it('should handle an error response during signup', () => {
      const mockUser = {
        email: 'newuser@example.com',
        password: 'newpassword'
      };
      const mockError = { message: 'Signup failed' };

      service.signup(mockUser).subscribe({
        next: () => {
          // Use explicit fail condition
          expect(false).toBeFalse(); // Test should not reach here
        },
        error: (error) => {
          expect(error.message).toBe(mockError.message);
        }
      });

      const req = httpMock.expectOne(service.server + AUTH.SIGNUP);
      req.flush(mockError, {
        status: 500,
        statusText: 'Internal Server Error'
      });
    });
  });

  describe('#loadProfile', () => {
    it('should return an Observable<any> with profile data', () => {
      const mockProfileData = {
        data: { name: 'John Doe', email: 'john@example.com' }
      };

      service.loadProfile().subscribe((data) => {
        expect(data).toEqual(mockProfileData.data);
      });

      const req = httpMock.expectOne(service.server + USER.PROFILE);
      expect(req.request.method).toBe('GET');

      req.flush(mockProfileData);
    });
  });
});
