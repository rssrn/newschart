// @author Claude Sonnet 5 Anthropic
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { reportError } from './ferrtrap';

function lastRequestBody(): Record<string, unknown> {
  const mockFetch = fetch as Mock;
  return JSON.parse(mockFetch.mock.calls[0][1].body);
}

describe('reportError', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('posts to /ferrtrap/stamp with the expected payload shape', () => {
    reportError('TypeError', 'something broke');
    expect(fetch).toHaveBeenCalledWith('/ferrtrap/stamp', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
    expect(lastRequestBody()).toEqual({
      app: 'newschart',
      level: 'error',
      errortype: 'TypeError',
      url: window.location.href,
      errortext: 'something broke',
    });
  });

  it('defaults level to error and accepts warn', () => {
    reportError('Warning', 'heads up', 'warn');
    expect(lastRequestBody().level).toBe('warn');
  });

  it('truncates fields to match ferrtrap server-side caps', () => {
    reportError('T'.repeat(100), 'E'.repeat(2000));
    const body = lastRequestBody();
    expect(body.errortype).toHaveLength(50);
    expect(body.errortext).toHaveLength(1024);
  });

  it('does not throw when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    expect(() => reportError('Err', 'text')).not.toThrow();
  });
});
