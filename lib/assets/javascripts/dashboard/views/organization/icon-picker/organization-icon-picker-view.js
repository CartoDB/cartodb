const Backbone = require('backbone');
const IconPickerView = require('./icons/organization-icons-view');
const OrganizationIconCollection = require('./icons/organization-icon-collection');
const IconView = require('./icons/organization-icon-view');
const IconPickerDialog = require('./icon-picker-dialog/icon-picker-dialog-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const template = require('./organization-icon-picker.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'orgId',
  'configModel'
];

module.exports = IconPickerView.extend({

  events: IconPickerView.extendEvents({
    'click .js-viewAllIcons': '_onViewAllIconsClicked'
  }),

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._maxIcons = 23;
    this._modals = new ModalsServiceModel();
    this.model = new Backbone.Model({
      isProcessRunning: false
    });
    this._iconCollection = new OrganizationIconCollection(null, {
      orgId: this._orgId,
      configModel: this._configModel
    });
    this._numOfUploadingProcesses = 0;
    this._numOfDeletingProcesses = 0;
    this._fetchErrorMessage = 'Error fetching organization icons. Please refresh the page.';
    this._runningMessage = '';
    this.teplate = template;

    this.render();
    this._fetchAllIcons();
    this._initBinds();
  },

  render: function () {
    this.$el.html(template());

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._iconCollection, 'change:selected', this._refreshActions);
    this.listenTo(this._iconCollection, 'refreshCollection', this._refreshCollection);
    this.listenTo(this.model, 'change:isProcessRunning', this._onProcessRunningChanged);
  },

  _refreshCollection: function (data) {
    if (data.cid && this.cid !== data.cid) {
      this.render();
      this._fetchAllIcons();
    }
  },

  _renderIcon: function (iconModel) {
    if (iconModel.get('index') < this._maxIcons) {
      var iconView = new IconView({
        model: iconModel
      });
      iconView.render();
      iconModel.set('visible', true);
      this.$('.js-items').append(iconView.$el);
    }
  },

  _addIconElement: function (iconModel) {
    iconModel.set('index', this._getIconIndex(iconModel));
    this._renderIcon(iconModel);
    this._refreshActions();
  },

  _refreshActions: function () {
    if (this.model.get('isProcessRunning')) {
      return;
    }
    var limit = Math.min(this._maxIcons, this._iconCollection.length);
    var numOfSelectedIcons = this._getNumberOfSelectedIcons();
    var iconText = (numOfSelectedIcons === 1 ? '1 icon selected' : '' + numOfSelectedIcons + ' icons selected');
    this.$('.js-iconMainLabel').text(iconText);

    if (numOfSelectedIcons === 0) {
      this.$('.js-iconMainLabel').text('Icons');
      this._hide('.js-selectAllIcons, .js-deselectAllIcons, .js-deleteIcons');
      this._show('.js-iconsInfo');
    } else if (numOfSelectedIcons < limit) {
      this._show('.js-selectAllIcons, .js-deleteIcons');
      this._hide('.js-deselectAllIcons, .js-iconsInfo');
    } else {
      this._hide('.js-selectAllIcons, .js-iconsInfo');
      this._show('.js-deselectAllIcons, .js-deleteIcons');
    }

    if (numOfSelectedIcons > 1) {
      this.$('.js-deleteIcons a').text('Delete icons...');
    } else if (numOfSelectedIcons === 1) {
      this.$('.js-deleteIcons a').text('Delete icon...');
    }

    if (this._iconCollection.length > this._maxIcons) {
      this._show('.js-viewAllIcons');
    } else {
      this._hide('.js-viewAllIcons');
    }
  },

  _hideActions: function () {
    this._hide('.js-selectAllIcons, .js-deselectAllIcons, .js-deleteIcons, .js-iconsInfo, .js-viewAllIcons');
  },

  _getIconIndex: function (icon) {
    return this._iconCollection.indexOf(icon);
  },

  _addExtraIcon: function () {
    var iconAdded = false;
    this._iconCollection.each(function (icon) {
      var index = this._getIconIndex(icon);
      if (index < this._maxIcons && !icon.get('visible') && !iconAdded) {
        this._addIconElement(icon);
        iconAdded = true;
      }
    }, this);
  },

  _onViewAllIconsClicked: function (event) {
    this.killEvent(event);

    this._modals.create(modalModel =>
      new IconPickerDialog({
        orgId: this._orgId,
        configModel: this._configModel
      })
    );
  }
});
