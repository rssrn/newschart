// @author Claude Sonnet 4.6 Anthropic
interface UmamiWindow extends Window {
  umami?: { track: (event: string, data?: Record<string, unknown>) => void };
}

export const track = (event: string, data?: Record<string, unknown>): void =>
  (window as UmamiWindow).umami?.track(event, data);
