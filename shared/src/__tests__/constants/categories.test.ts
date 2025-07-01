import { describe, it, expect } from 'vitest';
import { CATEGORIES, CATEGORY_DETAILS } from '../../constants/categories';

describe('Categories Constants', () => {
  it('should have 12 categories', () => {
    expect(CATEGORIES).toHaveLength(12);
  });

  it('should have proper structure for each category', () => {
    CATEGORIES.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('nameEn');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('order');
    });
  });

  it('should have unique category IDs', () => {
    const ids = CATEGORIES.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(CATEGORIES.length);
  });

  it('should have 144 category details (12 categories × 12 details each)', () => {
    expect(CATEGORY_DETAILS).toHaveLength(144);
  });

  it('should have proper structure for each category detail', () => {
    CATEGORY_DETAILS.slice(0, 5).forEach(detail => {
      expect(detail).toHaveProperty('id');
      expect(detail).toHaveProperty('categoryId');
      expect(detail).toHaveProperty('name');
      expect(detail).toHaveProperty('nameEn');
      expect(detail).toHaveProperty('order');
      expect(detail).toHaveProperty('isActive');
    });
  });
});