var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');
var NestedCategory = require('./legend-form-nested-category-model');
var templateItem = require('../legend-list-item.tpl');
var templateList = require('../legend-list.tpl');

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
          type: 'SortableList',
          itemType: 'CategoryModel',
          model: NestedCategory,
          title: '',
          itemTemplate: templateItem,
          listTemplate: templateList,
          editorAttrs: {
            className: 'u-flex'
          }
        }
      }
    );
  }
});
