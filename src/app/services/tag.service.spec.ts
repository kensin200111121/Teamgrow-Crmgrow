import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { ErrorService } from '@services/error.service';
import { TagService } from './tag.service';
import { environment } from '@environments/environment';
import { STATUS } from '@constants/variable.constants';
import { TAG } from '@constants/api.constant';
import { of } from 'rxjs';
import * as _ from 'lodash';

describe('TagService', () => {
  let service: TagService;
  let httpMock: HttpTestingController;
  let errorService: jasmine.SpyObj<ErrorService>;

  beforeEach(() => {
    const errorSpy = jasmine.createSpyObj('ErrorService', [
      'addError',
      'showSuccess'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TagService, { provide: ErrorService, useValue: errorSpy }]
    });

    service = TestBed.inject(TagService);
    httpMock = TestBed.inject(HttpTestingController);
    errorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllTagsImpl', () => {
    it('should return all tags', () => {
      const mockTags = [
        { _id: '1', name: 'Tag1' },
        { _id: '2', name: 'Tag2' }
      ];

      service.getAllTagsImpl().subscribe((tags) => {
        expect(tags).toEqual(mockTags as any);
      });

      const req = httpMock.expectOne(environment.api + TAG.ALL);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockTags });
    });

    it('should handle error and return empty array', () => {
      service.getAllTagsImpl().subscribe((tags) => {
        expect(tags).toEqual([]);
      });

      const req = httpMock.expectOne(environment.api + TAG.ALL);
      req.flush('error', { status: 500, statusText: 'Server Error' });

      expect(errorService.addError).toHaveBeenCalledWith(
        'LOAD ALL TAGS',
        jasmine.any(Object)
      );
    });
  });

  describe('getAllTags', () => {
    it('should set tags and update loadStatus', () => {
      const mockTags = [
        { _id: '1', name: 'Tag1' },
        { _id: '2', name: 'Tag2' }
      ];

      spyOn(service, 'getAllTagsImpl').and.returnValue(of(mockTags as any));

      service.getAllTags();

      service.tags$.subscribe((tags) => {
        if (tags[0]._id === 'lead capture') {
          tags.shift();
        }
        expect(tags).toEqual(_.uniqBy(mockTags, '_id'));
        expect(service.loadStatus.getValue()).toBe(STATUS.SUCCESS);
      });
    });

    it('should handle empty response', () => {
      spyOn(service, 'getAllTagsImpl').and.returnValue(of([]));

      service.getAllTags();

      service.tags$.subscribe((tags) => {
        if (tags[0]._id === 'lead capture') {
          tags.shift();
        }
        expect(tags).toEqual([]);
        expect(service.loadStatus.getValue()).toBe(STATUS.SUCCESS);
      });
    });
  });

  describe('createTag', () => {
    it('should create a new tag', () => {
      const newTag = { _id: '3', name: 'Tag3' };
      const response = { data: newTag };

      service.createTag(newTag).subscribe((res) => {
        expect(res).toEqual(response);
      });

      const req = httpMock.expectOne(environment.api + TAG.CREATE);
      expect(req.request.method).toBe('POST');
      req.flush(response);
    });

    it('should handle error when creating a new tag', () => {
      const newTag = { _id: '3', name: 'Tag3' };

      service.createTag(newTag).subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(environment.api + TAG.CREATE);
      req.flush('error', { status: 500, statusText: 'Server Error' });

      expect(errorService.addError).toHaveBeenCalledWith(
        'CREATE TAG',
        jasmine.any(Object)
      );
    });
  });

  // Add similar tests for other methods like loadTagContacts, loadAllContacts, getAllSourcesImpl, etc.
});
