import { render, waitFor, act } from '@testing-library/react';
import App from './App';

test('renders without crashing', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }));
  let container: HTMLElement;
  await act(async () => {
    ({ container } = render(<App />));
  });
  expect(container!.querySelector('.map-container')).toBeInTheDocument();
  vi.unstubAllGlobals();
});

describe('backend recovery', () => {
  const rejectAll = () => vi.fn().mockRejectedValue(new Error('Network error'));

  test('shows the error toast when the news fetch fails', async () => {
    vi.stubGlobal('fetch', rejectAll());
    await act(async () => { render(<App />); });
    await waitFor(() =>
      expect(document.querySelector('.fetch-error-toast.visible')).toBeInTheDocument()
    );
    vi.unstubAllGlobals();
  });

  test('re-issues a fetch after the first backoff interval (5 s)', async () => {
    vi.useFakeTimers();
    const mockFetch = rejectAll();
    vi.stubGlobal('fetch', mockFetch);

    await act(async () => { render(<App />); });
    // flush promise rejections so the error state is set and the backoff timer is armed
    await act(async () => {});

    const callsAtError = mockFetch.mock.calls.length;
    expect(callsAtError).toBeGreaterThan(0);

    // advance past the first 5 s backoff and flush the retry fetch
    await act(async () => { vi.advanceTimersByTime(5001); });
    await act(async () => {});

    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsAtError);

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});
