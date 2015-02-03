var $ = require('jquery');
var _ = require('underscore');


var isLoading = function(id, method) {
  $('#'+ id)[ method ]('is-loading');
};

module.exports = function(cdb, opts) {
  var targetId = opts.targetId;
  isLoading(targetId, 'addClass');
  
  cdb.createVis(targetId, opts.url, _.defaults(opts, {
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
    isLoading(targetId, 'removeClass');
  }); 
};
