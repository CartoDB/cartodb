var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');
var NestedCategory = require('./legend-form-nested-category-model');
var templateItem = require('../legend-list-item.tpl');
var templateList = require('../legend-list.tpl');
var LegendColorHelper = require('./legend-color-helper');

module.exports = LegendFormDefaultModel.extend({
  defaults: {
    type: 'category'
  },

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-size');
    LegendFormDefaultModel.prototype.initialize.call(this, attrs, opts);

    this._inheritItems();
  },

  _inheritItems: function () {
    var color = this._layerDefinitionModel.styleModel.get('fill').color;
    var items = LegendColorHelper.getCategories(color);
    this.set({items: items});
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
