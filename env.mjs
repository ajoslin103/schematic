// ES modules environment detection - this file provides proper env setup for ESM
// It should NOT use require() as that's not available in ES modules

// Check if we're in a browser
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Check if we're in Node.js
export const isNode = typeof process !== 'undefined' && 
                     process.versions != null && 
                     process.versions.node != null;

// Check if fabric is available as global
export const hasFabric = typeof fabric !== 'undefined';

// Environment info for debugging
export const envInfo = {
  environment: isBrowser ? 'browser' : (isNode ? 'node' : 'unknown'),
  hasFabric: hasFabric
};

export default { isBrowser, isNode, hasFabric, envInfo };
