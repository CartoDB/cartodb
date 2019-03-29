var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var analyses = require('builder/data/analyses');
require('builder/components/form-components/index');
var CustomListItemView = require('builder/components/form-components/editors/select/select-layer-list-item-view');
var itemListTemplate = require('builder/components/form-components/editors/select/select-layer-item.tpl');
var selectedItemTemplate = require('builder/components/form-components/editors/select/select-layer-list-item.tpl');

/**
 * View for selecting the layer through which to load the column data.
 */
module.exports = CoreView.extend({

  className: 'CDB-SelectorLayer',

  events: {
    'click': '_onClick',
    'change': '_onChange'
  },

  initialize: function (opts) {
    this._stateModel = new Backbone.Model({
      highlighted: false
    });

    this._initBinds();
  },

  render: function () {
    this._unbindEvents();
    this._initViews();
    this._bindEvents();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._stateModel, 'change:highlighted', this._toggleHover);
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
      itemListTemplate: itemListTemplate,
      mouseOverAction: this._onMouseOver.bind(this),
      mouseOutAction: this._onMouseOut.bind(this)
    });

    this._selectView.setValue(this.model.get('layer_index') || 0);
    this.$el.html(this._selectView.render().el);
  },

  _onMouseOver: function () {
    this._stateModel.set('highlighted', true);
  },

  _onMouseOut: function () {
    this._stateModel.set('highlighted', false);
  },

  _toggleHover: function () {
    var $widget = this.$el.closest('.js-WidgetList-item');

    $widget.toggleClass('is-hover', this._stateModel.get('highlighted'));
  },

  _buildOptions: function () {
    return _.map(this.model.get('tuples'), function (item, index) {
      var layerDefModel = item.layerDefinitionModel;
      var nodeDefModel = item.analysisDefinitionNodeModel;
      var layerName = nodeDefModel.isSourceType()
        ? layerDefModel.getTableName()
        : layerDefModel.getName();

      return {
        val: index,
        layerName: layerName,
        nodeTitle: analyses.short_title(nodeDefModel),
        layer_id: nodeDefModel.id,
        color: layerDefModel.getColor(),
        isSourceType: nodeDefModel.isSourceType()
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

  _onClick: function (event) {
    event.stopPropagation();
  },

  _onChange: function () {
    this.model.set('layer_index', this._selectView.getValue());
  },

  clean: function () {
    this._selectView.remove();
    CoreView.prototype.clean.apply(this);
  }

});
