var _ = require('underscore');
var View = require('cdb/core/view');
var template = require('./item_view.tpl');

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
    var value = this.model.get('count');
    var totalCount = this.dataModel.get('totalCount');

    this.$el.html(
      template({
        name: this.model.get('name'),
        value: Math.ceil(value),
        percentage: Math.ceil(!totalCount ? 0 : (value / this.dataModel.get('totalCount')) * 100),
        isDisabled: !this.model.get('selected') ? 'is-disabled' : ''
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  _onItemClick: function() {
    this.trigger('itemClicked', this.model, this);
  }
});
