var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');
var NestedCategory = require('./legend-nested-category-definition-model');
var templateItem = require('../../editor/layers/layer-content-views/legend/legend-list-item.tpl');
var templateList = require('../../editor/layers/layer-content-views/legend/legend-list.tpl');
var LegendColorHelper = require('./legend-color-helper');

module.exports = LegendBaseDefModel.extend({
  defaults: {
    type: 'category',
    items: []
  },

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-size');
    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);

    this._inheritItems();
  },

  _inheritItems: function () {
    var color = this.layerDefinitionModel.styleModel.get('fill').color;
    var items = LegendColorHelper.getCategories(color);
    this.set({items: items});
  },

  _generateSchema: function () {
    var schema = LegendBaseDefModel.prototype._generateSchema.call(this);
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
