var Backbone = require('backbone');
var ImportsSelectorView = require('builder/components/modals/add-layer/content/imports/imports-selector/imports-selector-view');
var AddLayerModel = require('builder/components/modals/add-layer/add-layer-model');
var userModel = require('fixtures/builder/user-model.fixture');
var configModel = require('fixtures/builder/config-model.fixture');

describe('components/modals/add-layer/content/imports/imports-selector/imports-selector-view', function () {
  var privacyModel = new Backbone.Model();
  var guessingModel = new Backbone.Model();
  var _userModel = userModel({});
  var _configModel = configModel({});
  var createModel = new AddLayerModel({}, {
    userModel: _userModel,
    configModel: _configModel,
    userActions: {},
    pollingModel: new Backbone.Model()
  });
  var importOptions = {
    GDrive: { title: 'Google Drive', type: 'cloud' },
    BigQuery: { title: 'BigQuery', type: 'database' },
    Dropbox: { title: 'Dropbox', type: 'cloud' },
    Box: { title: 'Box', type: 'cloud' },
    Twitter: { title: 'Twitter', type: 'other' },
    Mailchimp: { title: 'MailChimp', type: 'other' },
    Arcgis: { title: 'ArcGIS Server&trade;', type: 'other' },
    Salesforce: { title: 'Salesforce', type: 'other' },
    PostgreSQL: { title: 'PostgreSQL', type: 'database' },
    MySQL: { title: 'MySQL', type: 'database' },
    Hive: { title: 'Hive', type: 'database' }
  };

  beforeEach(function () {
    this.view = new ImportsSelectorView({
      userModel: _userModel,
      configModel: _configModel,
      createModel: createModel,
      privacyModel: privacyModel,
      guessingModel: guessingModel
    });
  });

  describe('_orderImports', function () {
    it('should sort the imports alphabetically', function () {
      var orderedImports = this.view._orderImports(importOptions);
      expect(orderedImports).toEqual({
        Arcgis: { title: 'ArcGIS Server&trade;', type: 'other' },
        BigQuery: { title: 'BigQuery', type: 'database' },
        Box: { title: 'Box', type: 'cloud' },
        Dropbox: { title: 'Dropbox', type: 'cloud' },
        GDrive: { title: 'Google Drive', type: 'cloud' },
        Hive: { title: 'Hive', type: 'database' },
        Mailchimp: { title: 'MailChimp', type: 'other' },
        PostgreSQL: { title: 'PostgreSQL', type: 'database' },
        MySQL: { title: 'MySQL', type: 'database' },
        Salesforce: { title: 'Salesforce', type: 'other' },
        Twitter: { title: 'Twitter', type: 'other' }
      });
    });
  });

  describe('_filterImportsByType', function () {
    it('should sort the imports alphabetically', function () {
      this.view._orderedImports = importOptions;

      expect(this.view._filterImportsByType('database')).toEqual({
        BigQuery: { title: 'BigQuery', type: 'database' },
        PostgreSQL: { title: 'PostgreSQL', type: 'database' },
        MySQL: { title: 'MySQL', type: 'database' },
        Hive: { title: 'Hive', type: 'database' }
      });

      expect(this.view._filterImportsByType('cloud')).toEqual({
        GDrive: { title: 'Google Drive', type: 'cloud' },
        Dropbox: { title: 'Dropbox', type: 'cloud' },
        Box: { title: 'Box', type: 'cloud' }
      });
    });
  });

  describe('_isImportEnabled', function () {
    it('should return the status of the import', function () {
      expect([true, false]).toContain(this.view.model._isImportEnabled(importOptions.BigQuery));
      expect([true, false]).toContain(this.view.model._isImportEnabled(importOptions.GDrive));
    });
  });
});
