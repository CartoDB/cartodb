var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var embedOverlayTemplate = require('./embed-overlay.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'title',
  'description',
  'showMenu'
];

var EmbedOverlayView = CoreView.extend({
  className: 'CDB-Embed-overlay',

  events: {
    'click .js-toggle': '_toggle'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (!_.isUndefined(options.template)) {
      this._template = options.template;
    }

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.$el.empty();

    var opts = {
      title: this._title,
      description: this._description,
      legends: true,
      showMenu: this._showMenu
    };

    var content = this._renderOverlay(opts);

    if (this._template) {
      content = this._renderTemplate(opts);
    }

    this.$el.html(content);

    return this;
  },

  _renderOverlay: function (opts) {
    return embedOverlayTemplate(opts);
  },

  _renderTemplate: function (opts) {
    return this._template({
      content: this._renderOverlay(_.extend(opts, { legends: false }))
    });
  },

  _initModels: function () {
    this.model = new Backbone.Model({
      collapsed: false
    });
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:collapsed', this._toggleCollapsed, this);
  },

  _toggle: function () {
    this.model.set('collapsed', !this.model.get('collapsed'));
  },

  _toggleCollapsed: function () {
    var collapsed = this.model.get('collapsed');

    this.$('.CDB-Overlay-title').toggleClass('is-collapsed', collapsed);
    this.$('.CDB-ArrowToogle').toggleClass('is-down', !collapsed);
    this.$('.CDB-Overlay-inner').toggleClass('is-active', !collapsed);
  }
});

module.exports = EmbedOverlayView;
