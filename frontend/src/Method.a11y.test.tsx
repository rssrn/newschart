// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Method from './Method';

describe('Method accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<Method />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
