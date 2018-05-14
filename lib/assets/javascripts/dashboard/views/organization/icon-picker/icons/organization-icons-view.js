const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const _ = require('underscore');
const IconCollection = require('./organization-icon-collection');
const IconView = require('./organization-icon-view');
const DeleteIconsDialog = require('./delete-icons-dialog-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const template = require('./organization-icons.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'orgId',
  'configModel'
];

module.exports = CoreView.extend({

  events: {
    'click .js-addIcon': '_onAddIconClicked',
    'click .js-selectAllIcons': '_onSelectAllIconsClicked',
    'click .js-deselectAllIcons': '_onDeselectAllIconsClicked',
    'click .js-deleteIcons': '_onDeleteIconsClicked',
    'change .js-inputFile': '_onFileSelected'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._modals = new ModalsServiceModel();
    this.model = new Backbone.Model({
      isProcessRunning: false
    });
    this._iconCollection = new IconCollection(null, {
      orgId: this._orgId,
      configModel: this._configModel
    });
    this._numOfUploadingProcesses = 0;
    this._numOfDeletingProcesses = 0;
    this._fetchErrorMessage = 'Error fetching organization icons. Please refresh the page.';
    this._runningMessage = '';

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
    this.listenTo(this.model, 'change:isProcessRunning', this._onProcessRunningChanged);
  },

  _fetchAllIcons: function () {
    this._iconCollection.fetch({
      success: this._renderAllIcons.bind(this),
      error: this._onFetchIconsError.bind(this)
    });
  },

  _renderAllIcons: function () {
    _.each(this._iconCollection.models, this._addIconElement, this);
  },

  _onFetchIconsError: function () {
    this._showErrorMessage(this._fetchErrorMessage);
  },

  _renderIcon: function (iconModel) {
    var iconView = new IconView({
      model: iconModel
    });
    iconView.render();
    iconModel.set('visible', true);
    this.$('.js-items').append(iconView.$el);
  },

  _addIconElement: function (iconModel) {
    this._renderIcon(iconModel);
  },

  _onAddIconClicked: function (event) {
    this.killEvent(event);

    this._hideErrorMessage();
    this.$('.js-inputFile').trigger('click');
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

  _getSelectedFiles: function () {
    return this.$('.js-inputFile').prop('files');
  },

  _onFileSelected: function () {
    var files = this._getSelectedFiles();

    _.each(files, function (file) {
      this._iconCollection.create({
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
    this.$('.js-inputFile').val('');
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
    var limit = Math.min(this._iconCollection.length);
    var numOfSelectedIcons = this._getNumberOfSelectedIcons();
    var iconText = (numOfSelectedIcons === 1 ? '1 icon selected' : '' + numOfSelectedIcons + ' icons selected');
    this.$('.js-iconMainLabel').text(iconText);

    if (numOfSelectedIcons === 0) {
      this.$('.js-iconMainLabel').text('');
      this._hide('.js-iconMainLabel, .js-selectAllIcons, .js-deselectAllIcons, .js-deleteIcons');
      this._show('.js-iconsInfo');
    } else if (numOfSelectedIcons < limit) {
      this._show('.js-iconMainLabel, .js-selectAllIcons, .js-deleteIcons');
      this._hide('.js-deselectAllIcons, .js-iconsInfo');
    } else {
      this._show('.js-iconMainLabel, .js-deselectAllIcons, .js-deleteIcons');
      this._hide('.js-selectAllIcons, .js-iconsInfo');
    }

    if (numOfSelectedIcons > 1) {
      this.$('.js-deleteIcons a').text('Delete icons...');
    } else if (numOfSelectedIcons === 1) {
      this.$('.js-deleteIcons a').text('Delete icon...');
    }
  },

  _hideActions: function () {
    this._hide('.js-selectAllIcons, .js-deselectAllIcons, .js-deleteIcons, .js-iconsInfo');
  },

  _onDeselectAllIconsClicked: function (event) {
    event.preventDefault();
    this._iconCollection.each(function (icon) {
      icon.set('selected', false);
    });
  },

  _onSelectAllIconsClicked: function (event) {
    event.preventDefault();
    this._iconCollection.each(function (icon) {
      if (icon.get('visible')) {
        icon.set('selected', true);
      }
    });
  },

  _onDeleteIconsClicked: function (event) {
    event.preventDefault();
    this._openDeleteIconsDialog();
  },

  _openDeleteIconsDialog: function (event) {
    this.killEvent(event);

    this._modals.create(modalModel =>
      new DeleteIconsDialog({
        modalModel,
        numOfIcons: this._getNumberOfSelectedIcons(),
        onSubmit: this._deleteIcons.bind(this)
      })
    );
  },

  _deleteIcons: function () {
    this._hideErrorMessage();
    var iconsToDelete = this._iconCollection.where({ selected: true });

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
    this.$('.js-errorMessage label').text(message);
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

  _addExtraIcon: function () {
    var iconAdded = false;
    this._iconCollection.each(function (icon) {
      if (!icon.get('visible') && !iconAdded) {
        this._addIconElement(icon);
        iconAdded = true;
      }
    }, this);
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
      this._iconCollection.trigger('refreshCollection', { cid: this.cid });
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
  }
});
