import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WishlistPage from '../page';

// Mock the weddingConfig
vi.mock('../../../lib/weddingConfig', () => ({
  weddingConfig: {
    wishlists: [
      {
        id: 'tilbords',
        name: 'Tilbords',
        description: 'Servise og kjøkkenutstyr',
        url: 'https://www.tilbords.no/min-side/onskelister/172091/',
      },
      {
        id: 'illumsbolighus',
        name: 'Illums Bolighus',
        description: 'Interiør og design',
        url: 'https://www.illumsbolighus.no/onskeliste/andre?id=761fabb33f00e34b46fe2624ab',
      },
      {
        id: 'kitchn',
        name: 'Kitchn',
        description: 'Kjøkkenutstyr',
        url: 'https://www.kitchn.no/onskeliste/245134/',
      },
    ],
  },
}));

describe('WishlistPage', () => {
  it('renders the page title', () => {
    render(<WishlistPage />);
    expect(screen.getByRole('heading', { name: /ønskeliste/i, level: 1 })).toBeInTheDocument();
  });

  it('renders all vendor wishlist cards', () => {
    render(<WishlistPage />);
    
    expect(screen.getByText('Tilbords')).toBeInTheDocument();
    expect(screen.getByText('Illums Bolighus')).toBeInTheDocument();
    expect(screen.getByText('Kitchn')).toBeInTheDocument();
  });

  it('renders vendor descriptions', () => {
    render(<WishlistPage />);
    
    expect(screen.getByText('Servise og kjøkkenutstyr')).toBeInTheDocument();
    expect(screen.getByText('Interiør og design')).toBeInTheDocument();
    expect(screen.getByText('Kjøkkenutstyr')).toBeInTheDocument();
  });

  it('renders how-it-works section', () => {
    render(<WishlistPage />);
    
    expect(screen.getByText('Slik fungerer det')).toBeInTheDocument();
    expect(screen.getByText(/kjøp og reservasjon skjer direkte hos leverandøren/i)).toBeInTheDocument();
  });

  it('does not render unnecessary alternative gift note (Norwegian cultural norm)', () => {
    render(<WishlistPage />);
    
    // Gift-giving is implicit in Norwegian culture - no need to explain alternatives
    expect(screen.queryByText(/gaver utenom ønskelistene/i)).not.toBeInTheDocument();
  });

  it('renders external links with correct attributes', () => {
    render(<WishlistPage />);
    
    const tilbordsLink = screen.getByRole('link', { name: /tilbords/i });
    expect(tilbordsLink).toHaveAttribute('target', '_blank');
    expect(tilbordsLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(tilbordsLink).toHaveAttribute('href', 'https://www.tilbords.no/min-side/onskelister/172091/');

    const illumsLink = screen.getByRole('link', { name: /illums bolighus/i });
    expect(illumsLink).toHaveAttribute('target', '_blank');
    expect(illumsLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(illumsLink).toHaveAttribute('href', 'https://www.illumsbolighus.no/onskeliste/andre?id=761fabb33f00e34b46fe2624ab');

    const kitchnLink = screen.getByRole('link', { name: /kitchn/i });
    expect(kitchnLink).toHaveAttribute('target', '_blank');
    expect(kitchnLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(kitchnLink).toHaveAttribute('href', 'https://www.kitchn.no/onskeliste/245134/');
  });
});
