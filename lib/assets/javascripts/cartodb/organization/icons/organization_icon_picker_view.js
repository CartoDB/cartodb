var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var IconCollection = require('./organization_icon_collection');
var IconView = require('./organization_icon_view');
var DeleteIconsDialog = require('./delete_icons_dialog_view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-addIcon': '_onAddIconClicked',
    'click .js-selectAllIcons': '_onSelectAllIconsClicked',
    'click .js-deselectAllIcons': '_onDeselectAllIconsClicked',
    'click .js-deleteIcons': '_onDeleteIconsClicked',
    'click .js-viewAllIcons': '_onViewAllIconsClicked',
    'change #iconfile': '_onFileSelected'
  },

  initialize: function() {
    if (!this.options.orgId) {
      throw new Error('Organization ID is required.');
    }
    this._maxIcons = 23;
    this.template = cdb.templates.getTemplate('organization/icons/organization_icon_picker');
    this.orgId = this.options.orgId;
    this.model = new cdb.core.Model({
      isProcessRunning: false
    });
    this._iconCollection = new IconCollection(
      null, {
        orgId: this.orgId
      }
    );
    this._numOfUploadingProcesses = 0;
    this._numOfDeletingProcesses = 0;
    this._fetchErrorMessage = 'Error fetching your icons. Please refresh the page.'
    this._runningMessage = '';
    this.render();
    this._fetchAllIcons();
    this._initBinds();
  },

  render: function () {
    this.$el.html(this.template());

    return this;
  },

  _initBinds: function() {
    this._iconCollection.on('change:selected', this._refreshActions, this);
    this.model.on('change:isProcessRunning', this._onProcessRunningChanged, this);
  },

  _fetchAllIcons: function () {
    this._iconCollection.fetch({
      success: this._renderAllIcons.bind(this),
      error: this._onFetchIconsError.bind(this)
    });
  },

  _renderAllIcons: function () {
    _.each(this._iconCollection.models, function (icon) {
      this._addIconElement(icon);
    }, this);
  },

  _onFetchIconsError: function () {
    this._showErrorMessage(this._fetchErrorMessage);
  },

  _renderIcon: function (iconModel) {
    if (iconModel.get('index') < this._maxIcons) {
      var iconView = new IconView({
        model: iconModel,
        maxIcons: this._maxIcons
      });
      iconView.render();
      this.$('.js-items').append(iconView.$el);
    }
  },

  _addIconElement: function (iconModel) {
    iconModel.set('index', this._getIconIndex(iconModel));
    this._renderIcon(iconModel);
    this._refreshActions();
  },

  _onAddIconClicked: function (evt) {
    this._hideErrorMessage();
    this.$('#iconfile').trigger('click');
    evt.preventDefault();
  },

  _parseResponseText: function (response) {
    if (response && response.responseText) {
      try {
        var text = JSON.parse(response.responseText);
        if (text && text.errors && typeof text.errors === 'string') {
          return text.errors;
        }
      } catch (exc) {
        // Swallow
      }
    }
    return '';
  },

  _onFileSelected: function () {
    var files = this.$('#iconfile').prop('files');

    _.each(files, function (file) {
      var newIcon = this._iconCollection.create({
        kind: 'organization_asset',
        resource: file
      }, {
        beforeSend: this._beforeIconUpload.bind(this),
        success: this._onIconUploaded.bind(this),
        error: this._onIconUploadError.bind(this),
        complete: this._onIconUploadComplete.bind(this)
      });
    }, this);
  },

  _beforeIconUpload: function () {
    this._numOfUploadingProcesses++;
    if (this._numOfUploadingProcesses > 0) {
      this._runningMessage = 'Uploading icons...';
      this.model.set('isProcessRunning', true);
    }
  },

  _onIconUploaded: function (iconModel) {
    this._resetFileSelection();
    this._addIconElement(iconModel);
    this._refreshActions();
  },

  _onIconUploadError: function (model, response) {
    var errorText = this._parseResponseText(response);
    this._resetFileSelection();
    this._showErrorMessage(this._uploadErrorMessage(errorText));
  },

  _onIconUploadComplete: function () {
    this._numOfUploadingProcesses--;
    if (this._numOfUploadingProcesses <= 0) {
      this.model.set('isProcessRunning', false);
    }  
  },

  _resetFileSelection: function () {
    this.$('#iconfile').val('');
  },

  _show: function (selector) {
    this.$(selector).removeClass('is-hidden');
  },

  _hide: function (selector) {
    this.$(selector).addClass('is-hidden');
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
      this._hide('.js-selectAllIcons');
      this._hide('.js-deselectAllIcons');
      this._hide('.js-deleteIcons');
      this._show('.js-iconsInfo');
    } else if (numOfSelectedIcons < limit) {
      this._show('.js-selectAllIcons');
      this._hide('.js-deselectAllIcons');
      this._show('.js-deleteIcons');
      this._hide('.js-iconsInfo');
    } else {
      this._hide('.js-selectAllIcons');
      this._show('.js-deselectAllIcons');
      this._show('.js-deleteIcons');
      this._hide('.js-iconsInfo');
    }

    if (this._iconCollection.length > this._maxIcons) {
      this._show('.js-viewAllIcons');
    } else {
      this._hide('.js-viewAllIcons');
    }
  },

  _onDeselectAllIconsClicked: function (evt) {
    evt.preventDefault();
    this._iconCollection.each(function (icon) {
      icon.set('selected', false);
    });
  },

  _onSelectAllIconsClicked: function (evt) {
    evt.preventDefault();
    this._iconCollection.each(function (icon) {
      if (icon.get('visible')) {
        icon.set('selected', true);
      }
    });
  },

  _onDeleteIconsClicked: function (evt) {
    evt.preventDefault();
    this._openDeleteIconsDialog();
  },

  _openDeleteIconsDialog: function () {
    var numOfIconsToDelete = _.filter(this._iconCollection.models, function (icon) {
      return (icon.get('selected'));
    }).length;
    
    var dialog = new DeleteIconsDialog({
      numOfIcons: numOfIconsToDelete,
      okCallback: this._deleteIcons.bind(this)
    });

    dialog.appendToBody();
  },

  _deleteIcons: function () {
    this._hideErrorMessage();
    var iconsToDelete = _.filter(this._iconCollection.models, function (icon) {
      return (icon.get('selected'));
    });

    _.each(iconsToDelete, function (icon) {
      icon.destroy({
        beforeSend: this._beforeIconDelete.bind(this),
        success: this._onIconDeleted.bind(this),
        error: this._onIconDeleteError.bind(this),
        complete: this._onIconDeleteComplete.bind(this)
      });
    }, this);
  },

  _getNumberOfSelectedIcons: function () {
    return this._iconCollection.where({ selected: true }).length;
  },

  _beforeIconDelete: function () {
    this._numOfDeletingProcesses++;
    if (this._numOfDeletingProcesses > 0) {
      this._runningMessage = 'Deleting icons...';
      this.model.set('isProcessRunning', true);
    }
  },

  _onIconDeleted: function (icon) {
    icon.set('deleted', true);
    this._refreshActions();
    this._addExtraIcon();
  },

  _onIconDeleteError: function (icon, response) {
    var errorText = this._parseResponseText(response);
    // Even if API throws error the icon has been already removed from the collection.
    // We must add it again
    this._iconCollection.add(icon);
    this._resetSelection();
    this._showErrorMessage(this._deleteErrorMessage(errorText));
  },

  _onIconDeleteComplete: function () {
    this._numOfDeletingProcesses--;
    if (this._numOfDeletingProcesses <= 0) {
      this.model.set('isProcessRunning', false);
    }
  },

  _showSpinner: function (enable) {
    if (enable) {
      this._hide('.js-plusSign');
      this._show('.js-spinner');
    } else {
      this._show('.js-plusSign');
      this._hide('.js-spinner');
    }
  },

  _showErrorMessage: function (message) {
    $('.js-errorMessage label').text(message);
    this._show('.js-errorMessage');
  },

  _hideErrorMessage: function () {
    this._hide('.js-errorMessage');
  },

  _resetSelection: function () {
    this._iconCollection.each(function (icon) {
      icon.set('selected', false);
    });
    this._refreshActions();
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

  _onViewAllIconsClicked: function (evt) {
    console.warn('To be implemented in https://github.com/CartoDB/cartodb/issues/11009');
    evt.preventDefault();
  },

  _hideActions: function () {
    this._hide('.js-selectAllIcons');
    this._hide('.js-deselectAllIcons');
    this._hide('.js-deleteIcons');
    this._hide('.js-iconsInfo');
    this._hide('.js-viewAllIcons');
  },

  _onProcessRunningChanged: function () {
    var running = this.model.get('isProcessRunning');
    this._showSpinner(running);
    if (running) {
      this.$el.css('pointer-events', 'none');
      this._hideActions();
      this.$('.js-runningInfo').text(this._runningMessage);
      this._show('.js-runningInfo');
    } else {
      this.$('.js-runningInfo').text('');
      this._hide('.js-runningInfo');
      this._refreshActions();
      this.$el.css('pointer-events', 'auto');
    }
  },

  _uploadErrorMessage: function (errorText) {
    var message = 'Error uploading your image. ';
    if (errorText) {
      message += '[ ' + errorText + ' ]. ';
    }
    message += 'Please try again.';

    return message;
  },

  _deleteErrorMessage: function (errorText) {
    var message = 'Error deleting your image. ';
    if (errorText) {
      message += '[ ' + errorText + ' ]. ';
    }
    message += 'Please try again.';

    return message;
  },

  clean: function() {
  }
});
