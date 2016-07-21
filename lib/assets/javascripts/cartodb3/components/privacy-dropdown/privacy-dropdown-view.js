var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var PrivacyDialogView = require('./privacy-dialog-view');
var PasswordDialogView = require('./password-dialog-view');
var TabPaneView = require('../tab-pane/tab-pane-view');
var TabPaneCollection = require('../tab-pane/tab-pane-collection');
var CustomListCollection = require('../custom-list/custom-list-collection');
var template = require('./privacy-dropdown.tpl');
var _ = require('underscore');

var ESCAPE_KEY_CODE = 27;

var REQUIRED_OPTS = [
  'visDefinitionModel',
  'userModel',
  'privacyCollection'
];

var PRIVACY_MAP = {
  public: 'is-green',
  link: 'is-orange',
  password: 'is-orange-dark',
  private: 'is-red'
};

module.exports = CoreView.extend({

  events: {
    'click .js-toggle': '_onToggleDialogClicked'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._triggerElementID = 'toggle' + this.cid;

    this.model = new Backbone.Model({
      privacy: opts.visDefinitionModel.get('privacy'),
      state: 'show'
    });

    this._onEscapePressed = this._onEscapePressed.bind(this);
    this._onDocumentElementClicked = this._onDocumentElementClicked.bind(this);

    this._configPrivacyCollection();
    this._configPanes();
    this._initBinds();
  },

  render: function () {
    var privacy = this.model.get('privacy');
    var cssClass = PRIVACY_MAP[privacy.toLowerCase()];

    this.clearSubViews();
    this._hideDialog();
    this.$el.html(template({
      privacy: privacy,
      cssClass: cssClass,
      isLoading: this.model.get('state') === 'loading',
      isDropdown: this._customCollection.length > 1
    }));
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._customCollection.on('change:selected', function (menuItem) {
      if (menuItem.get('val') === 'password') {
        this._showPasswordDialog();
      } else {
        this._onToggleDialogClicked();
        this._setPrivacy(menuItem.get('val'));
      }
    }, this);

    this.add_related_model(this._customCollection);

    this.model.on('change:privacy', this._savePrivacy, this);
    this.model.on('change:state', this.render, this);
    this.add_related_model(this.model); // explicit
  },

  _makePrivacyDialog: function () {
    return new PrivacyDialogView({
      model: this.model,
      collection: this._customCollection
    });
  },

  _makePasswordDialog: function () {
    return new PasswordDialogView({
      onBack: this._showPrivacyDialog.bind(this),
      onEdit: this._setPassword.bind(this)
    });
  },

  _setPrivacy: function (privacy) {
    this.model.set({privacy: privacy});
  },

  _setPassword: function (password) {
    this.model.set({
      privacy: 'password',
      password: password
    });
  },

  _savePrivacy: function () {
    var self = this;
    var privacy = this.model.get('privacy').toUpperCase();
    this.model.set({state: 'loading'});
    this._privacyCollection.searchByPrivacy(privacy).saveToVis(this._visDefinitionModel, {
      success: function () {
        self.model.set({state: 'show'});
      },
      error: function () {
        console.log(privacy + ' privacy error on save!');
        self.model.set({state: 'error'});
      }
    });
  },

  _transformPrivacyOptions: function () {
    return this._privacyCollection.map(function (item) {
      if (item.get('disabled') === false || item.get('privacy') === 'PUBLIC') {
        return {
          label: item.get('privacy'),
          val: item.get('privacy').toLowerCase(),
          renderOptions: {
            cssClass: item.get('cssClass')
          }
        };
      }
    }).filter(Boolean);
  },

  _configPrivacyCollection: function () {
    var models = this._transformPrivacyOptions();
    this._customCollection = new CustomListCollection(models);
  },

  _configPanes: function () {
    var self = this;
    var tabPaneTabs = [{
      createContentView: self._showNoneDialog
    }, {
      createContentView: self._makePrivacyDialog.bind(self)
    }, {
      createContentView: self._makePasswordDialog.bind(self)
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  },

  _showNoneDialog: function () {
    return false;
  },

  _showPasswordDialog: function () {
    this._collectionPane.at(2).set({selected: true});
  },

  _showPrivacyDialog: function () {
    this._customCollection.each(function (m) {
      m.set({selected: false}, {silent: true});
    });

    this._collectionPane.at(1).set({selected: true});
  },

  _onToggleDialogClicked: function () {
    if (this._isDialogVisible()) {
      this._hideDialog();
    } else {
      this._initDocumentBinds();
      this._showPrivacyDialog();
    }
  },

  _isDialogVisible: function () {
    return this._collectionPane.at(0).get('selected') === false;
  },

  _hideDialog: function () {
    this._destroyDocumentBinds();
    this._collectionPane.at(0).set({selected: true});
  },

  _showDialog: function () {
    this._showPrivacyDialog();
  },

  _initViews: function () {
    var view = new TabPaneView({
      collection: this._collectionPane
    });
    this.$('.js-dialog').append(view.render().$el);
    this.addView(view);
  },

  _initDocumentBinds: function () {
    $(document).on('keydown', this._onEscapePressed);
    $(document).on('mousedown', this._onDocumentElementClicked);
  },

  _destroyDocumentBinds: function () {
    $(document).off('keydown', this._onEscapePressed);
    $(document).off('mousedown', this._onDocumentElementClicked);
  },

  _onEscapePressed: function (ev) {
    if (ev.which === ESCAPE_KEY_CODE) {
      this._hideDialog();
    }
  },

  _onDocumentElementClicked: function (ev) {
    var $el = $(ev.target);
    if ($el.closest(this.$el).length === 0 && $el.closest($('#' + this._triggerElementID)).length === 0) {
      this._hideDialog();
    }
  },

  clean: function () {
    this._destroyDocumentBinds();
    CoreView.prototype.clean.apply(this);
  }
});
