var Model = require('../../core/model');
var Template = require('../../core/template');
var Text = require('../../geo/ui/text');

var TextOverlay = function (data, opts) {
  var options = data.options;

  var template = Template.compile(
    data.template || [
      '<div class="content">',
      '<div class="text widget_text">{{{ text }}}</div>',
      '</div>'
    ].join('\n'),
    data.templateType || 'mustache'
  );

  var overlay = new Text({
    model: new Model(options),
    template: template,
    className: 'cartodb-overlay overlay-text ' + options.device
  });

  return overlay.render();
};

module.exports = TextOverlay;
