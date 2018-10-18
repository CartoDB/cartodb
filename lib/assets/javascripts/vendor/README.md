Utilizes https://github.com/substack/browserify-handbook#how-node_modules-works,
to avoid annoying `require('../../../../../')` for both source and test environment

## Relevant changes

### 2018-02-01

- We don't need this under a node_modules anymore, using webpack alias

### 2016-06-09 - Installing jquery-ui (v0.11.4)
- npm package is unofficial and outdated (v0.10.5)
- jquery-ui team won't update it until releasing v0.12 (see https://forum.jquery.com/topic/publishing-jquery-ui-version-1-11-2-to-npm)
- until available, installing it the recommended/official way

### 2016-06-03 - Porting cartodb.js/core/view
- Removed unused parts (e.g. Profiler)
- compare `./backbone/core-view` vs. https://github.com/CartoDB/cartodb.js/blob/470399abb12b40d5476ab6bbfd792d95aa819f50/src/core/
