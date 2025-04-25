import { DateSpliterPipe } from './date-spliter.pipe';
import moment from 'moment-timezone';
import { DatePipe } from '@angular/common';

describe('DateSpliterPipe', () => {
  let pipe: DateSpliterPipe;

  beforeEach(() => {
    pipe = new DateSpliterPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "Today" for today\'s date', () => {
    const today = new Date();
    expect(pipe.transform(today, 'MMM d, y')).toBe('Today');
  });

  it('should return "Yesterday" for yesterday\'s date', () => {
    const yesterday = moment().subtract(1, 'day').toDate();
    expect(pipe.transform(yesterday, 'MMM d, y')).toBe('Yesterday');
  });

  it('should format date correctly for dates older than yesterday', () => {
    const date = moment().subtract(2, 'days').toDate();
    const formattedDate = new DatePipe('en').transform(date, 'MMM d, y');
    expect(pipe.transform(date, 'MMM d, y')).toBe(formattedDate);
  });

  it('should format date string input correctly', () => {
    const dateString = moment().subtract(2, 'days').format('YYYY-MM-DD');
    const formattedDate = new DatePipe('en').transform(
      new Date(dateString),
      'MMM d, y'
    );
    expect(pipe.transform(dateString, 'MMM d, y')).toBe(formattedDate);
  });

  it('should format number input correctly', () => {
    const date = moment().subtract(2, 'days').toDate();
    const dateNumber = date.getTime();
    const formattedDate = new DatePipe('en').transform(
      new Date(dateNumber),
      'MMM d, y'
    );
    expect(pipe.transform(dateNumber, 'MMM d, y')).toBe(formattedDate);
  });

  it('should return empty string for invalid date input', () => {
    expect(pipe.transform('invalid-date', 'MMM d, y')).toBe('');
  });
});
