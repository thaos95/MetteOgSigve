import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WishlistCard, WishlistVendor } from '../WishlistCard';

describe('WishlistCard', () => {
  const mockWishlist: WishlistVendor = {
    id: 'test-vendor',
    name: 'Test Vendor',
    description: 'Test description',
    url: 'https://example.com/wishlist',
  };

  it('renders vendor name', () => {
    render(<WishlistCard wishlist={mockWishlist} />);
    expect(screen.getByText('Test Vendor')).toBeInTheDocument();
  });

  it('renders vendor description', () => {
    render(<WishlistCard wishlist={mockWishlist} />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders CTA text', () => {
    render(<WishlistCard wishlist={mockWishlist} />);
    expect(screen.getByText('Se ønskeliste')).toBeInTheDocument();
  });

  it('renders link with correct href', () => {
    render(<WishlistCard wishlist={mockWishlist} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/wishlist');
  });

  it('opens link in new tab with security attributes', () => {
    render(<WishlistCard wishlist={mockWishlist} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders gift icon', () => {
    render(<WishlistCard wishlist={mockWishlist} />);
    // The card should contain an SVG icon
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
