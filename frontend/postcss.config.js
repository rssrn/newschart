import autoprefixer from 'autoprefixer';

// Autoprefixer emits vendor prefixes (e.g. -webkit-backdrop-filter) in the order
// the esbuild minifier preserves, so prefixes never need hand-authoring. Targets
// come from the "browserslist" field in package.json.
export default {
  plugins: [autoprefixer()],
};
