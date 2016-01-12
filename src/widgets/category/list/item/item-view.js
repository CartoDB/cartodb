var cdb = require('cartodb.js');
var formatter = require('../../../../formatter');
var clickableTemplate = require('./item-clickable-template.tpl');
var unclickableTemplate = require('./item-unclickable-template.tpl');

/**
 * Category list item view
 */
module.exports = cdb.core.View.extend({
  tagName: 'li',
  className: 'CDB-Widget-listItem',

  events: {
    'click .js-button': '_onItemClick'
  },

  initialize: function (options) {
    this.viewModel = this.options.viewModel;
    this.dataModel = this.options.dataModel;
    this._initBinds();
  },

  render: function () {
    var name = this.model.get('name');
    var value = this.model.get('value');
    var template = this.model.get('agg') || this.viewModel.isLocked()
      ? unclickableTemplate
      : clickableTemplate;

    this.$el.html(
      template({
        customColor: this.viewModel.isColorApplied(),
        isAggregated: this.model.get('agg'),
        name: name,
        value: value,
        formattedValue: formatter.formatNumber(value),
        percentage: ((value / this.dataModel.get('max')) * 100),
        color: this.viewModel.colors.getColorByCategory(name),
        isDisabled: !this.model.get('selected') ? 'is-disabled' : '',
        prefix: this.dataModel.get('prefix'),
        suffix: this.dataModel.get('suffix')
      })
    );

    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
    this.viewModel.bind('change:search change:isColorsApplied', this.render, this);
    this.add_related_model(this.viewModel);
  },

  _onItemClick: function () {
    this.trigger('itemClicked', this.model, this);
  }

});
