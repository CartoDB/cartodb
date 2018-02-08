var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./embed-overlay.tpl');
var checkAndBuildOpts = require('cartodb3/helpers/required-opts');

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

    if (options.template !== void 0) {
      this._template = options.template;
    }

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.$el.empty();

    this.$el.html(this._renderContent());

    return this;
  },

  _renderContent: function () {
    var opts = {
      title: this._title,
      description: this._description,
      legends: true
    };

    var content = template(opts);

    if (this._template) {
      content = this._template({
        content: template(_.extend(opts, { legends: false }))
      });
    }

    return content;
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
