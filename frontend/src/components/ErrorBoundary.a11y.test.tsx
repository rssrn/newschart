// @author Claude Sonnet 5 Anthropic
import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';
import * as ferrtrap from '../utils/ferrtrap';

function Bomb(): React.ReactElement {
  throw new Error('boom');
}

describe('ErrorBoundary accessibility', () => {
  it('has no axe violations in the caught-error fallback state', async () => {
    vi.spyOn(ferrtrap, 'reportError').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
