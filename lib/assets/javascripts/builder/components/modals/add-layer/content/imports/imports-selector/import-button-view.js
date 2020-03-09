var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var template = require('./import-button.tpl');

var REQUIRED_OPTS = [
  'title',
  'name',
  'loaded'
];

/**
 * Import button displayed in imports selector
 */

module.exports = CoreView.extend({
  className: 'ImportButton',
  tagName: 'button',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template({
        name: this._name,
        title: this._title
      })
    );
    this.$el.addClass('js-' + this._name + 'Button');
    return this;
  },

  _onClick: function () {
    if (this._loaded) {
      this.trigger('importSelected', this);
    }
  }
});
