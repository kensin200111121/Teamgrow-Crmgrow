import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ErrorService } from '@services/error.service';
import { HttpService } from './http.service';
import { environment } from '@environments/environment';
import { Strings } from '@constants/strings.constant';

describe('HttpService', () => {
  let service: HttpService;
  let errorService: jasmine.SpyObj<ErrorService>;

  beforeEach(() => {
    const errorSpy = jasmine.createSpyObj('ErrorService', [
      'addError',
      'showSuccess'
    ]);

    TestBed.configureTestingModule({
      providers: [HttpService, { provide: ErrorService, useValue: errorSpy }]
    });

    service = TestBed.inject(HttpService);
    errorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleError', () => {
    it('should call addError and return the result observable', () => {
      const error = { status: 404, error: { message: 'Not Found' } };
      const operation = 'Test Operation';
      const result = { data: 'test' };

      const handleErrorFn = service.handleError(operation, result);

      handleErrorFn(error).subscribe((res) => {
        expect(res).toEqual(result);
      });

      expect(errorService.addError).toHaveBeenCalledWith(operation, error);
    });

    it('should return the error object when returnError is true', () => {
      const error = { status: 404, error: { message: 'Not Found' } };
      const operation = 'Test Operation';
      const result = { data: 'test' };

      const handleErrorFn = service.handleError(operation, result, true);

      handleErrorFn(error).subscribe((res) => {
        const expectedError = { ...error.error, statusCode: error.status };
        expect(res).toEqual(expectedError as any);
      });

      expect(errorService.addError).toHaveBeenCalledWith(operation, error);
    });

    it('should not call addError when disableErrorHandler is true', () => {
      const error = { status: 404, error: { message: 'Not Found' } };
      const operation = 'Test Operation';
      const result = { data: 'test' };

      const handleErrorFn = service.handleError(operation, result, false, true);

      handleErrorFn(error).subscribe((res) => {
        expect(res).toEqual(result);
      });

      expect(errorService.addError).not.toHaveBeenCalled();
    });
  });

  describe('handleSuccess', () => {
    it('should call showSuccess and return the result observable', () => {
      const operation = 'Test Success';
      const result = { data: 'test' };

      const handleSuccessFn = service.handleSuccess(operation, result);

      handleSuccessFn().subscribe((res) => {
        expect(res).toEqual(result);
      });

      expect(errorService.showSuccess).toHaveBeenCalledWith(operation);
    });
  });
});
