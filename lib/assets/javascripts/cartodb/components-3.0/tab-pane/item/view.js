var $ = require('jquery');
var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 *  TabPaneItem component
 */

module.exports = cdb.core.View.extend({

  tagName: 'button',

  className: 'TabPaneItem',

  events: {
    'click': '_onButtonClicked'
  },

  initialize: function(options) {
    if (!this.model) {
      throw new Error('A TabPaneModel should be provided');
    }

    this.model.bind('change:selected', this._onChangeSelected, this);
  },

  render: function() {
    var view = this.model.get('createButtonView')();
    this.addView(view);
    this.$el.append(view.render().$el);

    return this;
  },

  _onChangeSelected: function() {
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
  },

  _onButtonClicked: function() {
    this.model('selected', true);
  }
});
