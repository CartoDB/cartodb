var _ = require('underscore');
var CoreView = require('backbone/core-view');
var StaticAssetItemView = require('./static-asset-item-view');
var StaticAssetsCollection = require('../../../../../../data/static-assets-collection');
var template = require('./assets-list-view.tpl');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.icons) throw new Error('icons is required');

    this.model = opts.model;
    this._icons = opts.icons;
    this._setupAssets();
  },

  render: function () {
    this.clearSubViews();
    this.$el.append(template({
      title: this.options.title
    }));

    this._renderItems();
    return this;
  },

  _renderItems: function () {
    this._items.each(function (mdl) {
      var item = new StaticAssetItemView({
        model: mdl
      });

      if (item.model.getURLFor(mdl.get('icon')) === this.model.get('image')) {
        item.model.set('state', 'selected');
      }

      item.bind('selected', this._selectItem, this);

      this.$('.js-items').append(item.render().el);
      this.addView(item);
    }, this);
  },

  _setupAssets: function () {
    var opts = {};

    if (this.options.folder !== undefined) opts.folder = this.options.folder;
    if (this.options.size !== undefined) opts.size = this.options.size;
    if (this.options.host !== undefined) opts.host = this.options.host;
    if (this.options.ext !== undefined) opts.ext = this.options.ext;

    if (!_.isEmpty(opts)) {
      this.options.icons = _.map(this.options.icons, function (a) {
        return _.extend(a, opts);
      });
    }

    var icons = this.options.icons;

    if (this.options.limit) {
      icons = icons.slice(0, this.options.limit);
    }

    this._items = new StaticAssetsCollection(icons);
  },

  _selectItem: function (m) {
    this.model.set('image', m.get('public_url'));
    this.unselectItems(m);
  },

  unselectItems: function (m) {
    this._items.each(function (mdl) {
      if (mdl !== m && mdl.get('state') === 'selected') {
        mdl.set('state', 'idle');
      }
    });
  }
});
