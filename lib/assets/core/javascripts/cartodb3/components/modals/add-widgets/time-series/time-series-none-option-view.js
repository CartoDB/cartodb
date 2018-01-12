var CoreView = require('backbone/core-view');
var template = require('./time-series-none-option.tpl');

/**
 * Represents the (default) no-option view, i.e. since time-series options only can have one selection,
 * this serves as the "unselect" option.
 */
module.exports = CoreView.extend({

  events: {
    'click': '_onSelect'
  },

  initialize: function (opts) {
    this.listenTo(this.model, 'change:selected', this.render);
  },

  render: function () {
    this.$el.html(this._html());
    return this;
  },

  _html: function () {
    var isSelected = !!this.model.get('selected');

    this.$el.toggleClass('is-selected', isSelected);

    return template({
      isSelected: isSelected
    });
  },

  _onSelect: function () {
    this.model.set('selected', !this.model.get('selected'));
  }

});
