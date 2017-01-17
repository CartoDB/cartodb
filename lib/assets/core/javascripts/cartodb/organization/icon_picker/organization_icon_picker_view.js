var IconPickerView = require('./icons/organization_icons_view');
var IconCollection = require('./icons/organization_icon_collection');
var IconPickerDialog = require('./icon_picker_dialog/icon_picker_dialog_view');

module.exports = IconPickerView.extend({

  events: IconPickerView.extendEvents({
    'click .js-viewAllIcons': '_onViewAllIconsClicked'
  }),

  initialize: function() {
    if (!this.options.user) { throw new Error('user ID is required.'); }
    this._user = this.options.user;

    this._maxIcons = 23;
    this.template = cdb.templates.getTemplate('organization/icon_picker/organization_icon_picker_template');
    this.orgId = this._user.organization.get('id');
    this.model = new cdb.core.Model({
      isProcessRunning: false
    });
    this._iconCollection = new IconCollection(null, {
      orgId: this.orgId
    });
    this._numOfUploadingProcesses = 0;
    this._numOfDeletingProcesses = 0;
    this._fetchErrorMessage = 'Error fetching your icons. Please refresh the page.'
    this._runningMessage = '';
    this.render();
    this._fetchAllIcons();
    this._initBinds();
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
      this.$('.js-selectAllIcons').hide();
      this.$('.js-deselectAllIcons').hide();
      this.$('.js-deleteIcons').hide();
      this.$('.js-iconsInfo').show();
    } else if (numOfSelectedIcons < limit) {
      this.$('.js-selectAllIcons').show();
      this.$('.js-deselectAllIcons').hide();
      this.$('.js-deleteIcons').show();
      this.$('.js-iconsInfo').hide();
    } else {
      this.$('.js-selectAllIcons').hide();
      this.$('.js-deselectAllIcons').show();
      this.$('.js-deleteIcons').show();
      this.$('.js-iconsInfo').hide();
    }

    this.$viewAllIcons = this.$('.js-viewAllIcons');

    if (this._iconCollection.length > this._maxIcons) {
      this.$viewAllIcons.show();
    } else {
      this.$viewAllIcons.hide();
    }
  },

  _hideActions: function () {
    this.$('.js-selectAllIcons').hide();
    this.$('.js-deselectAllIcons').hide();
    this.$('.js-deleteIcons').hide();
    this.$('.js-iconsInfo').hide();
    this.$('.js-viewAllIcons').hide();
  },

  _bindIconsPicker: function() {
    cdb.god.bind("closeDialogs:icons", this._destroyPicker, this);
  },

  _unbindIconsPicker: function() {
    cdb.god.unbind("closeDialogs:icons", this._destroyPicker, this);
  },

  _destroyPicker: function() {
    if (this.icon_picker_dialog) {
      this._unbindIconsPicker();
      this.icon_picker_dialog.remove();
      this.removeView(this.icon_picker_dialog);
      this.icon_picker_dialog.hide();
      delete this.icon_picker_dialog;
    }
  },

  _onViewAllIconsClicked: function (e) {
    this.killEvent(e);

    cdb.god.trigger("closeDialogs:icons");

    this.icon_picker_dialog = new IconPickerDialog({
      user: this._user,
      kind: 'organization_asset'
    });
    this.icon_picker_dialog.appendToBody();

    this._bindIconsPicker();
    this.addView(this.icon_picker_dialog);
  }
});
