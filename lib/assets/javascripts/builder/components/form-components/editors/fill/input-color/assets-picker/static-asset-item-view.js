var CoreView = require('backbone/core-view');
var template = require('./static-asset-item-view.tpl');

var AssetStates = {
  SELECTED: 'selected'
};

module.exports = CoreView.extend({
  tagName: 'li',
  className: 'AssetsList-item AssetsList-item--medium',

  events: {
    'click .js-asset': '_onClick'
  },

  initialize: function () {
    this.listenTo(this.model, 'change:state', this._changeState);
  },

  render: function () {
    this.clearSubViews();

    this.$el.append(template({
      type: 'icon',
      name: this.model.get('name'),
      public_url: this.model.get('public_url')
    }));
    return this;
  },

  _onClick: function (e) {
    this.killEvent(e);
    this.trigger(AssetStates.SELECTED, this.model);
    this.model.set('state', AssetStates.SELECTED);
  },

  _changeState: function () {
    this.$el.toggleClass('is-selected', this.model.get('state') === AssetStates.SELECTED);
  }
});
