// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { SourceBadgeHtml } from './SourceBadge';

describe('SourceBadge accessibility', () => {
  it('has no axe violations in default state', async () => {
    const { container } = render(<SourceBadgeHtml source="GOOGLE_GEMINI" filled={true} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in dimmed state', async () => {
    const { container } = render(<SourceBadgeHtml source="GOOGLE_GEMINI" filled={true} highlight="PERPLEXITY" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in emphasis state', async () => {
    const { container } = render(<SourceBadgeHtml source="GOOGLE_GEMINI" filled={true} highlight="GOOGLE_GEMINI" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations when not filled and dimmed', async () => {
    const { container } = render(<SourceBadgeHtml source="GOOGLE_GEMINI" filled={false} highlight="PERPLEXITY" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
