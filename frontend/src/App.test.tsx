import { render } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  const { container } = render(<App />);
  const mapContainer = container.querySelector('.map-container');
  expect(mapContainer).toBeInTheDocument();
});
