const $ = require('jquery');
const _ = require('underscore');
const CoreView = require('backbone/core-view');
const createDefaultFallbackMap = require('dashboard/components/create-fallback-map');
const GAPusher = require('dashboard/common/analytics-pusher');
const CreateDialog = require('dashboard/views/dashboard/dialogs/create-dialog/sacar-fuera/dialog-view');
const template = require('./onboarding.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'userModel',
  'modals'
];

/**
 *  Onboarding view
 *
 *  It includes:
 *  - onboard map (rendered when element is visible)
 *  - welcome text (visible checking local storage)
 *
 */

module.exports = CoreView.extend({
  tagName: 'div',
  className: 'OnBoarding',

  events: {
    'click .js-createMap': '_createMap'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._resizeMap();
    this._initBindings();
  },

  render: function () {
    this.$el.html(
      template({
        username: this._userModel.get('name') || this._userModel.get('username'),
        hasCreateMapsFeature: this._userModel.hasCreateMapsFeature()
      })
    );

    return this;
  },

  _renderMap: function () {
    if (this.map) {
      return;
    }

    this.map = createDefaultFallbackMap({
      el: this.$('.js-onboarding-map')[0],
      basemap: this._configModel.get('default_fallback_basemap'),
      scrollwheel: false
    });
  },

  _createMap: function () {
    GAPusher({
      eventName: 'send',
      hitType: 'event',
      eventCategory: 'New Map',
      eventAction: 'click',
      eventLabel: 'Dashboard'
    });

    this._modals.create(modalModel => {
      return CreateDialog.openDialog({ modalModel }, {
        type: 'map',
        selectedItems: [],
        modalModel
      });
    });
  },

  _destroyMap: function () {
    if (this.map) {
      this.map.remove();
    }
  },

  _initBindings: function () {
    _.bindAll(this, '_resizeMap');
    $(window).on('resize', this._resizeMap);
  },

  _destroyBindings: function () {
    $(window).off('resize', this._resizeMap);
  },

  _resizeMap: function () {
    // 71px is the height of the main header
    this.$el.height(window.innerHeight - 71);
  },

  show: function () {
    this.$el.show();
    // We need to have element visible in order
    // to render leaflet map properly
    this._renderMap();
  },

  hide: function () {
    this.$el.hide();
  },

  clean: function () {
    this._destroyMap();
    this._destroyBindings();
    CoreView.prototype.clean.call(this);
  }

});
