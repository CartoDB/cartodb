var _ = require('underscore');
var View = require('cdb/core/view');
var clickedTemplate = require('./item_clickable_view.tpl');
var unclickableTemplate = require('./item_unclickable_view.tpl');

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
    this.filter = this.options.filter;
    this.dataModel = this.options.dataModel;
    this._initBinds();
  },

  render: function() {
    var value = this.model.get('value');
    var template = this.model.get('agg') ? unclickableTemplate : clickedTemplate;

    this.$el.html(
      template({
        hasSearch: this.dataModel.get('search'),
        name: this.model.get('name'),
        value: Math.ceil(value),
        percentage: ((value / this.dataModel.get('max')) * 100),
        isDisabled: !this.model.get('selected') ? 'is-disabled' : ''
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.dataModel.bind('change:search', this.render, this);
  },

  _onItemClick: function() {
    this.trigger('itemClicked', this.model, this);
  }
});
