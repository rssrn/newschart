// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Credits from './Credits';

describe('Credits accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<Credits />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
