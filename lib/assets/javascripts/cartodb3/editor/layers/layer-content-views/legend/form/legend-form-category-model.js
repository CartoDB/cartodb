var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');
var NestedCategory = require('./legend-form-nested-category-model');

module.exports = LegendFormDefaultModel.extend({

  _onChange: function () {
    console.log(this.toJSON());
  },

  _generateSchema: function () {
    var schema = LegendFormDefaultModel.prototype._generateSchema.call(this);
    return _.extend(
      schema,
      {
        items: {
          type: 'List',
          itemType: 'CategoryModel',
          model: NestedCategory
        }
      }
    );
  }
});
