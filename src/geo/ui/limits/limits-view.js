var $ = require('jquery');
var View = require('../../../core/view');
var Model = require('../../../core/model');
var template = require('./limits-template.tpl');
var Sanitize = require('../../../core/sanitize');

var ESC_KEY_CODE = 27;

/**
 *  Limits overlay
 *
 */

module.exports = View.extend({
  className: 'CDB-Limits',

  events: {
    'click .js-button': '_toggleLimits',
    'dblclick': 'killEvent'
  },

  initialize: function () {
    this.model = new Model({
      visible: false
    });
    this.map = this.options.map;

    this._onDocumentClick = this._onDocumentClick.bind(this);
    this._onDocumentKeyDown = this._onDocumentKeyDown.bind(this);

    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        limits: Sanitize.html('Some tiles might not be rendering correctly. <a target="_blank" href="https://carto.com/docs/faqs/carto-engine-usage-limits">Learn More</a>')
      })
    );

    return this;
  },

  _initBinds: function () {
    this.model.on('change:visible', this._onVisibleChanged, this);
  },

  _enableDocumentBinds: function () {
    $(document).bind('keydown', this._onDocumentKeyDown);
    $(document).bind('click', this._onDocumentClick);
  },

  _disableDocumentBinds: function () {
    $(document).unbind('keydown', this._onDocumentKeyDown);
    $(document).unbind('click', this._onDocumentClick);
  },

  _onDocumentKeyDown: function (event) {
    if (event && event.keyCode === ESC_KEY_CODE) {
      this._toggleLimits();
    }
  },

  _showLimits: function () {
    this.$el.addClass('is-active');
    this._enableDocumentBinds();
  },

  _hideLimits: function () {
    this.$el.removeClass('is-active');
    this._disableDocumentBinds();
  },

  _toggleLimits: function () {
    this.model.set('visible', !this.model.get('visible'));
  },

  _onDocumentClick: function (event) {
    if (!$(event.target).closest(this.el).length) {
      this._toggleLimits();
    }
  },

  _onVisibleChanged: function (_model, isVisible) {
    isVisible ? this._showLimits() : this._hideLimits();
  },

  clean: function () {
    this._disableDocumentBinds();
    View.prototype.clean.call(this);
  }
});
