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

// NOTE: vitest is pinned to ^4 (see .github/dependabot.yml) because vitest 5 changed
// `Assertion` to take two type params (`Assertion<R, T>` instead of `Assertion<T>`).
// @testing-library/jest-dom's bundled vitest types — and likely vitest-axe's own, given
// the comment above — still target the old single-param signature, so the Assertion
// declaration below (and jest-dom's own) fails to merge under vitest 5. Revisit the
// vitest 5 bump once jest-dom ships types compatible with the new signature.
declare module 'vitest' {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type */
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type */
}

// jsdom does not implement scrollIntoView; stub it so components that call it
// inside layout effects (e.g. the active date chip) don't throw during tests.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom does not implement canvas; stub getContext so d3-geo doesn't
// log "Not implemented" noise on every test that renders a map.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}

