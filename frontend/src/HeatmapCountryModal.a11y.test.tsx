// @author Claude Sonnet 4.6 Anthropic
import { render, act } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { beforeEach, afterEach } from 'vitest';
import HeatmapCountryModal from './HeatmapCountryModal';
import type { SpringPage, SourceCallout } from './types/news';

const mockPage: SpringPage<SourceCallout> = {
  content: [],
  totalPages: 1,
  totalElements: 0,
  number: 0,
  size: 10,
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockPage),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HeatmapCountryModal accessibility', () => {
  it('has no axe violations when open', async () => {
    await act(async () => {
      render(
        <HeatmapCountryModal
          source="GOOGLE_GEMINI"
          iso2="IR"
          countryName="Iran"
          totalCount={19}
          onClose={() => {}}
        />
      );
    });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
