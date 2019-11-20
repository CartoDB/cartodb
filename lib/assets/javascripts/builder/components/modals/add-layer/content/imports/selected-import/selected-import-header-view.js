var cdb = require('internal-carto.js');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var template = require('./selected-import-header.tpl');

var REQUIRED_OPTS = [
  'title',
  'name'
];

/**
 *  Selected Import header
 *
 *
 */

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_goToList'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template({
        title: cdb.core.sanitize.html(this._title),
        name: this._name
      })
    );
    return this;
  },

  _goToList: function () {
    debugger;
    this.trigger('showImportsSelector', this);
  }

});
