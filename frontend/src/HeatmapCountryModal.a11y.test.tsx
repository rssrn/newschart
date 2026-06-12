// @author Claude Sonnet 4.6 Anthropic
import { render, act, screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { afterEach } from 'vitest';
import HeatmapCountryModal from './HeatmapCountryModal';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HeatmapCountryModal accessibility', () => {
  it('has no axe violations when open', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [],
        totalPages: 1,
        totalElements: 0,
        number: 0,
        size: 10,
      }),
    } as unknown as Response);
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

  it('has no axe violations in error state and shows retry button (network error)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    await act(async () => {
      render(
        <HeatmapCountryModal
          source="NEW_YORK_TIMES"
          iso2="JP"
          countryName="Japan"
          totalCount={8}
          onClose={() => {}}
        />
      );
    });
    await waitFor(() => {
      expect(screen.getByText('Failed to load stories')).toBeInTheDocument();
    });
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('has no axe violations in error state on HTTP error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
    } as unknown as Response);
    await act(async () => {
      render(
        <HeatmapCountryModal
          source="NEW_YORK_TIMES"
          iso2="DE"
          countryName="Germany"
          totalCount={3}
          onClose={() => {}}
        />
      );
    });
    await waitFor(() => {
      expect(screen.getByText('Failed to load stories')).toBeInTheDocument();
    });
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
