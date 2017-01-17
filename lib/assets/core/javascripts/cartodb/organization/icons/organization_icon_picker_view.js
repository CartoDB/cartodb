var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var IconCollection = require('./organization_icon_collection');
var IconView = require('./organization_icon_view');
var ImagePickerView = require('./image_picker/image_picker_view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-addIcon': '_onAddIconClicked',
    'click .js-selectAllIcons': '_onSelectAllIconsClicked',
    'click .js-deselectAllIcons': '_onDeselectAllIconsClicked',
    'click .js-deleteIcons': '_onDeleteIconsClicked',
    'click .js-viewAllIcons': '_onViewIconsClicked',
    'change #iconfile': '_onFileSelected'
  },

  initialize: function() {
    if (!this.options.user) { throw new Error('user ID is required.'); }
    this._user = this.options.user;

    this._maxIcons = 23;
    this.template = cdb.templates.getTemplate('organization/icons/organization_icon_picker');
    this.orgId = this._user.organization.get('id');
    this._iconCollection = new IconCollection(null, {
      orgId: this.orgId
    });
    this._numOfUploadingProcesses = 0;
    this._numOfDeletingProcesses = 0;
    this._uploadErrorMessage = 'Error uploading your image. Please try again.';
    this._deleteErrorMessage = 'Error deleting your image. Please try again.';
    this._fetchErrorMessage = 'Error fetching your icons. Please refresh the page.'
    this.render();
    this._fetchAllIcons();
    this._initBinds();
  },

  render: function () {
    this.$el.html(this.template());

    return this;
  },

  _initBinds: function() {
    this._iconCollection.on('change:selected', this._onSelectionChanged, this);
    this._iconCollection.on('remove', this._onIconCollectionUpdated, this);
    this._iconCollection.on('add', this._onIconCollectionUpdated, this);
  },

  _onIconCollectionUpdated: function () {
    console.log('Algo ha cambiado en la coleccion');
  },

  _fetchAllIcons: function () {
    this._iconCollection.fetch({
      success: this._renderAllIcons.bind(this),
      error: this._onFetchIconsError.bind(this)
    });
  },

  _renderAllIcons: function () {
    this._updateIconIndexes();
    _.each(this._iconCollection.models, function (icon) {
      this._addIconElement(icon);
    }, this);
  },

  _onFetchIconsError: function () {
    this._showErrorMessage(this._fetchErrorMessage);
  },

  _renderIcon: function (iconModel) {
    var iconView = new IconView({
      model: iconModel,
      maxIcons: this._maxIcons
    });
    iconView.render();
    this.$('.js-items').append(iconView.$el);
  },

  _addIconElement: function (iconModel) {
    if (iconModel.get('index') < this._maxIcons && !iconModel.get('visible')) {
      this._renderIcon(iconModel);
    }
  },

  _onAddIconClicked: function (evt) {
    this._hideErrorMessage();
    var $addIcon = this.$('.js-addIcon > .js-asset');
    if (!$addIcon.hasClass('Spinner')) {
      this.$('#iconfile').trigger('click');
      evt.preventDefault();
    }
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
      this._showSpinner(true);
    }
  },

  _onIconUploaded: function (iconModel) {
    this._updateIconIndexes();
    this._resetFileSelection();
    this._addIconElement(iconModel);
    this._onSelectionChanged();
  },

  _onIconUploadError: function () {
    this._resetFileSelection();
    this._showErrorMessage(this._uploadErrorMessage);
  },

  _onIconUploadComplete: function () {
    this._numOfUploadingProcesses--;
    if (this._numOfUploadingProcesses <= 0) {
      this._showSpinner(false);
    }  
  },

  _resetFileSelection: function () {
    this.$('#iconfile').val('');
  },

  _checkMaxIconsReached: function () {
    var $viewAllIcons = this.$('.js-viewAllIcons');

    if (this._iconCollection.length > this._maxIcons) {
      $viewAllIcons.show();
    } else {
      $viewAllIcons.hide();
    }
  },

  _onSelectionChanged: function () {
    console.log('_onSelectionChanged');

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

  _onViewIconsClicked: function (e) {
    this.killEvent(e);

    cdb.god.trigger("closeDialogs:icons");

    this.icons_picker = new ImagePickerView({
      user: this._user,
      kind: 'marker',
      collection: this._iconCollection
    });
    this.icons_picker.appendToBody();

    this._bindIconsPicker();
    this.addView(this.icons_picker);
  },

  _bindIconsPicker: function() {
    cdb.god.bind("closeDialogs:icons", this._destroyPicker, this);
  },

  _unbindIconsPicker: function() {
    cdb.god.unbind("closeDialogs:icons", this._destroyPicker, this);
  },

  _destroyPicker: function() {
    if (this.icons_picker) {
      this._unbindIconsPicker();
      this.icons_picker.remove();
      this.removeView(this.icons_picker);
      this.icons_picker.hide();
      delete this.icons_picker;
    }
  },

  _getNumberOfSelectedIcons: function () {
    return this._iconCollection.where({ selected: true }).length;
  },

  _beforeIconDelete: function () {
    this._numOfDeletingProcesses++;
    if (this._numOfDeletingProcesses > 0) {
      this._showSpinner(true);
    }
  },

  _onIconDeleted: function (icon) {
    icon.set('deleted', true);
    this._onSelectionChanged();
  },

  _onIconDeleteError: function (icon) {
    // Even if API throws error the icon has been already removed from the collection.
    // We must add it again
    this._iconCollection.add(icon);
    this._resetSelection();
    this._showErrorMessage(this._deleteErrorMessage);
  },

  _onIconDeleteComplete: function () {
    this._numOfDeletingProcesses--;
    if (this._numOfDeletingProcesses <= 0) {
      this._showSpinner(false);
    }
    this._renderAllIcons();
  },

  _showSpinner: function (enable) {
    var $addIcon = this.$('.js-addIcon > .js-asset');
    if (enable && !$addIcon.hasClass('Spinner')) {
      $addIcon.children().hide();
      $addIcon.addClass('Spinner Spinner--formIcon');
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
    this._onSelectionChanged();
  },

  _updateIconIndexes: function () {
    this._iconCollection.each(function (icon) {
      var index = this._iconCollection.indexOf(icon);
      icon.set('index', index);
    }, this);
  },

  clean: function() {
  }
});
