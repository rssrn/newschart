import { render, act } from '@testing-library/react';
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
