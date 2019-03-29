'use strict';
var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var createDefaultFallbackMap = require('../common/views/create_default_fallback_map');
var GAPusher = require('../common/analytics_pusher');

/**
 *  Onboarding view
 *
 *  It includes:
 *  - onboard map (rendered when element is visible)
 *  - welcome text (visible checking local storage)
 *
 */


module.exports = cdb.core.View.extend({

  tagName: 'div',
  className: 'OnBoarding',

  events: {
    'click .js-createMap': '_createMap'
  },

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('dashboard/views/onboarding');
    this._resizeMap();
    this._initBindings();
  },

  render: function() {
    this.$el.html(
      this.template({
        username: this.user.get('name') || this.user.get('username'),
        hasCreateMapsFeature: this.user.hasCreateMapsFeature()
      })
    );

    return this;
  },

  _renderMap: function() {
    if (this.map) {
      return;
    }

    this.map = createDefaultFallbackMap({
      el: this.$('.js-onboarding-map'),
      baselayer: cdb.config.get('default_fallback_basemap'),
      scrollwheel: false
    });
  },

  _createMap: function() {
    GAPusher({
      eventName: 'send',
      hitType: 'event',
      eventCategory: 'New Map',
      eventAction: 'click',
      eventLabel: 'Dashboard'
    });
    cdb.god.trigger('openCreateDialog', { type: 'map' });
  },

  _destroyMap: function() {
    if (this.map) {
      this.map.remove();
    }
  },

  _initBindings: function() {
    _.bindAll(this, '_resizeMap');
    $(window).on('resize', this._resizeMap);
  },

  _destroyBindings: function() {
    $(window).off('resize', this._resizeMap);
  },

  _resizeMap: function() {
    // 71px is the height of the main header
    this.$el.height( window.innerHeight - 71 );
  },

  show: function() {
    this.$el.show();
    // We need to have element visible in order
    // to render leaflet map properly
    this._renderMap();
  },

  hide: function() {
    this.$el.hide();
  },

  clean: function() {
    this._destroyMap();
    this._destroyBindings();
    cdb.core.View.prototype.clean.call(this);
  }

});
