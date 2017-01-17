var cdb = require('cartodb.js-v3');
var ImagePickerDialog = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker_view');
var ImagePickerNavigationView = require('./navigation_view');
// var AssetsView = require('./assets_view');

// var UploadView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/file_upload_view');
// var DropboxView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/dropbox_view');
// var BoxView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/box_view');
// var patterns = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/data/patterns');
// var ViewFactory = require('../../../../../javascripts/cartodb/common/view_factory');
// var randomQuote = require('../../../../../javascripts/cartodb/common/view_helpers/random_quote');
var UserIconsView = require('./user_icons_view');

module.exports = ImagePickerDialog.extend({

  className: "Dialog Modal ImagePicker",

  events: ImagePickerDialog.extendEvents({
    'click .js-addIcon': '_onAddIconClicked'
  }),

  initialize: function() {
    this.elder('initialize');

    this.kind = this.options.kind;
    this.model = new cdb.core.Model({
      disclaimer: "",
      dropbox_enabled: cdb.config.get('dropbox_api_key') ? true : false,
      box_enabled: cdb.config.get('box_api_key') ? true : false,
      submit_enabled: false
    });

    this._template = cdb.templates.getTemplate('organization/icon_picker/icon_picker_dialog/icon_picker_dialog_template');
    this._initBinds();
    this._onChangePane();
  },

  _initViews: function() {
    this._renderContentPane();
    this._renderNavigation();
    this._renderTabPane();

    this._renderLoader();
    this._renderUploadLoader();

    this._renderUserIconsPane();

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
      el: this.el,
      kind: this.kind,
      collection: this.collection,
      user: this.options.user,
      model: this.model
    });

    navigationView.render();

    this.addView(navigationView);
  },

  _renderUserIconsPane: function() {
    var pane = new UserIconsView({
      user: this.options.user
    });

    this._renderPane('your_icons', pane);
  },

  _onAddIconClicked: function (evt) {
    this.killEvent(evt);

    this._hideErrorMessage();
    var $addIcon = this.$('.js-addIcon > .js-asset');
    if (!$addIcon.hasClass('Spinner')) {
      this.$('#iconfile').trigger('click');
    }
  },

  _hideErrorMessage: function () {
    $('.js-errorMessage').hide();
  }

});
