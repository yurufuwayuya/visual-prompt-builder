import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryStep } from './CategoryStep';
import { usePromptStore } from '@/stores/promptStore';

// Mock the store
vi.mock('@/stores/promptStore');

// Mock window.confirm
global.confirm = vi.fn();

describe('CategoryStep - Category Change Alert', () => {
  const mockOnNext = vi.fn();
  const mockSetCategory = vi.fn();
  const mockClearSelectionsFromDetails = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (global.confirm as any).mockReset();
  });

  it('should show alert when changing category with existing details', async () => {
    // Setup: Category selected with details
    (usePromptStore as any).mockReturnValue({
      currentPrompt: {
        category: {
          predefinedId: 'animal',
          displayName: '動物',
        },
        details: [
          { predefinedId: 'cat', displayName: '猫', order: 0 },
          { predefinedId: 'dog', displayName: '犬', order: 1 },
        ],
      },
      setCategory: mockSetCategory,
      clearSelectionsFromDetails: mockClearSelectionsFromDetails,
    });

    render(<CategoryStep onNext={mockOnNext} />);

    // Current category should be selected
    const animalButton = screen.getByRole('radio', { name: /動物 - Animal/ });
    expect(animalButton).toHaveAttribute('aria-checked', 'true');

    // Mock confirm to return true (user confirms)
    (global.confirm as any).mockReturnValue(true);

    // Try to select a different category
    const foodButton = screen.getByRole('radio', { name: /食べ物 - Food/ });
    fireEvent.click(foodButton);

    // Verify confirm was called with the correct message
    expect(global.confirm).toHaveBeenCalledWith(
      'カテゴリを変更すると、現在選択されている詳細やスタイルなどがすべてリセットされます。\n続行しますか？'
    );

    // Verify clearSelectionsFromDetails was called
    expect(mockClearSelectionsFromDetails).toHaveBeenCalled();

    // Verify new category was set
    expect(mockSetCategory).toHaveBeenCalledWith({
      predefinedId: 'food',
      displayName: '食べ物',
    });
  });

  it('should not change category when user cancels', () => {
    // Setup: Category selected with details
    (usePromptStore as any).mockReturnValue({
      currentPrompt: {
        category: {
          predefinedId: 'animal',
          displayName: '動物',
        },
        details: [
          { predefinedId: 'cat', displayName: '猫', order: 0 },
        ],
      },
      setCategory: mockSetCategory,
      clearSelectionsFromDetails: mockClearSelectionsFromDetails,
    });

    render(<CategoryStep onNext={mockOnNext} />);

    // Mock confirm to return false (user cancels)
    (global.confirm as any).mockReturnValue(false);

    // Try to select a different category
    const foodButton = screen.getByRole('radio', { name: /食べ物 - Food/ });
    fireEvent.click(foodButton);

    // Verify confirm was called
    expect(global.confirm).toHaveBeenCalled();

    // Verify nothing was cleared or changed
    expect(mockClearSelectionsFromDetails).not.toHaveBeenCalled();
    expect(mockSetCategory).not.toHaveBeenCalled();
  });

  it('should not show alert when no details are selected', () => {
    // Setup: Category selected but no details
    (usePromptStore as any).mockReturnValue({
      currentPrompt: {
        category: {
          predefinedId: 'animal',
          displayName: '動物',
        },
        details: [],
      },
      setCategory: mockSetCategory,
      clearSelectionsFromDetails: mockClearSelectionsFromDetails,
    });

    render(<CategoryStep onNext={mockOnNext} />);

    // Try to select a different category
    const foodButton = screen.getByRole('radio', { name: /食べ物 - Food/ });
    fireEvent.click(foodButton);

    // Verify confirm was NOT called
    expect(global.confirm).not.toHaveBeenCalled();
  });

  it('should not show alert when selecting for the first time', () => {
    // Setup: No category selected yet
    (usePromptStore as any).mockReturnValue({
      currentPrompt: {},
      setCategory: mockSetCategory,
      clearSelectionsFromDetails: mockClearSelectionsFromDetails,
    });

    render(<CategoryStep onNext={mockOnNext} />);

    // Select a category for the first time
    const foodButton = screen.getByRole('radio', { name: /食べ物 - Food/ });
    fireEvent.click(foodButton);

    // Verify confirm was NOT called
    expect(global.confirm).not.toHaveBeenCalled();
  });
});