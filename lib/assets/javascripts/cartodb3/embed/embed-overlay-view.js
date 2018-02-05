var CoreView = require('backbone/core-view');
var template = require('./embed-overlay.tpl');
var checkAndBuildOpts = require('../helpers/required-opts');

var REQUIRED_OPTS = [
  'title',
  'description'
];

var EmbedOverlayView = CoreView.extend({
  className: 'CDB-Embed-overlay',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.empty();

    this.$el.html(template({
      title: this._title,
      description: this._description
    }));

    return this;
  }
});

module.exports = EmbedOverlayView;
