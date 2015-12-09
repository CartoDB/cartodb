var $ = cdb.$;
var _ = cdb._;
var View = cdb.core.View;
var formatter = cdb.core.format;
var template = require('./search_item_clickable_template.tpl');

/**
 * Category search list view
 */
module.exports = View.extend({

  tagName: 'li',
  className: 'CDB-Widget-listItem',

  events: {
    'click .js-button': '_onItemClick'
  },

  initialize: function(options) {
    // This data model comes from the original data in order to get
    // the max value and set properly the progress bar and add the
    // necessary suffix and prefix for the item.
    this.dataModel = this.options.dataModel;
    this._initBinds();
  },

  render: function() {
    var value = this.model.get('value');

    this.$el.html(
      template({
        name: this.model.get('name'),
        value: value,
        formattedValue: formatter.formatNumber(value),
        percentage: ((value / this.dataModel.get('max')) * 100),
        isDisabled: !this.model.get('selected'),
        prefix: this.dataModel.get('prefix'),
        suffix: this.dataModel.get('suffix')
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:selected', this.render, this);
  },

  _onItemClick: function() {
    this.model.set('selected', !this.model.get('selected'));
  }

});
