var CoreView = require('backbone/core-view');
var template = require('./embed-title.tpl');
var checkAndBuildOpts = require('../helpers/required-opts');

var REQUIRED_OPTS = [
  'title',
  'description'
];

var EmbedTitleView = CoreView.extend({
  className: 'CDB-Embed-title u-bSpace--xl',

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

module.exports = EmbedTitleView;
