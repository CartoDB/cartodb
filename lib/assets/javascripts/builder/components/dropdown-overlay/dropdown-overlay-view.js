var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

/*
 *  Dropdown overlay to disable all interactions between elements
 *  beneath the dropdown
 */
module.exports = CoreView.extend({

  className: 'CDB-Box-modalOverlay',

  events: {
    'click': '_onOverlayClicked'
  },

  initialize: function (opts) {
    this.container = opts && opts.container;
    this.onClickAction = opts && opts.onClickAction;

    this.model = new Backbone.Model({
      visible: _.isUndefined(opts && opts.visible) ? false : opts.visible
    });

    this._initBinds();
    this.render();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:visible', this._onVisibilityChange);
  },

  render: function () {
    (this.container || $(document.body)).append(this.$el);
    this.$el.toggle(this.isVisible());
    return this;
  },

  _onOverlayClicked: function () {
    this.onClickAction && this.onClickAction();
    this.hide();
  },

  show: function () {
    this.model.set('visible', true);
  },

  hide: function () {
    this.model.set('visible', false);
  },

  toggle: function () {
    this.model.set('visible', !this.model.get('visible'));
  },

  isVisible: function () {
    return this.model.get('visible');
  },

  _onVisibilityChange: function () {
    this.$el.toggle(this.isVisible());
  }
});
