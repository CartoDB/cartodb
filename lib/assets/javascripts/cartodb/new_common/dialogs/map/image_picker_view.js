var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var ImagePickerNavigationView = require('./image_picker/navigation_view');
var FooterView = require('./image_picker/footer_view');
var SimpleIconsView = require('./image_picker/simple_icons_view');
var UserIconsView = require('./image_picker/user_icons_view');
var UploadView = require('./image_picker/file_upload_view');
var DropboxView = require('./image_picker/dropbox_view');

/**
 * Add layer dialog, typically used from editor
 */
module.exports = BaseDialog.extend({

  _TEXTS: {
    ok:           {
      simple_icons: _t('Set image'),
      pin_icons:    _t('Set image'),
      maki_icons:   _t('Set image'),
      upload_file:  _t('Upload image'),
      dropbox:      _t('Upload image')
    },
    upload: {
      error:      _t('There was a problem with the upload, please try it again.'),
      url_error:  _t('The url provided was not valid, please try another one.')
    }
  },

  initialize: function() {
    this.elder('initialize');

    this._validate();

    this.kind = this.options.kind;

    this.collection = new cdb.admin.Assets([], {
      user: this.options.user
    });

    this._template = cdb.templates.getTemplate('new_common/dialogs/map/image_picker_template');
    this._initBinds();
    this._onChangeListing();
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initAssets();
    this._initViews();
    this.model.set("listing", "simple_icons");
    return this;
  },

  _initAssets: function() {
    this.collection.bind('add remove reset',  this._onAssetsFetched,  this);
    //this.collection.bind('change',            this._checkOKButton,    this);
    this.collection.fetch();
  },

  _onAssetsFetched: function() {
    // Enable or disable uploaded images pane
    var items = this.collection.where({ kind: this.kind }).length;
    if (items === 0) {
      this.model.set("listing", "simple_icons");
    } else {
      this.model.set("listing", "your_icons");
    }

     //Hide loader
    //this.$('.dialog-content > div.assets').remove();
     //Show content
    //this.$('div.uploader, a.ok').show();
  },



  // implements cdb.ui.common.Dialog.prototype.render
  render_content: function() {
    return this._template({ kind: this.kind });
  },

  _initViews: function() {
    this._renderContentPane();
    this._renderNavigation();
    this._renderTabPane();

    if (this.kind === "marker") {
      this._renderSimpleiconPane();
      this._renderPinIconsPane();
      this._renderMakisPane();
    }

    this._renderUserIconsPane();
    this._renderFilePane();
    this._renderDropboxPane();

    this._renderFooter();
  },

  _renderFooter: function() {
    this._footerView = new FooterView({
      model: this.model
    });

    this._footerView.bind("finish", this._ok, this);
    this.$('.js-footer').append(this._footerView.render().el);

    this.addView(this._footerView);
  },

  _renderTabPane: function() {
    this.tabPane = new cdb.ui.common.TabPane({
      el: this.$(".AssetsContent")
    });

    this.addView(this.tabPane);
  },

  _renderContentPane: function() {
    this._contentPane = new cdb.ui.common.TabPane({
      el: this.$('.js-content-container')
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

  _renderPane: function(name, pane) {
    pane.bind('fileChosen', this._onFileChosen, this);
    pane.render();
    this._addPane(name, pane);
  },

  _renderSimpleiconPane: function() {
    var pane = new SimpleIconsView({
      model: this.model,
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
    var pane = new SimpleIconsView({
      model:      this.model,
      collection: this.collection,
      kind:       this.kind,
      icons:      maki_icons.icons,
      disclaimer: maki_icons.disclaimer,
      folder:     'maki-icons',
      size:       '18'
    });
    
    this._renderPane('maki_icons', pane);
  },

  _renderUserIconsPane: function() {
    var pane = new UserIconsView({
      model:      this.model,
      collection: this.collection,
      kind:       this.kind
    });

    this._renderPane('your_icons', pane);
  },

  _renderPinIconsPane: function() {
    var pane = new SimpleIconsView({
      model: this.model,
      collection: this.collection,
      kind:       this.kind,
      icons:      pin_maps.icons,
      disclaimer: pin_maps.disclaimer,
      folder:     'pin-maps',
      size:       ''
    });

    this._renderPane('pin_icons', pane);
  },

  _renderFilePane: function() {

    var pane = new UploadView({
      model:      this.model,
      collection: this.collection,
      kind:       this.kind,
      user:       this.options.user
    });

    pane.bind('valueChange', this._onFileChosen, this);

    this._renderPane('upload_file', pane);
  },

  _renderDropboxPane: function() {
    if (cdb.config.get('dropbox_api_key')) {

      var pane = new DropboxView({
        model:      this.model,
        collection: this.collection,
        kind:       this.kind,
        user:       this.options.user
      });

      pane.bind('valueChange', this._onFileChosen, this);

      this._renderPane('dropbox', pane);
    }
  },

  _addPane: function(name, view) {
    this.tabPane.addTab(name, view, {
      active: this.model.get('listing') === name
    });
  },

  _addTab: function(name, view) {
    this._contentPane.addTab(name, view.render());
    this.addView(view);
  },

  _validate: function() {
    if (!this.model) {
      throw new TypeError('model is required');
    }

    if (!this.options.user) {
      throw new TypeError('user is required');
    }

    if (!this.options.kind) {
      throw new Error('kind should be passed');
    }
  },

  _initBinds: function() {
    // Bug with binding... do not work with the usual one for some reason :(
    this.model.bind('change:listing',        this._onChangeListing.bind(this));
    this.model.bind('change:submit_enabled', this._onChangeSubmitEnabled.bind(this));
    this.model.bind('change:contentPane',    this._onChangeContentView, this);

    cdb.god.bind('importByUploadData', this.close, this);

    this.add_related_model(this.model);
    this.add_related_model(cdb.god);
  },

  _onChangeSubmitEnabled: function() {
    if (this.model.get("submit_enabled")) {
    }
  },

  _onChangeListing: function() {
    if (this.tabPane) {
      this.tabPane.active(this.model.get('listing'));
      var activePane = this.tabPane.getActivePane();
      if (activePane) {
        this.model.set("disclaimer", activePane.options.disclaimer);
      }
    }
  },

  _onChangeContentView: function() {
    var pane = this.model.get('contentPane');
    this._contentPane.active(pane);
    if (pane === 'loading') {
      this._footerView.hide();
    }
  },

  _ok: function() {
    var url = this.tabPane.getActivePane().model.get("value");
    this.trigger("fileChosen", url);
    this.hide();
  },

  _onFileChosen: function(a) {
    this.model.set("submit_enabled", true);
    //var text = this._TEXTS.ok[this.model.get("listing")];
    this.$el.find(".js-ok").removeClass("is-disabled");
  }
});
