var $ = require('jquery');
var _ = require('underscore');
var View = require('cdb/core/view');
var template = require('./search_item_clickable_template.tpl');

/**
 * Category search list view
 */
module.exports = View.extend({

  tagName: 'li',
  className: 'Widget-listItem',

  events: {
    'click .js-button': '_onItemClick'
  },

  initialize: function(options) {
    // This data model comes from the original data in order to get
    // the max value and set properly the progress bar.
    this.dataModel = this.options.dataModel;
    this._initBinds();
  },

  render: function() {
    var value = this.model.get('value');

    this.$el.html(
      template({
        name: this.model.get('name'),
        value: Math.ceil(value),
        percentage: ((value / this.dataModel.get('max')) * 100),
        isDisabled: !this.model.get('selected')
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
