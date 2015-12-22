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

var Attribution = View.extend({
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
    this.model.bind('change:visible', function (mdl, isVisible) {
      this[ isVisible ? '_showAttributions' : '_hideAttributions' ]();
    }, this);
    _.bindAll(this, '_onKeyDown', '_toggleAttributions');
  },

  render: function () {
    this._disableBinds();
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
    $(document).bind('keydown', this._onKeyDown);
    $(document).bind('click', this._toggleAttributions);
    this.map.bind('change:attribution', this.render, this);
  },

  _disableBinds: function () {
    $(document).unbind('keydown', this._onKeyDown);
    $(document).unbind('click', this._toggleAttributions);
    this.map.unbind(null, null, this);
  },

  _onKeyDown: function (e) {
    if (e && e.keyCode === 27) {
      this._toggleAttributions();
    }
  },

  _showAttributions: function (e) {
    this.killEvent(e);
    this.$('.js-text').addClass('is-visible');
    this._initBinds();
  },

  _hideAttributions: function () {
    this.$('.js-text').removeClass('is-visible');
    this._disableBinds();
  },

  _toggleAttributions: function (e) {
    if (e && e.stopPropagation) {
      this.killEvent(e);
    }
    this.model.set('visible', !this.model.get('visible'));
  },

  clean: function () {
    this._disableBinds();
    View.prototype.clean.call(this);
  }
});

module.exports = Attribution;
