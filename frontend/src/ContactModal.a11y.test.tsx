// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import ContactModal from './ContactModal';

describe('ContactModal accessibility', () => {
  it('has no axe violations when open', async () => {
    render(<ContactModal onClose={() => {}} />);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
