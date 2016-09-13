var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');
var LegendColorHelper = require('./legend-color-helper');

module.exports = LegendFormDefaultModel.extend({
  defaults: {
    type: 'bubble',
    items: []
  },

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-color');
    LegendFormDefaultModel.prototype.initialize.call(this, attrs, opts);

    this._inheritColor();
  },

  _inheritColor: function () {
    var color = this._layerDefinitionModel.styleModel.get('fill').color;
    var fill = LegendColorHelper.getBubbles(color);
    this.set({fill: fill});
  },

  _generateSchema: function () {
    var schema = LegendFormDefaultModel.prototype._generateSchema.call(this);
    return _.extend(
      schema,
      {
        fill: {
          type: 'Fill',
          title: _t('editor.legend.legend-form.fill'),
          options: [],
          editorAttrs: {
            color: {
              hidePanes: ['value']
            }
          }
        }
      }
    );
  }
});
