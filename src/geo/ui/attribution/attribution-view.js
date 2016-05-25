var $ = require('jquery');
var _ = require('underscore');
var View = require('../../../core/view');
var Model = require('../../../core/model');
var template = require('./attribution-template.tpl');
var Sanitize = require('../../../core/sanitize');

/**
 *  Attribution overlay
 *
 */

module.exports = View.extend({
  className: 'CDB-Attribution',

  events: {
    'click .js-button': '_toggleAttributions',
    'dblclick': 'killEvent'
  },

  initialize: function () {
    this.model = new Model({
      visible: false
    });
    this.map = this.options.map;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._toggleAttributions = this._toggleAttributions.bind(this);
  },

  render: function () {
    var attributions = _.compact(this.map.get('attribution')).join(', ');
    var isGMaps = this.map.get('provider') !== 'leaflet';
    this.$el.html(
      template({
        attributions: Sanitize.html(attributions)
      })
    );
    this.$el.toggleClass('CDB-Attribution--gmaps', !!isGMaps);
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:visible', function (mdl, isVisible) {
      this[ isVisible ? '_showAttributions' : '_hideAttributions' ]();
    }, this);
    this._enableDocumentBinds();
    this.map.bind('change:attribution', this.render, this);
    this.add_related_model(this.map);
  },

  _enableDocumentBinds: function () {
    $(document).bind('keydown', this._onKeyDown);
    $(document).bind('click', this._toggleAttributions);
  },

  _disableDocumentBinds: function () {
    $(document).unbind('keydown', this._onKeyDown);
    $(document).unbind('click', this._toggleAttributions);
  },

  _onKeyDown: function (e) {
    if (e && e.keyCode === 27) {
      this._toggleAttributions();
    }
  },

  _showAttributions: function () {
    this.$el.addClass('is-active');
    this._enableDocumentBinds();
  },

  _hideAttributions: function () {
    this.$el.removeClass('is-active');
    this._disableDocumentBinds();
  },

  _toggleAttributions: function (e) {
    if (e && e.stopPropagation) {
      this.killEvent(e);
    }
    this.model.set('visible', !this.model.get('visible'));
  },

  clean: function () {
    this._disableDocumentBinds();
    View.prototype.clean.call(this);
  }
});
