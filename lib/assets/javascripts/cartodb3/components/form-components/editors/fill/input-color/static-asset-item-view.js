var CoreView = require('backbone/core-view');
var template = require('./static-asset-item-view.tpl');

module.exports = CoreView.extend({
  tagName: 'li',
  className: 'AssetItem',

  events: {
    'click .js-asset': '_onClick'
  },

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    this.model.bind('change:state', this._changeState, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.append(template({
      name: this.model.get('name'),
      public_url: this.model.get('public_url')
    }));
    return this;
  },

  _onClick: function (e) {
    this.killEvent(e);
    this.trigger('selected', this.model);
    this.model.set('state', 'selected');
  },

  _changeState: function () {
    this.$el.toggleClass('is-selected', this.model.get('state') === 'selected');
  }
});
