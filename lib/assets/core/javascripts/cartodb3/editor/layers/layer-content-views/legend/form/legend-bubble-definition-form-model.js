var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-form-model');
var LegendColorHelper = require('./legend-color-helper');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'bubble',
      fillColor: null
    }
  ),

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-size');
    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);

    this.on('change:fill', function () {
      this.set('fillColor', this.get('fill').color.fixed);
    }, this);

    this._initialColor();
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'fill')
    );
  },

  _initialColor: function () {
    var color = this.legendDefinitionModel.get('fillColor');
    var fill = LegendColorHelper.getBubbles(color);
    this.set({fill: fill});
  },

  _generateSchema: function () {
    var schema = LegendBaseDefModel.prototype._generateSchema.call(this);
    return _.extend(
      schema,
      {
        fill: {
          type: 'Fill',
          title: _t('editor.legend.legend-form.fill'),
          options: [],
          dialogMode: 'float',
          editorAttrs: {
            color: {
              hidePanes: ['value']
            }
          }
        },
        topLabel: {
          type: 'EnablerEditor',
          title: '',
          label: _t('editor.legend.legend-form.top-label'),
          editor: {
            type: 'Text',
            editorAttrs: {
              placeholder: _t('editor.legend.legend-form.custom-label-placeholder')
            }
          }
        },
        bottomLabel: {
          type: 'EnablerEditor',
          title: '',
          label: _t('editor.legend.legend-form.bottom-label'),
          editor: {
            type: 'Text',
            editorAttrs: {
              placeholder: _t('editor.legend.legend-form.custom-label-placeholder')
            }
          }
        }
      }
    );
  }
});
