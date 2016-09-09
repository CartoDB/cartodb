var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');

module.exports = LegendFormDefaultModel.extend({
  defaults: {
    type: 'bubble'
  },

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-color');
    LegendFormDefaultModel.prototype.initialize.call(this, attrs, opts);

    this._inheritColor();
  },

  _inheritColor: function () {
    // we only pick color, it could have size too
    var fill = this._layerDefinitionModel.styleModel.get('fill').color;
    this.set({fill: {color: fill}});
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
