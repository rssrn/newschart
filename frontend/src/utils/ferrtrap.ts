// @author Claude Sonnet 5 Anthropic
export const reportError = (errorType: string, errorText: string, level: 'error' | 'warn' = 'error'): void => {
  fetch('/ferrtrap/stamp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app: 'newschart',
      level,
      errortype: errorType.slice(0, 50),
      url: window.location.href.slice(0, 100),
      errortext: errorText.slice(0, 1024),
    }),
  }).catch(() => {});
};
