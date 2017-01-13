var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var IconCollection = require('./organization_icon_collection');
var IconView = require('./organization_icon_view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-addIcon': '_onAddIconClicked',
    'click .js-selectAllIcons': '_onSelectAllIconsClicked',
    'click .js-deselectAllIcons': '_onDeselectAllIconsClicked',
    'click .js-deleteIcons': '_onDeleteIconsClicked',
    'change #iconfile': '_onFileSelected'
  },

  initialize: function() {
    if (!this.options.orgId) {
      throw new Error('Organization ID is required.');
    }
    this._maxIcons = 23;
    this.template = cdb.templates.getTemplate('organization/icons/organization_icon_picker');
    this.orgId = this.options.orgId;
    this._iconCollection = new IconCollection(
      null, {
        orgId: this.orgId
      }
    );
    this._numOfUploadingProcesses = 0;
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
  },  

  _fetchAllIcons: function () {
    this._iconCollection.fetch({
      success: this._onAllIconsFetched.bind(this),
      error: this._onFetchIconsError.bind(this)
    });
  },

  _onAllIconsFetched: function () {
    _.each(this._iconCollection.models, function (icon) {
      this._addIconElement(icon);
    }, this);
  },

  _onFetchIconsError: function () {
    throw new Error('To be implemented.');
  },

  _addIconElement: function (iconModel) {
    var iconView = new IconView({
      model: iconModel
    });
    iconView.render();
    this.$('.js-items').append(iconView.$el);
    iconView.model.set('visible', true);
  },

  _onAddIconClicked: function (evt) {
    this.$('#iconfile').trigger('click');
    evt.preventDefault();
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
    this._resetFileSelection();
    this._addIconElement(iconModel);
    this._onSelectionChanged();
  },

  _onIconUploadError: function () {
    this._resetFileSelection();
    throw new Error('To be implemented.');
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
    var iconsToDelete = _.filter(this._iconCollection.models, function (icon) {
      return (icon.get('selected'));
    });

    _.each(iconsToDelete, function (icon) {
      icon.destroy({
        success: this._onIconDeleted.bind(this),
        error: this._onIconDeleteError.bind(this)
      });
    }, this);
  },

  _getNumberOfSelectedIcons: function () {
    return this._iconCollection.where({ selected: true }).length;
  },

  _onIconDeleted: function (icon) {
    icon.set('deleted', true);
    this._onSelectionChanged();
  },

  _onIconDeleteError: function () {
    this._onSelectionChanged();    
    throw new Error('To be implemented.');
  },

  _showSpinner: function (enable) {
    var $addIcon = this.$('.js-addIcon > .js-asset');
    if (enable && !$addIcon.hasClass('Spinner')) {
      $addIcon.children().hide();
      $addIcon.addClass('Spinner Spinner--formIcon');
      // TODO: disable button!
    }
    if (!enable) {
      $addIcon.removeClass('Spinner Spinner--formIcon');
      $addIcon.children().show();
    }
  },

  clean: function() {
  }
});
