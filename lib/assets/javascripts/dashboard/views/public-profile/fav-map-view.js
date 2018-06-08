var carto = require('internal-carto.js');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var createDefaultFallbackMap = require('dashboard/components/create-fallback-map');

/**
 * View to render the "favourite" map, either a user's map visualization, or a default fallback map.
 */
module.exports = CoreView.extend({

  render: function () {
    this.$el.removeClass('is-pre-loading').addClass('is-loading');

    var promise;
    if (this.options.createVis) {
      promise = this._createVisMap(this.options.createVis);
    } else {
      promise = this._createFallbackMap();
    }

    var self = this;
    promise.done(function () {
      self.$el.removeClass('is-loading');
      self.$('.js-spinner').remove();
    });

    return this;
  },

  _createVisMap: function (createVis) {
    return carto.createVis(this.el, createVis.url || createVis.vizJson, _.defaults(createVis.opts, {
      authToken: 'default_public',
      title: false,
      header: false,
      description: false,
      searchControl: false,
      layer_selector: false,
      text: false,
      image: false,
      zoomControl: false,
      logo: false,
      scrollwheel: false,
      mobile_layout: true,
      legends: false,
      loader: false,
      fullscreen: false,
      no_cdn: false
    }));
  },

  _createFallbackMap: function () {
    createDefaultFallbackMap({
      el: this.el,
      basemap: this.options.fallbackBaselayer
    });

    // Fake promise, to keep the render method consistent with how the vis map would have been handled (async)
    return {
      done: function (fn) {
        fn();
      }
    };
  }

});
