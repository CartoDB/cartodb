var cdb = require('cartodb.js-v3');
var ImagePickerDialog = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker_view');
var ImagePickerNavigationView = require('./navigation_view');
var AssetsView = require('./assets_view');

var FooterView = require('./footer_view');
// var UploadView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/file_upload_view');
// var DropboxView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/dropbox_view');
// var BoxView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/box_view');
var makiIcons = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/data/maki_icons');
// var patterns = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/data/patterns');
var pinMaps = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/data/pin_maps');
var simpleicon = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/data/simpleicon');
// var ViewFactory = require('../../../../../javascripts/cartodb/common/view_factory');
// var randomQuote = require('../../../../../javascripts/cartodb/common/view_helpers/random_quote');
var UserIconsView = require('./user_icons_view');

module.exports = ImagePickerDialog.extend({

  className: "Dialog Modal ImagePicker",

  initialize: function() {
    this.elder('initialize');

    this.kind = this.options.kind;
    this.model = new cdb.core.Model({
      disclaimer: "",
      dropbox_enabled: cdb.config.get('dropbox_api_key') ? true : false,
      box_enabled: cdb.config.get('box_api_key') ? true : false,
      submit_enabled: false
    });

    this.collection = this.options.collection;

    this._template = cdb.templates.getTemplate('organization/icons/image_picker/image_picker_template');
    this._initBinds();
    this._onChangePane();
  },

  _validate: function() {
    if (!this.options.user) {
      throw new TypeError('user is required');
    }

    if (!this.options.kind) {
      throw new Error('kind should be passed');
    }

    if (!this.options.collection) throw new Error('collection is required');
  },

  _initViews: function() {
    this._renderContentPane();
    this._renderNavigation();
    this._renderTabPane();

    this._renderLoader();
    this._renderUploadLoader();

    this._renderSimpleiconPane();
    this._renderPinIconsPane();
    this._renderMakisPane();

    this._renderUserIconsPane();

    this._renderFooter();
    this._contentPane.active('loader');
  },

  _renderContentPane: function() {
    this._contentPane = new cdb.ui.common.TabPane({
      el: this.el
    });

    this.addView(this._contentPane);
    this._contentPane.active(this.model.get('contentPane'));
  },

  _renderNavigation: function() {
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

  _renderSimpleiconPane: function() {
    var pane = new AssetsView({
      model:      this.model,
      collection: this.collection,
      kind:       this.kind,
      icons:      simpleicon.icons,
      disclaimer: simpleicon.disclaimer,
      folder:     'simpleicon',
      size:       ''
    });
    this._renderPane('simple_icons', pane);
  },

  _renderMakisPane: function() {
    var pane = new AssetsView({
      model:      this.model,
      collection: this.collection,
      kind:       this.kind,
      icons:      makiIcons.icons,
      disclaimer: makiIcons.disclaimer,
      folder:     'maki-icons',
      size:       '18'
    });

    this._renderPane('maki_icons', pane);
  },

  _renderUserIconsPane: function() {
    var pane = new UserIconsView({
      model: this.model,
      collection: this.collection,
      kind: this.kind,
      folder: 'your-icons'
    });

    this._renderPane('your_icons', pane);
  },

  _renderPinIconsPane: function() {
    var pane = new AssetsView({
      model:      this.model,
      collection: this.collection,
      kind:       this.kind,
      icons:      pinMaps.icons,
      disclaimer: pinMaps.disclaimer,
      folder:     'pin-maps',
      size:       ''
    });

    this._renderPane('pin_icons', pane);
  },

  _renderFooter: function() {
    this._footerView = new FooterView({
      model: this.model
    });

    this.$('.js-footer').append(this._footerView.render().el);

    this.addView(this._footerView);
  }

});
