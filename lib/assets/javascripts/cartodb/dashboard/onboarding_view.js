'use strict';
var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var createDefaultFallbackMap = require('../common/views/create_default_fallback_map');

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
    'click .OnBoarding-welcome': '_hideWelcome'
  },

  initialize: function() {
    this.user = this.options.user;
    this.localStorage = this.options.localStorage;
    this.template = cdb.templates.getTemplate('dashboard/views/onboarding');
    this._resizeMap();
    this._initBindings();
  },

  render: function() {
    this.$el.html(
      this.template({
        renderContent: !this.localStorage.get('dashboard.welcome'),
        username: this.user.get('name') || this.user.get('username')
      })
    );

    return this;
  },

  _disableScroll: function() {
    $('body').addClass('is-inDialog');
  },

  _enableScroll: function() {
    $('body').removeClass('is-inDialog');
  },

  _hideWelcome: function(e) {
    if (e) {
      e.preventDefault();
    }
    this.localStorage.set({ 'dashboard.welcome': true });
    this._enableScroll();
    this.$('.OnBoarding-welcome').animate({
      opacity: 0
    }, 500, function() {
      $(this).remove();
    });
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
    this.$el.height( window.innerHeight - 164 );
  },

  show: function() {
    this.$el.show();
    // We need to have element visible in order
    // to render leaflet map properly
    this._renderMap();

    // Check if it is necessary to disable scroll
    // for showing onboarding welcome block
    if (!this.localStorage.get('dashboard.welcome') && this.$('.OnBoarding-welcome').length > 0) {
      this._disableScroll();
    }
  },

  hide: function() {
    this.$el.hide();
    this._enableScroll();
  },

  clean: function() {
    this._destroyMap();
    this._destroyBindings();
    cdb.core.View.prototype.clean.call(this);
  }

});
