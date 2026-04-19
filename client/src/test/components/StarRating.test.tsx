import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import StarRating from '../../components/common/StarRating';

describe('StarRating', () => {
  it('rend 5 étoiles par défaut', () => {
    render(<StarRating rating={3} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('rend le bon nombre d\'étoiles personnalisé', () => {
    render(<StarRating rating={2} maxRating={3} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('affiche la valeur quand showValue=true', () => {
    render(<StarRating rating={4.3} showValue />);
    expect(screen.getByText('4.3')).toBeInTheDocument();
  });

  it('affiche le nombre d\'avis quand count est fourni', () => {
    render(<StarRating rating={4} count={42} />);
    expect(screen.getByText('(42)')).toBeInTheDocument();
  });

  it('appelle onChange au clic quand interactive=true', () => {
    const onChange = vi.fn();
    render(<StarRating rating={0} interactive onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[3]); // 4ème étoile → note 4
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('ne déclenche pas onChange si non interactif', () => {
    const onChange = vi.fn();
    render(<StarRating rating={3} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
