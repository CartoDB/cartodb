var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');

module.exports = LegendFormDefaultModel.extend({
  _onChange: function () {
    console.log(this.toJSON());
  },

  _generateSchema: function () {
    var schema = LegendFormDefaultModel.prototype._generateSchema.call(this);
    return _.extend(
      schema,
      {
        fill: {
          type: 'Fill',
          title: 'Fill', // TOFIX
          options: [],
          editorAttrs: {
            size: {
              min: 6,
              max: 24,
              hidePanes: ['value']
            },
            color: {
              hidePanes: ['value']
            }
          }
        }
      }
    );
  }
});
