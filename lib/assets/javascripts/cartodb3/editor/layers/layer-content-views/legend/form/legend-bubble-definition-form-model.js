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

    // title
    this.set(_.extend(
      {},
      _.pick(opts.legendDefinitionModel.attributes, 'title')
    ), {silent: true});

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
