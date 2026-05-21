// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Accessibility from './Accessibility';

describe('Accessibility page accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<Accessibility />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
