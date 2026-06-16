// @author Claude Sonnet 4.6 Anthropic
import { render, act } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { afterEach } from 'vitest';
import App from './App';
import calloutsFixture from './__tests__/a11y/fixtures/callouts-for-day.json';
import availableDaysFixture from './__tests__/a11y/fixtures/available-days.json';
import statsFixture from './__tests__/a11y/fixtures/stats-all-callouts.json';

function stubFetch() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url.includes('availableDays')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(availableDaysFixture) });
    }
    if (url.includes('calloutsForDay')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(calloutsFixture) });
    }
    if (url.includes('statsAllCallouts')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(statsFixture) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('MapChart (App) accessibility', () => {
  it('has no axe violations in initial consensus view (default)', async () => {
    localStorage.setItem('newsSource', 'GOOGLE_GEMINI');
    stubFetch();
    await act(async () => { render(<App />); });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations in day view', async () => {
    localStorage.setItem('viewMode', 'day');
    localStorage.setItem('newsSource', 'GOOGLE_GEMINI');
    stubFetch();
    await act(async () => { render(<App />); });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
