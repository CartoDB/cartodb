var cdb = require('cartodb-deep-insights.js');

/**
 *  TabPaneItem component
 */

module.exports = cdb.core.View.extend({
  tagName: 'button',

  events: {
    'click': '_onButtonClicked'
  },

  initialize: function () {
    if (!this.model) {
      throw new Error('A model should be provided');
    }

    this.model.bind('change:selected', this._onChangeSelected, this);
  },

  render: function () {
    var view = this.model.get('createButtonView').call(this.model);
    this.addView(view);
    this.$el.append(view.render().$el);

    return this;
  },

  _onChangeSelected: function () {
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
  },

  _onButtonClicked: function () {
    this.model.set('selected', true);
  }
});
