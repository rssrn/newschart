// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import type { AxeMatchers } from 'vitest-axe/matchers';

// vitest-axe's bundled extend-expect is a no-op at runtime and only augments the
// legacy `Vi.Assertion` namespace, which vitest 4 no longer uses — so we register
// the matcher and augment vitest's current Assertion interface ourselves.
expect.extend(axeMatchers as never);

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

// jsdom does not implement scrollIntoView; stub it so components that call it
// inside layout effects (e.g. the active date chip) don't throw during tests.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
