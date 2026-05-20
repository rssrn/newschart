// @author Claude Sonnet 4.6 Anthropic
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import DateTimeline from './DateTimeline';

const dates = ['2026-05-18', '2026-05-19'];

describe('DateTimeline accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <DateTimeline
        availableDates={dates}
        selectedDate={dates[1]}
        onChange={() => {}}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations when disabled', async () => {
    const { container } = render(
      <DateTimeline
        availableDates={dates}
        selectedDate={dates[0]}
        onChange={() => {}}
        disabled
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
