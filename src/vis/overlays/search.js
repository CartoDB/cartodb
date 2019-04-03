var _ = require('underscore');
var Search = require('../../geo/ui/search/search');
var Template = require('../../core/template');

var SearchOverlay = function (data, opts) {
  if (!opts.mapView) throw new Error('mapView is required');
  if (!opts.mapModel) throw new Error('mapModel is required');

  var options = _.extend(data, {
    mapView: opts.mapView,
    model: opts.mapModel
  });

  if (data.template) {
    options.template = Template.compile(data.template, data.templateType || 'mustache');
  }

  var overlay = new Search(options);
  return overlay.render();
};

module.exports = SearchOverlay;
