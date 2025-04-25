import { FieldTypeEnum } from './enum';
import * as _ from 'lodash';
import {
  generateDealArray,
  getInternationalPhone,
  getPhoneNumberPlaceHolder,
  getContact2IObj,
  formatContact,
  contactHeaderOrder,
  validateCustomField,
  formatValue
} from './contact';

describe('Contact Utils', () => {
  describe('generateDealArray', () => {
    it('should generate deal array correctly', () => {
      const contacts: any[] = [{ deal: 'Deal1' }, { deal: 'Deal1' }];
      const deals = generateDealArray(contacts);
      expect(deals.length).toBe(1);
      expect(deals[0].title).toBe('Deal1');
    });
  });

  describe('getInternationalPhone', () => {
    it('should return international phone format', () => {
      const phone = '1234567890';
      const code = 'US';
      const result = getInternationalPhone(phone, code);
      expect(result).toBe('+11234567890');
    });

    it('should return empty string if phone number is invalid', () => {
      const phone = 'invalid';
      const code = 'US';
      const result = getInternationalPhone(phone, code);
      expect(result).toBe('');
    });
  });

  describe('getPhoneNumberPlaceHolder', () => {
    it('should return phone number placeholder', () => {
      const result = getPhoneNumberPlaceHolder('US');
      expect(result).toBe('(201) 555-0123');
    });
  });

  describe('getContact2IObj', () => {
    it('should return a Contact2I object', () => {
      const origin = {};
      const data = {
        tags: 'tag1,tag2',
        notes: 'note1',
        label: { _id: '1', name: 'label1' },
        cell_phone: '1234567890'
      };
      const result = getContact2IObj(origin, data);
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.notes).toEqual(['note1']);
      expect(result['label_id']).toBe('1');
    });
  });

  describe('formatContact', () => {
    it('should format contact data correctly', () => {
      const data = { tags: 'tag1,tag2', notes: 'note1' };
      const result = formatContact(data);
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.notes).toEqual(['note1']);
    });
  });

  describe('contactHeaderOrder', () => {
    it('should order headers correctly', () => {
      const a = 'email';
      const b = 'cell_phone';
      const result = contactHeaderOrder(a, b);
      expect(result).toBeLessThan(0);
    });
  });

  describe('validateCustomField', () => {
    it('should validate custom fields correctly', () => {
      expect(
        validateCustomField({ type: FieldTypeEnum.EMAIL }, 'test@test.com')
      ).toBeTrue();
      expect(
        validateCustomField({ type: FieldTypeEnum.DATE }, '01/01/2020')
      ).toBeTrue();
      expect(
        validateCustomField({ type: FieldTypeEnum.LINK }, 'https://test.com')
      ).toBeTrue();
      expect(
        validateCustomField({ type: FieldTypeEnum.PHONE }, '+19847513685')
      ).toBeTrue();
    });
  });

  describe('formatValue', () => {
    it('should format date value correctly', () => {
      const date = new Date(2020, 0, 1);
      const result = formatValue(date);
      expect(result).toBe('01/01/2020');
    });

    it('should format object value correctly', () => {
      const obj = { key1: 'value1', key2: 'value2' };
      const result = formatValue(obj);
      expect(result).toBe('key1, key2');
    });
  });
});
