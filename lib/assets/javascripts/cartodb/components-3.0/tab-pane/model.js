var TabPaneItem = require('./item/view.js');

module.exports = cdb.core.Model.extend({
  defaults: {
    icon: false,
    itemView: new TabPaneItem(),
    content: false,
    selected: false
  },

  initialize: function() {
    this.get('itemView').bind('buttonClicked', this._onButtonClicked, this);
  },

  _onButtonClicked: function() {
    this.set('selected', true);
  }
});
