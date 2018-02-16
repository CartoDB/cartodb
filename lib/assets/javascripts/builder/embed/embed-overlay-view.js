var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./embed-overlay.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'title',
  'description'
];

var EmbedOverlayView = CoreView.extend({
  className: 'CDB-Embed-overlay',

  events: {
    'click .js-toggle': '_toggle'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.$el.empty();

    this.$el.html(template({
      title: this._title,
      description: this._description,
      collapsed: this.model.get('collapsed')
    }));

    return this;
  },

  _initModels: function () {
    this.model = new Backbone.Model({
      collapsed: false
    });
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:collapsed', this.render, this);
  },

  _toggle: function () {
    this.model.set('collapsed', !this.model.get('collapsed'));
  }
});

module.exports = EmbedOverlayView;
