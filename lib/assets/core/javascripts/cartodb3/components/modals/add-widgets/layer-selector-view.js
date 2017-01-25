var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var analyses = require('../../../data/analyses');
require('../../form-components/index');
var CustomListItemView = require('../../form-components/editors/select/select-layer-list-item-view');
var itemListTemplate = require('../../form-components/editors/select/select-layer-item.tpl');
var selectedItemTemplate = require('../../form-components/editors/select/select-layer-list-item.tpl');

/**
 * View for selecting the layer through which to load the column data.
 */
module.exports = CoreView.extend({

  className: 'SelectorLayer',

  events: {
    'change': '_onChange'
  },

  initialize: function (opts) {
    this.listenTo(this.model, 'change:layer_index', this.render);
  },

  render: function () {
    this._unbindEvents();
    this._initViews();
    this._bindEvents();
    return this;
  },

  _initViews: function () {
    var self = this;
    var options = this._buildOptions();

    this._selectView = new Backbone.Form.editors.Select({
      className: 'Widget-select u-flex u-alignCenter',
      key: 'name',
      schema: {
        options: options
      },
      model: self.model,
      showSearch: false,
      template: require('./select.tpl'),
      selectedItemTemplate: selectedItemTemplate,
      customListItemView: CustomListItemView,
      itemListTemplate: itemListTemplate
    });

    this._selectView.setValue(this.model.get('layer_index') || 0);
    this.$el.html(this._selectView.render().el);
  },

  _buildOptions: function () {
    return _.map(this.model.get('tuples'), function (item, index) {
      var layerDefModel = item.layerDefinitionModel;
      var nodeDefModel = item.analysisDefinitionNodeModel;

      return {
        val: index,
        layerName: layerDefModel.getName(),
        nodeTitle: analyses.title(nodeDefModel),
        layer_id: nodeDefModel.id,
        color: item.layerDefinitionModel.get('color')
      };
    });
  },

  _bindEvents: function () {
    if (this._selectView) {
      this._selectView.on('change', this._onChange, this);
    }
  },

  _unbindEvents: function () {
    if (this._selectView) {
      this._selectView.off('change', this._onChange, this);
    }
  },

  _onChange: function () {
    this.model.set('layer_index', this._selectView.getValue());
  }

});
