var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var template = require('./selected-import-header.tpl');

var REQUIRED_OPTS = [
  'title',
  'name'
];

/**
 *  Selected Import header
 */

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_goToList'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._beta = opts.beta;
  },

  render: function () {
    this.$el.html(
      template({
        title: this._title,
        name: this._name,
        beta: this._beta,
        __ASSETS_PATH__: '__ASSETS_PATH__'
      })
    );
    return this;
  },

  _goToList: function () {
    this.trigger('showImportsSelector', this);
  }
});
