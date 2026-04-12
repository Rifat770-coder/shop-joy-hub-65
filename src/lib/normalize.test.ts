import { describe, it, expect } from 'vitest';
import {
  snakeToCamel,
  normalizeOrder,
  normalizeProfile,
  normalizeCustomer,
  normalizeUserRole,
  getField,
} from './normalize';

describe('normalize utilities', () => {
  describe('snakeToCamel', () => {
    it('converts snake_case object keys to camelCase', () => {
      const input = { user_id: '123', order_total: 99.99, shipping_address: '123 Main St' };
      const result = snakeToCamel(input);
      
      expect(result.userId).toBe('123');
      expect(result.orderTotal).toBe(99.99);
      expect(result.shippingAddress).toBe('123 Main St');
    });

    it('handles already camelCase object keys', () => {
      const input = { userId: '123', orderTotal: 99.99 };
      const result = snakeToCamel(input);
      
      expect(result.userId).toBe('123');
      expect(result.orderTotal).toBe(99.99);
    });

    it('handles empty object', () => {
      const input = {};
      const result = snakeToCamel(input);
      
      expect(result).toEqual({});
    });
  });

  describe('getField', () => {
    it('extracts field preferring camelCase then snake_case', () => {
      const data = { userId: '123', user_id: '456' };
      expect(getField(data, 'userId', 'user_id', 'default')).toBe('123');
    });

    it('falls back to snake_case when camelCase not present', () => {
      const data = { user_id: '456' };
      expect(getField(data, 'userId', 'user_id', 'default')).toBe('456');
    });

    it('returns default value when field not found', () => {
      const data = { otherField: 'value' };
      expect(getField(data, 'userId', 'user_id', 'default')).toBe('default');
    });
  });

  describe('normalizeOrder', () => {
    it('normalizes order with snake_case fields', () => {
      const raw = {
        id: 'order123',
        user_id: 'user456',
        total: 99.99,
        shipping_address: '123 Main St',
        created_at: '2024-01-01T00:00:00Z',
      };

      const normalized = normalizeOrder(raw);

      expect(normalized.id).toBe('order123');
      expect(normalized.userId).toBe('user456');
      expect(normalized.total).toBe(99.99);
      expect(normalized.shippingAddress).toBe('123 Main St');
      expect(normalized.createdAt).toBe('2024-01-01T00:00:00Z');
    });

    it('normalizes order with camelCase fields', () => {
      const raw = {
        id: 'order123',
        userId: 'user456',
        total: 99.99,
        shippingAddress: '123 Main St',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const normalized = normalizeOrder(raw);

      expect(normalized.id).toBe('order123');
      expect(normalized.userId).toBe('user456');
      expect(normalized.total).toBe(99.99);
    });

    it('handles missing fields with defaults', () => {
      const raw = { id: 'order123' };
      const normalized = normalizeOrder(raw);

      expect(normalized.id).toBe('order123');
      expect(normalized.userId).toBeUndefined();
      expect(normalized.total).toBe(0);
      expect(normalized.status).toBe('pending');
    });
  });

  describe('normalizeProfile', () => {
    it('normalizes profile with mixed field names', () => {
      const raw = {
        id: 'profile123',
        user_id: 'user456',
        full_name: 'John Doe',
        phone: '123-456-7890',
      };

      const normalized = normalizeProfile(raw);

      expect(normalized.id).toBe('profile123');
      expect(normalized.userId).toBe('user456');
      expect(normalized.fullName).toBe('John Doe');
      expect(normalized.phone).toBe('123-456-7890');
    });
  });

  describe('normalizeUserRole', () => {
    it('normalizes user role with snake_case user_id', () => {
      const raw = {
        id: 'role123',
        user_id: 'user456',
        role: 'admin',
      };

      const normalized = normalizeUserRole(raw);

      expect(normalized.id).toBe('role123');
      expect(normalized.userId).toBe('user456');
      expect(normalized.role).toBe('admin');
    });

    it('normalizes user role with camelCase userId', () => {
      const raw = {
        id: 'role123',
        userId: 'user456',
        role: 'user',
      };

      const normalized = normalizeUserRole(raw);

      expect(normalized.id).toBe('role123');
      expect(normalized.userId).toBe('user456');
      expect(normalized.role).toBe('user');
    });
  });
});