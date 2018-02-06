const {resolve} = require('path');

module.exports = {
  'backbone/core-view$': resolve(resolve('.'), 'lib/assets/javascripts/vendor/backbone/core-view.js'),
  'backbone/core-model$': resolve(resolve('.'), 'lib/assets/javascripts/vendor/backbone/core-model.js'),
  'jquery-ui$': resolve(resolve('.'), 'lib/assets/javascripts/vendor/jquery-ui.js')
};
