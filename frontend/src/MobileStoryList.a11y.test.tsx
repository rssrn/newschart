// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import MobileStoryList from './MobileStoryList';
import calloutsFixture from './__tests__/a11y/fixtures/callouts-for-day.json';
import type { StoryCallout } from './types/news';

const callouts = calloutsFixture as StoryCallout[];

describe('MobileStoryList accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<MobileStoryList callouts={callouts} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
