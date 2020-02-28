var Backbone = require('backbone');
var userModel = require('fixtures/builder/user-model.fixture');
var configModel = require('fixtures/builder/config-model.fixture');
var AddLayerModel = require('builder/components/modals/add-layer/add-layer-model');
var ImportsWrapper = require('builder/components/modals/add-layer/content/imports/imports-wrapper-view');
var SelectedImportView = require('builder/components/modals/add-layer/content/imports/selected-import/selected-import-view');
var SelectedImportModel = require('builder/components/modals/add-layer/content/imports/selected-import/selected-import-model');
var ImportView = require('builder/components/modals/add-layer/content/imports/import-view');

describe('components/modals/add-layer/content/imports/imports-wrapper-view', function () {
  var privacyModel = new Backbone.Model();
  var guessingModel = new Backbone.Model();
  var _userModel = userModel({});
  var _configModel = configModel({
    oauth_gdrive: true
  });
  var createModel = new AddLayerModel({}, {
    userModel: _userModel,
    configModel: _configModel,
    userActions: {},
    pollingModel: new Backbone.Model()
  });
  var selectedImportModel = new SelectedImportModel({
    title: 'dropbox',
    name: 'Dropbox',
    status: 'idle'
  });
  var importView = new ImportView({
    userModel: _userModel,
    configModel: _configModel,
    createModel: createModel,
    privacyModel: privacyModel,
    guessingModel: guessingModel
  });
  importView.options = {
    title: 'dropbox',
    name: 'Dropbox',
    status: 'idle'
  };

  var selectedImport = new SelectedImportView({
    model: selectedImportModel,
    importView: importView,
    userModel: _userModel
  });

  beforeEach(function () {
    this.view = new ImportsWrapper({
      userModel: _userModel,
      configModel: _configModel,
      createModel: createModel,
      privacyModel: privacyModel,
      guessingModel: guessingModel
    });
    this.view._selectedImport = selectedImport;
  });

  it('should call _selectImport on selectImport events', function () {
    spyOn(this.view, '_selectImport');
    this.view.render();
    this.view._importsSelector.trigger('selectImport');
    expect(this.view._selectImport).toHaveBeenCalled();
    this.view.clean();
  });

  it('should call _setUploadModel on change events', function () {
    spyOn(this.view, '_setUploadModel');
    this.view.render();
    this.view._renderSelectedImportView(importView);
    this.view._selectedImport._importView.trigger('change');
    expect(this.view._setUploadModel).toHaveBeenCalled();
    this.view.clean();
  });

  it('should call _showImportsSelector on showImportsSelector events', function () {
    spyOn(this.view, '_showImportsSelector');
    this.view.render();
    this.view._renderSelectedImportView(importView);
    this.view._selectedImport.trigger('showImportsSelector');
    expect(this.view._showImportsSelector).toHaveBeenCalled();
    this.view.clean();
  });

  describe('_selectImport, when a Import is selected', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should show the selected Import view', function () {
      spyOn(this.view, '_renderSelectedImportView');
      this.view._selectImport();
      expect(this.view._renderSelectedImportView).toHaveBeenCalled();
      this.view.clean();
    });

    it('should hide the Imports selector view', function () {
      this.view._importsSelector = jasmine.createSpyObj('this.view._importsSelector', ['hide']);
      this.view._selectImport();
      expect(this.view._importsSelector.hide).toHaveBeenCalled();
      this.view.clean();
    });
  });

  describe('_showImportsSelector, when it shows back the Imports Selector', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should reset UploadModel', function () {
      spyOn(this.view, '_resetUploadModel');
      this.view._showImportsSelector();
      expect(this.view._resetUploadModel).toHaveBeenCalled();
      this.view.clean();
    });

    it('should hide the selected Import view', function () {
      this.view._selectedImport = jasmine.createSpyObj('this.view._selectedImport', ['remove']);
      this.view._showImportsSelector();
      expect(this.view._selectedImport.remove).toHaveBeenCalled();
      this.view.clean();
    });

    it('should show the Imports selector view', function () {
      this.view._importsSelector = jasmine.createSpyObj('this.view._importsSelector', ['show']);
      this.view._showImportsSelector();
      expect(this.view._importsSelector.show).toHaveBeenCalled();
      this.view.clean();
    });
  });
});
