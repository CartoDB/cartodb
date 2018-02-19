const {resolve} = require('path');

module.exports = {
  'fixtures': resolve(resolve('.'), 'lib/assets/test/spec/fixtures'),
  'backbone/core-view$': resolve(resolve('.'), 'lib/assets/javascripts/vendor/backbone/core-view.js'),
  'backbone/core-model$': resolve(resolve('.'), 'lib/assets/javascripts/vendor/backbone/core-model.js'),
  'jquery-ui$': resolve(resolve('.'), 'lib/assets/javascripts/vendor/jquery-ui.js'),
  'backbone': resolve(resolve('.'), 'node_modules/backbone') // Avoid two different `backbone` modules when linking `cartodb.js`  'fixtures/dashboard'
};
