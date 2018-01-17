var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var ImagePickerNavigationView = require('./image_picker/navigation_view');
var FooterView = require('./image_picker/footer_view');
var AssetsView = require('./image_picker/assets_view');
var UserIconsView = require('./image_picker/user_icons_view');
var UploadView = require('./image_picker/file_upload_view');
var DropboxView = require('./image_picker/dropbox_view');
var BoxView = require('./image_picker/box_view');
var makiIcons = require('./image_picker/data/maki_icons');
var patterns = require('./image_picker/data/patterns');
var pinMaps = require('./image_picker/data/pin_maps');
var simpleicon = require('./image_picker/data/simpleicon');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

module.exports = BaseDialog.extend({

  className: 'Dialog ImagePicker',

  initialize: function () {
    this.elder('initialize');

    this._validate();

    this.kind = this.options.kind;
    this.model = new cdb.core.Model({
      disclaimer: '',
      dropbox_enabled: !!cdb.config.get('dropbox_api_key'),
      box_enabled: !!cdb.config.get('box_api_key'),
      submit_enabled: false
    });

    this.collection = new cdb.admin.Assets([], {
      user: this.options.user
    });

    this._template = cdb.templates.getTemplate('common/dialogs/map/image_picker_template');
    this._initBinds();
    this._onChangePane();
  },

  render: function () {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    this._initAssets();
    return this;
  },

  _initAssets: function () {
    this.collection.bind('add remove reset', this._onAssetsFetched, this);
    this.collection.fetch();
  },

  _showLoader: function () {
    var loader = this._contentPane.getPane('loader');
    if (loader) {
      loader.show();
    }
  },

  _hideLoader: function () {
    var loader = this._contentPane.getPane('loader');
    if (loader) {
      loader.hide();
    }
  },

  _showUploadLoader: function () {
    var loader = this._contentPane.getPane('upload_loader');

    if (loader) {
      loader.show();
    }
  },

  _hideUploadLoader: function () {
    var loader = this._contentPane.getPane('upload_loader');
    if (loader) {
      loader.hide();
    }
  },

  _onAssetsFetched: function () {
    this._hideLoader();

    var items = this.collection.where({ kind: this.kind });

    if (items.length === 0) {
      if (this.kind === 'marker') {
        this.model.set('pane', 'simple_icons');
      } else {
        this.model.set('pane', 'patterns');
      }
    } else {
      this.model.set('pane', 'your_icons');
    }
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render_content: function () {
    return this._template({ kind: this.kind });
  },

  _initViews: function () {
    this._renderContentPane();
    this._renderNavigation();
    this._renderTabPane();

    this._renderLoader();
    this._renderUploadLoader();

    if (this.kind === 'marker') {
      this._renderSimpleiconPane();
      this._renderPinIconsPane();
      this._renderMakisPane();
    } else if (this.kind === 'pattern') {
      this._renderPatternPane();
    }

    this._renderUserIconsPane();
    this._renderFilePane();
    this._renderDropboxPane();
    this._renderBoxPane();

    this._renderFooter();
    this._contentPane.active('loader');
  },

  _renderFooter: function () {
    this._footerView = new FooterView({
      model: this.model
    });

    this._footerView.bind('finish', this._ok, this);
    this.$('.js-footer').append(this._footerView.render().el);

    this.addView(this._footerView);
  },

  _renderTabPane: function () {
    this.tabPane = new cdb.ui.common.TabPane({
      el: this.$('.AssetsContent')
    });

    this.addView(this.tabPane);
  },

  _renderContentPane: function () {
    this._contentPane = new cdb.ui.common.TabPane({
      el: this.$('.js-content-container')
    });

    this.addView(this._contentPane);
    this._contentPane.active(this.model.get('contentPane'));
  },

  _renderNavigation: function () {
    var navigationView = new ImagePickerNavigationView({
      el: this.$('.js-navigation'),
      kind: this.kind,
      collection: this.collection,
      user: this.options.user,
      model: this.model
    });

    navigationView.render();

    this.addView(navigationView);
  },

  _renderPane: function (name, pane) {
    pane.bind('fileChosen', this._onFileChosen, this);
    pane.render();
    this._addPane(name, pane);
  },

  _renderUploadLoader: function () {
    this._addTab('upload_loader',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Uploading asset…',
        quote: randomQuote()
      })
    );
  },

  _renderLoader: function () {
    this._addTab('loader',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Loading assets…',
        quote: randomQuote()
      })
    );
  },

  _renderPatternPane: function () {
    var pane = new AssetsView({
      model: this.model,
      collection: this.collection,
      kind: this.kind,
      icons: patterns.icons,
      folder: 'patterns',
      size: ''
    });

    this._renderPane('patterns', pane);
  },

  _renderSimpleiconPane: function () {
    var pane = new AssetsView({
      model: this.model,
      collection: this.collection,
      kind: this.kind,
      icons: simpleicon.icons,
      disclaimer: simpleicon.disclaimer,
      folder: 'simpleicon',
      size: ''
    });
    this._renderPane('simple_icons', pane);
  },

  _renderMakisPane: function () {
    var pane = new AssetsView({
      model: this.model,
      collection: this.collection,
      kind: this.kind,
      icons: makiIcons.icons,
      disclaimer: makiIcons.disclaimer,
      folder: 'maki-icons',
      size: '18'
    });

    this._renderPane('maki_icons', pane);
  },

  _renderUserIconsPane: function () {
    var pane = new UserIconsView({
      model: this.model,
      collection: this.collection,
      kind: this.kind,
      folder: 'your-icons'
    });

    this._renderPane('your_icons', pane);
  },

  _renderPinIconsPane: function () {
    var pane = new AssetsView({
      model: this.model,
      collection: this.collection,
      kind: this.kind,
      icons: pinMaps.icons,
      disclaimer: pinMaps.disclaimer,
      folder: 'pin-maps',
      size: ''
    });

    this._renderPane('pin_icons', pane);
  },

  _renderFilePane: function () {
    var pane = new UploadView({
      collection: this.collection,
      kind: this.kind,
      user: this.options.user
    });

    pane.bind('valueChange', this._onFileChosen, this);
    pane.bind('show_loader', this._showUploadLoader, this);
    pane.bind('hide_loader', this._hideUploadLoader, this);
    this._renderPane('upload_file', pane);
  },

  _renderDropboxPane: function () {
    if (this.model.get('dropbox_enabled')) {
      var pane = new DropboxView({
        model: this.model,
        collection: this.collection,
        kind: this.kind,
        user: this.options.user
      });

      pane.bind('valueChange', this._onFileChosen, this);
      pane.bind('show_loader', this._showUploadLoader, this);
      pane.bind('hide_loader', this._hideUploadLoader, this);
      this._renderPane('dropbox', pane);
    }
  },

  _renderBoxPane: function () {
    if (this.model.get('box_enabled')) {
      var pane = new BoxView({
        model: this.model,
        collection: this.collection,
        kind: this.kind,
        user: this.options.user
      });

      pane.bind('valueChange', this._onFileChosen, this);
      pane.bind('show_loader', this._showUploadLoader, this);
      pane.bind('hide_loader', this._hideUploadLoader, this);
      this._renderPane('box', pane);
    }
  },

  _addPane: function (name, view) {
    this.tabPane.addTab(name, view, {
      active: this.model.get('pane') === name
    });
  },

  _addTab: function (name, view) {
    this._contentPane.addTab(name, view.render());
    this.addView(view);
  },

  _validate: function () {
    if (!this.options.user) {
      throw new TypeError('user is required');
    }

    if (!this.options.kind) {
      throw new Error('kind should be passed');
    }
  },

  _initBinds: function () {
    // Bug with binding... do not work with the usual one for some reason :(
    this.model.bind('change:pane', this._onChangePane.bind(this));
  },

  _onChangePane: function () {
    if (this.tabPane) {
      this.tabPane.active(this.model.get('pane'));

      this.model.set('submit_enabled', false);
      var activePane = this.tabPane.getActivePane();

      if (activePane) {
        this.model.set('disclaimer', activePane.options.disclaimer);
      }
    }
  },

  _ok: function () {
    this.trigger('fileChosen', this.model.get('value'));
    this.close();
  },

  _onFileChosen: function () {
    this.model.set('submit_enabled', true);
  }
});
