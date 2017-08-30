var Annotation = require('../../geo/ui/annotation');
var Template = require('../../core/template');

var AnnotationOverlay = function (data, opts) {
  if (!opts.mapView) throw new Error('mapView is required');

  var options = data.options;

  var template = Template.compile(
    data.template || [
      '<div class="content">',
      '<div class="text widget_text">{{{ text }}}</div>',
      '<div class="stick"><div class="ball"></div></div>',
      '</div>'
    ].join('\n'),
    data.templateType || 'mustache'
  );

  var overlay = new Annotation({
    className: 'cartodb-overlay overlay-annotation ' + options.device,
    template: template,
    mapView: opts.mapView,
    device: options.device,
    text: options.extra.rendered_text,
    minZoom: options.style['min-zoom'],
    maxZoom: options.style['max-zoom'],
    latlng: options.extra.latlng,
    style: options.style
  });

  return overlay.render();
};

module.exports = AnnotationOverlay;
