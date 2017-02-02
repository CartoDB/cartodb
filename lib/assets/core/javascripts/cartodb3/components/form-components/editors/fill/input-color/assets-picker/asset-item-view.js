var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../../../../helpers/required-opts');

var template = require('./asset-item-view.tpl');

var ASSET_HEIGHT = 24;

var REQUIRED_OPTS = [
  'assets',
  'selectedAsset'
];

module.exports = CoreView.extend({
  tagName: 'li',
  className: 'AssetsList-item AssetsList-item--medium',

  events: {
    'click .js-asset': '_onClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._initBinds();
  },

  _initBinds: function () {
    this.model.bind('change:state', this._changeState, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.attr('id', this.model.get('id'));

    var type = this.model.get('type') || 'icon';

    this.$el.append(template({
      type: type,
      height: this.options.assetHeight || ASSET_HEIGHT,
      name: this.model.get('name'),
      public_url: this.model.get('public_url')
    }));

    this.$el.addClass('AssetsList-item--' + type);

    return this;
  },

  _onClick: function (e) {
    this.killEvent(e);
    this.trigger('selected', this.model);
  },

  _changeState: function () {
    this.$el.toggleClass('is-selected', this.model.get('state') === 'selected');
  }
});
