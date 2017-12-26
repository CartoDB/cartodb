var CoreView = require('backbone/core-view');
var formatter = require('../../../../formatter');
var template = require('./search-item-clickable-template.tpl');

/**
 * Category search list view
 */
module.exports = CoreView.extend({
  tagName: 'li',
  className: 'CDB-Widget-listItem',

  events: {
    'click .js-button': '_onItemClick'
  },

  initialize: function (options) {
    // This data model comes from the original data in order to get
    // the max value and set properly the progress bar and add the
    // necessary suffix and prefix for the item.
    this.dataviewModel = this.options.dataviewModel;
    this.widgetModel = this.options.widgetModel;
    this._initBinds();
  },

  render: function () {
    var value = this.model.get('value');

    this.$el.html(
      template({
        name: this.model.get('name'),
        value: value,
        formattedValue: formatter.formatNumber(value),
        percentage: ((value / this.dataviewModel.get('max')) * 100),
        isDisabled: !this.model.get('selected'),
        prefix: this.widgetModel.get('prefix'),
        suffix: this.widgetModel.get('suffix')
      })
    );

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:selected', this.render, this);

    this.widgetModel.bind('change:prefix change:suffix', this.render, this);
    this.add_related_model(this.widgetModel);
  },

  _onItemClick: function () {
    this.model.set('selected', !this.model.get('selected'));
  }

});
