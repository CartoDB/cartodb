var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var PrivacyDialogView = require('./privacy-dialog-view');
var PrivacyWarningView = require('builder/components/modals/privacy-warning/privacy-warning-view');
var PasswordDialogView = require('./password-dialog-view');
var TabPaneView = require('builder/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('builder/components/tab-pane/tab-pane-collection');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var ModalsServiceModel = require('builder/components/modals/modals-service-model');
var template = require('./privacy-dropdown.tpl');
var templateTabPane = require('./tab-pane.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var ErrorDetailsView = require('builder/components/background-importer/error-details-view');

var ESCAPE_KEY_CODE = 27;

var REQUIRED_OPTS = [
  'visDefinitionModel',
  'userModel',
  'privacyCollection',
  'configModel',
  'isOwner'
];

var PRIVACY_MAP = {
  public: 'green',
  link: 'orange',
  password: 'orange-dark',
  private: 'red'
};

module.exports = CoreView.extend({

  events: {
    'click .js-toggle': '_onToggleDialogClicked'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    if (this._visDefinitionModel.isVisualization() && !this.options.mapcapsCollection) {
      throw new Error('mapcapsCollection is required for visualizations');
    }

    this._triggerElementID = 'toggle' + this.cid;

    this._modals = new ModalsServiceModel();
    this.model = new Backbone.Model({
      privacy: opts.visDefinitionModel.get('privacy'),
      state: 'show'
    });

    this._onEscapePressed = this._onEscapePressed.bind(this);
    this._onDocumentElementClicked = this._onDocumentElementClicked.bind(this);

    if (this.options.ownerName) {
      this._ownerName = this.options.ownerName;
    }

    if (this.options.mapcapsCollection) {
      this._mapcapsCollection = this.options.mapcapsCollection;
    }

    this._configPrivacyCollection();
    this._configPanes();
    this._initBinds();
  },

  render: function () {
    var privacy = this.model.get('privacy');
    if (this.model.get('state') === 'error') {
      privacy = this.options.visDefinitionModel.get('privacy');
    }
    var cssClass = PRIVACY_MAP[privacy.toLowerCase()];
    var canChangePrivacy = this._canChangePrivacy(privacy);

    this.clearSubViews();
    this._hideDialog();
    this.$el.html(template({
      privacy: privacy,
      cssClass: cssClass,
      isLoading: this.model.get('state') === 'loading',
      isOwner: this._isOwner,
      canChangePrivacy: canChangePrivacy
    }));
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._customCollection.on('change:selected', function (menuItem) {
      if (menuItem.get('disabled')) {
        return;
      }

      if (menuItem.get('val') === 'password') {
        this._showPasswordDialog();
      } else {
        this._onToggleDialogClicked();
        this._setPrivacy(menuItem.get('val'));
      }
    }, this);

    this.add_related_model(this._customCollection);

    this.model.on('change:state', this.render, this);
    this.add_related_model(this.model); // explicit
  },

  _canChangePrivacy: function (privacy) {
    return (privacy === 'PRIVATE' ? this._canChangePrivacyFromPrivate(privacy) : this._canChangePrivacyFromPublic(privacy));
  },

  _canChangePrivacyFromPrivate: function (privacy) {
    var isMap = this.options.visDefinitionModel.isVisualization();
    var hasPublicMapsLimits = this.options.userModel.hasPublicMapsLimits();
    var hasRemainingPublicMaps = this.options.userModel.hasRemainingPublicMaps();
    if (hasPublicMapsLimits && isMap && !hasRemainingPublicMaps && privacy === 'PRIVATE') {
      return false;
    }
    return true;
  },

  _canChangePrivacyFromPublic: function (privacy) {
    return true;
  },

  _makePrivacyDialog: function () {
    return new PrivacyDialogView({
      model: this.model,
      collection: this._customCollection,
      userModel: this._userModel,
      configModel: this._configModel,
      visModel: this._visDefinitionModel
    });
  },

  _makePasswordDialog: function () {
    return new PasswordDialogView({
      onBack: this._showPrivacyDialog.bind(this),
      onEdit: this._setPassword.bind(this)
    });
  },

  _setPassword: function (password) {
    if (password !== '') {
      this._privacyCollection.passwordOption().set({
        password: password
      });

      this.model.set({ password: password });
      this._setPrivacy('password');
    }
  },

  _setPrivacy: function (privacyStatus) {
    var newPrivacyStatus = privacyStatus.toUpperCase();

    this.model.set(
      { privacy: newPrivacyStatus },
      { silent: true }
    );

    if (this._shouldShowPrivacyWarning(newPrivacyStatus)) {
      this._checkPrivacyChange(
        newPrivacyStatus,
        this._savePrivacy.bind(this),
        this._discardPrivacyChange.bind(this)
      );
    } else {
      this._savePrivacy();
    }
  },

  _savePrivacy: function () {
    var self = this;
    var vis = this._visDefinitionModel;

    this.model.set({ state: 'loading' });

    this._privacyCollection.searchByPrivacy(this.model.get('privacy'))
      .saveToVis(vis, {
        success: function () {
          self.model.set({state: 'show'});
        },
        error: function (req, resp) {
          if (resp.responseText.indexOf('over account public map quota') !== -1) {
            self._modals.create(function () {
              return new ErrorDetailsView({
                error: { errorCode: 8007 },
                userModel: self._userModel,
                configModel: self._configModel
              });
            });
          }
          self.model.set({state: 'error'});
        }
      });
  },

  _checkPrivacyChange: function (newPrivacyStatus, confirmCallback, dismissCallback) {
    var self = this;

    this._modals.create(function (modalModel) {
      return new PrivacyWarningView({
        modalModel: modalModel,
        privacyType: newPrivacyStatus,
        type: self._visDefinitionModel.isVisualization() ? 'visualization' : 'dataset',
        onConfirm: confirmCallback,
        onDismiss: dismissCallback
      });
    });
  },

  _discardPrivacyChange: function () {
    var previousPrivacy = this.model.previous('privacy');

    this.model.set('privacy', previousPrivacy, { silent: true });
    this.model.set('state', 'show');
  },

  _shouldShowPrivacyWarning: function (privacyStatus) {
    if (!this._userModel.canSelectPremiumOptions(this._visDefinitionModel)) {
      return false;
    }

    var isPubliclyAvailable = VisDefinitionModel.isPubliclyAvailable(privacyStatus);

    if (this._visDefinitionModel.isVisualization()) {
      return !!this._mapcapsCollection.length && isPubliclyAvailable;
    }

    return isPubliclyAvailable;
  },

  _transformPrivacyOptions: function () {
    return this._privacyCollection.map(function (item) {
      return {
        label: item.get('title'),
        val: item.get('privacy').toLowerCase(),
        disabled: item.get('disabled'),
        selected: item.get('selected'),
        renderOptions: {
          cssClass: item.get('cssClass')
        }
      };
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
      this._onMouseClick();
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
      collection: this._collectionPane,
      template: templateTabPane,
      mouseOverAction: this._onMouseClick.bind(this)
    });
    this.$('.js-dialog').append(view.render().$el);
    this.addView(view);

    this._privacyTooltip = new TipsyTooltipView({
      el: this.$('.js-tooltip'),
      gravity: 'w',
      html: true,
      title: function () {
        return this._getPrivacyInfo();
      }.bind(this)
    });
    this.addView(this._privacyTooltip);
  },

  _getPrivacyInfo: function () {
    var privacyInfo = _t('change-privacy');

    if (this._ownerName) {
      privacyInfo = _t('dataset.privacy.info', { name: this._ownerName });
    }

    return privacyInfo;
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

  _onMouseClick: function () {
    this._privacyTooltip.hideTipsy();
  },

  clean: function () {
    this._destroyDocumentBinds();
    CoreView.prototype.clean.apply(this);
  }
});
