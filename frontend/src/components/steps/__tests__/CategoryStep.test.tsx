import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryStep } from '../CategoryStep';
import { usePromptStore } from '@/stores/promptStore';

// Mock the store
vi.mock('@/stores/promptStore');

describe('CategoryStep', () => {
  const mockOnNext = vi.fn();
  const mockSetCategory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear selection when store is reset', () => {
    // Initial render with a selected category
    (usePromptStore as any).mockReturnValue({
      currentPrompt: {
        category: {
          predefinedId: 'animal',
          name: '動物',
          nameEn: 'Animal',
        },
      },
      setCategory: mockSetCategory,
    });

    const { rerender } = render(<CategoryStep onNext={mockOnNext} />);

    // Verify initial selection
    const animalButton = screen.getByRole('radio', { name: /動物 - Animal/ });
    expect(animalButton).toHaveAttribute('aria-checked', 'true');

    // Simulate store reset
    (usePromptStore as any).mockReturnValue({
      currentPrompt: {},
      setCategory: mockSetCategory,
    });

    rerender(<CategoryStep onNext={mockOnNext} />);

    // Verify selection is cleared
    const animalButtonAfterReset = screen.getByRole('radio', { name: /動物 - Animal/ });
    expect(animalButtonAfterReset).toHaveAttribute('aria-checked', 'false');
  });

  it('should select a category and proceed to next step', () => {
    (usePromptStore as any).mockReturnValue({
      currentPrompt: {},
      setCategory: mockSetCategory,
    });

    render(<CategoryStep onNext={mockOnNext} />);

    // Click on a category
    const foodButton = screen.getByRole('radio', { name: /食べ物 - Food/ });
    fireEvent.click(foodButton);

    // Click next button
    const nextButton = screen.getByRole('button', { name: '詳細選択へ進む' });
    fireEvent.click(nextButton);

    // Verify category was set
    expect(mockSetCategory).toHaveBeenCalledWith({
      predefinedId: 'food',
      name: '食べ物',
      nameEn: 'Food',
    });
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('should disable next button when no category is selected', () => {
    (usePromptStore as any).mockReturnValue({
      currentPrompt: {},
      setCategory: mockSetCategory,
    });

    render(<CategoryStep onNext={mockOnNext} />);

    const nextButton = screen.getByRole('button', { name: '詳細選択へ進む' });
    expect(nextButton).toBeDisabled();
  });
});
