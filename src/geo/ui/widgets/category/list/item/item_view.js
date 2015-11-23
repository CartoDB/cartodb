var _ = require('underscore');
var View = require('cdb/core/view');
var clickableTemplate = require('./item_clickable_template.tpl');
var unclickableTemplate = require('./item_unclickable_template.tpl');
var d3 = require('d3');

/**
 * Category list item view
 */
module.exports = View.extend({

  tagName: 'li',
  className: 'Widget-listItem',

  events: {
    'click .js-button': '_onItemClick'
  },

  initialize: function(options) {
    this.dataModel = this.options.dataModel;
    this._initBinds();
  },

  render: function() {
    var value = this.model.get('value');
    var template = this.model.get('agg') || this.dataModel.isLocked() ?
      unclickableTemplate : clickableTemplate;
    var format = d3.format('0,000');

    this.$el.html(
      template({
        customColor: this.dataModel.isColorApplied(),
        isAggregated: this.model.get('agg'),
        name: this.model.get('name'),
        value: format(Math.ceil(value)),
        percentage: ((value / this.dataModel.get('max')) * 100),
        color: this.model.get('color'),
        isDisabled: !this.model.get('selected') ? 'is-disabled' : ''
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.dataModel.bind('change:search change:categoryColors', this.render, this);
    this.add_related_model(this.dataModel);
  },

  _onItemClick: function() {
    this.trigger('itemClicked', this.model, this);
  }

});
