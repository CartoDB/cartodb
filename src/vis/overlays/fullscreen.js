var _ = require('underscore');
var FullScreen = require('../../ui/common/fullscreen/fullscreen-view');
var Template = require('../../core/template');

var FullscreenOverlay = function (data, opts) {
  if (!opts.mapView) throw new Error('mapView is required');
  if (!opts.visView) throw new Error('visView is required');

  var options = _.extend(data, {
    doc: opts.visView.$el.find('> div').get(0),
    allowWheelOnFullscreen: false,
    mapView: opts.mapView
  });

  if (data.template) {
    options.template = Template.compile(
      data.template,
      data.templateType || 'mustache'
    );
  }

  var view = new FullScreen(options);

  return view.render();
};

module.exports = FullscreenOverlay;
