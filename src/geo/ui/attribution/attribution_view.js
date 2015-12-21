var $ = require('jquery');
var _ = require('underscore');
var View = require('../../../core/view');
var template = require('./attribution_template.tpl');
var Sanitize = require('../../../core/sanitize');

/**
 *  Attribution overlay
 *
 */

var Attribution = View.extend({
  className: 'CDB-Attribution',

  events: {
    'click .js-button': '_showAttributions',
    'dblclick': 'killEvent'
  },

  initialize: function () {
    this.map = this.options.map;
    _.bindAll(this, '_onKeyDown', '_hideAttributions');
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
    $(document).bind('click', this._hideAttributions);
    this.map.bind('change:attribution', this.render, this);
  },

  _disableBinds: function () {
    $(document).unbind('keydown', this._onKeyDown);
    $(document).unbind('click', this._hideAttributions);
    this.map.unbind(null, null, this);
  },

  _onKeyDown: function (e) {
    if (e && e.keyCode === 27) {
      this._hideAttributions();
    }
  },

  _showAttributions: function (e) {
    this.killEvent(e);
    this.$('.js-text').addClass('is-visible');
    this.$('.js-button').removeClass('is-visible');
    this._initBinds();
  },

  _hideAttributions: function () {
    this.$('.js-text').removeClass('is-visible');
    this.$('.js-button').addClass('is-visible');
    this._disableBinds();
  },

  clean: function () {
    this._disableBinds();
    View.prototype.clean.call(this);
  }
});

module.exports = Attribution;
