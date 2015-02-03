var _ = require('underscore');
var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  render: function() {
    this.$el.removeClass('is-pre-loading').addClass('is-loading');

    var self = this;
    var createVis = this.options.createVis;
    cdb.createVis(this.el, createVis.url, _.defaults(createVis.opts, {
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
      no_cdn:            false
    })).done(function() {
      self.$el.removeClass('is-loading');
    });
    
    return this;
  }
  
});
