var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var UploadModel = require('builder/data/upload-model');
var template = require('./import-button.tpl');

var REQUIRED_OPTS = [
  'title',
  'name'
];

/**
 *
 */

module.exports = CoreView.extend({
  className: 'ImportOptions__item',
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
    return this;
  },

  _onClick: function () {
    this.trigger('importSelected', this);
  }
});
