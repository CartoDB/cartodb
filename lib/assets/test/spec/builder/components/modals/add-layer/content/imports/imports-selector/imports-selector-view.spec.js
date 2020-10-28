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
    SQLServer: { title: 'SQLServer', type: 'database' },
    Hive: { title: 'Hive', type: 'database' },
    Snowflake: { title: 'Snowflake', type: 'database' },
    Redshift: { title: 'Redshift', type: 'database' }
  };
  var importOptionsOrder = [
    'Box',
    'Dropbox',
    'GDrive',
    'Snowflake',
    'Redshift',
    'BigQuery',
    'MySQL',
    'PostgreSQL',
    'SQLServer',
    'Hive',
    'Arcgis',
    'Salesforce',
    'Twitter',
    'Mailchimp'
  ];

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
    it('should sort the imports by a custom order', function () {
      var orderedImports = this.view._orderImports(importOptions, importOptionsOrder);
      expect(orderedImports).toEqual([
        { title: 'Box', type: 'cloud' },
        { title: 'Dropbox', type: 'cloud' },
        { title: 'Google Drive', type: 'cloud' },
        { title: 'Snowflake', type: 'database' },
        { title: 'Redshift', type: 'database' },
        { title: 'BigQuery', type: 'database' },
        { title: 'MySQL', type: 'database' },
        { title: 'PostgreSQL', type: 'database' },
        { title: 'SQLServer', type: 'database' },
        { title: 'Hive', type: 'database' },
        { title: 'ArcGIS Server&trade;', type: 'other' },
        { title: 'Salesforce', type: 'other' },
        { title: 'Twitter', type: 'other' },
        { title: 'MailChimp', type: 'other' }
      ]);
    });
  });

  describe('_filterImportsByType', function () {
    it('should filter the imports by type', function () {
      this.view._orderedImports = this.view._orderImports(importOptions, importOptionsOrder);

      expect(this.view._filterImportsByType('cloud')).toEqual([
        { title: 'Box', type: 'cloud' },
        { title: 'Dropbox', type: 'cloud' },
        { title: 'Google Drive', type: 'cloud' }
      ]);

      expect(this.view._filterImportsByType('database')).toEqual([
        { title: 'Snowflake', type: 'database' },
        { title: 'Redshift', type: 'database' },
        { title: 'BigQuery', type: 'database' },
        { title: 'MySQL', type: 'database' },
        { title: 'PostgreSQL', type: 'database' },
        { title: 'SQLServer', type: 'database' },
        { title: 'Hive', type: 'database' }
      ]);

      expect(this.view._filterImportsByType('other')).toEqual([
        { title: 'ArcGIS Server&trade;', type: 'other' },
        { title: 'Salesforce', type: 'other' },
        { title: 'Twitter', type: 'other' },
        { title: 'MailChimp', type: 'other' }
      ]);
    });
  });

  describe('_isImportEnabled', function () {
    it('should return the status of the import', function () {
      expect([true, false]).toContain(this.view.model._isImportEnabled(importOptions.BigQuery));
      expect([true, false]).toContain(this.view.model._isImportEnabled(importOptions.GDrive));
    });
  });
});
