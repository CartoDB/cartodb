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
    var $addIcon = this.$('.js-addIcon > .js-asset');
    if (!$addIcon.hasClass('Spinner')) {
      this.$('#iconfile').trigger('click');
      evt.preventDefault();
    }
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

    var $viewAllIcons = this.$('.js-viewAllIcons');
    if (this._iconCollection.length > this._maxIcons) {
      $viewAllIcons.show();
    } else {
      $viewAllIcons.hide();
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
    var $addIcon = this.$('.js-addIcon > .js-asset');
    if (enable && !$addIcon.hasClass('Spinner')) {
      $addIcon.children().hide();
      $addIcon.addClass('Spinner Spinner--formIcon');
      $addIcon.css('position', 'relative');
    }
    if (!enable) {
      $addIcon.removeClass('Spinner Spinner--formIcon');
      $addIcon.children().show();
    }
  },

  _showErrorMessage: function (message) {
    $('.js-errorMessage label').text(message);
    $('.js-errorMessage').show();
  },

  _hideErrorMessage: function () {
    $('.js-errorMessage').hide();
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
    this.$('.js-selectAllIcons').hide();
    this.$('.js-deselectAllIcons').hide();
    this.$('.js-deleteIcons').hide();
    this.$('.js-iconsInfo').hide();
    this.$('.js-viewAllIcons').hide();
  },

  _onProcessRunningChanged: function () {
    var running = this.model.get('isProcessRunning');
    this._showSpinner(running);
    if (running) {
      this.$el.css('pointer-events', 'none');
      this._hideActions();
      this.$('.js-runningInfo').text(this._runningMessage).show();
    } else {
      this.$('.js-runningInfo').hide().text('');
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
