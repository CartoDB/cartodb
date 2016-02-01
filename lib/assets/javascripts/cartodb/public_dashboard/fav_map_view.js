var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var createDefaultFallbackMap = require('../common/views/create_default_fallback_map');

/**
 * View to render the "favourite" map, either a user's map visualization, or a default fallback map.
 */
module.exports = cdb.core.View.extend({

  render: function() {
    this.$el.removeClass('is-pre-loading').addClass('is-loading');

    var promise;
    if (this.options.createVis) {
      promise = this._createVisMap(this.options.createVis);
    } else {
      promise = this._createFallbackMap();
    }

    var self = this;
    promise.done(function() {
      self.$el.removeClass('is-loading');
      self.$('.js-spinner').remove();
    });

    return this;
  },

  _createVisMap: function(createVis) {
    return cdb.createVis(this.el, createVis.url, _.defaults(createVis.opts, {
      title:             false,
      header:            false,
      description:       false,
      search:            false,
      layer_selector:    false,
      text:              false,
      image:             false,
      shareable:         false,
      annotation:        false,
      zoom:              false,
      cartodb_logo:      false,
      scrollwheel:       false,
      mobile_layout:     true,
      slides_controller: false,
      legends:           false,
      time_slider:       false,
      loader:            false,
      fullscreen:        false,
      no_cdn:            false
    }));
  },

  _createFallbackMap: function() {
    createDefaultFallbackMap({
      el: this.el,
      baselayer: this.options.fallbackBaselayer
    });

    // Fake promise, to keep the render method consistent with how the vis map would have been handled (async)
    return {
      done: function(fn) {
        fn();
      }
    };
  }

});
