var CoreView = require('backbone/core-view');
var template = require('./assets-view.tpl');

var AssetsListView = require('./assets-list-view');
var AssetsCollection = require('../../../../../data/assets-collection');
var renderLoading = require('../../../../../components/loading/render-loading');

 var MakiIcons = require('./maki-icons');
 var PinIcons = require('./pin-icons');
 var SimpleIcons = require('./simple-icons');
 var Patterns = require('./pattern-icons');

// var AddFileView = require('../components/modals/add-file/add-file-view');
// var AddAnalysisView = require('../../../../../components/modals/add-file/add-file-view');

module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._modalModel = opts.modalModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;

    this._assets = new AssetsCollection(null, {
      configModel: this._configModel,
      userModel: this._userModel
    });

    this._assetsFetched = true;

    var self = this;

    if (!this._isFetchingAssets()) {
      this._assets.fetch({
        error: function () {
          console.log('error');
          self._assetsFetched = false;
        },
        success: function () {
          self._assetsFetched = true;
          self.render();
        }
      });
    }
  },

  render: function () {
    this.clearSubViews();

    if (this._isFetchingAssets()) {
      this._renderLoadingView();
    } else {
      this._renderAssets();
    }

    return this;
  },

  _renderAssets: function () {
    this._makiIconsListView = new AssetsListView({
      icons: MakiIcons,
      folder: 'maki-icons',
      size: 18
    });

    this.$el.html(template());
    this.$('.js-simpleIcons').append(this._makiIconsListView.render().$el);
  },

  __setupAssets: function() {
    var opts = {};

    if (this.options.folder !== undefined)  opts.folder = this.options.folder;
    if (this.options.size   !== undefined)  opts.size   = this.options.size;
    if (this.options.host   !== undefined)  opts.host   = this.options.host;
    if (this.options.ext    !== undefined)  opts.ext    = this.options.ext;

    this.options.kind = this.kind;
    this.options.icons = makiIcons.icons;
    this.options.disclaimer = makiIcons.disclaimer;
    this.options.folder = 'maki-icons';
    this.options.size = '18';

    if (!_.isEmpty(opts)) {
      this.options.icons = _.map(this.options.icons, function(a) {
        return _.extend(a, opts);
      });
    }

    this.collection = new cdb.admin.StaticAssets(this.options.icons);
  },

  __renderAssets: function() {
    var self = this;
    var items = this.collection.where({ kind: this.options.kind });

    _(items).each(function(mdl) {
      var item = new StaticAssetItemView({
        className: 'AssetItem ' + (self.options.folder || ''),
        template: 'common/dialogs/map/image_picker/static_assets_item',
        model: mdl
      });
      //item.bind('selected', self._selectItem, self);

      //self.$('ul').append(item.render().el);
      //self.addView(item);
    });
  },

  _$body: function () {
    return this.$('.js-body');
  },

  _isFetchingAssets: function () {
    return !this._assetsFetched;
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: _t('components.modals.add-widgets.loading-title')
      })
    );
  }
});
