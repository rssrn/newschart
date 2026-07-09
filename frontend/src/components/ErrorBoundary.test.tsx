// @author Claude Sonnet 5 Anthropic
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import * as ferrtrap from '../utils/ferrtrap';

function Bomb(): React.ReactElement {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(ferrtrap, 'reportError').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    render(<ErrorBoundary><div>fine</div></ErrorBoundary>);
    expect(screen.getByText('fine')).toBeInTheDocument();
  });

  it('renders a fallback and reports to ferrtrap when a child throws', () => {
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(ferrtrap.reportError).toHaveBeenCalledWith('Error', 'boom');
  });
});
