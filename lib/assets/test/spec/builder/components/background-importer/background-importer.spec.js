var Backbone = require('backbone');
var cdb = require('internal-carto.js');
var _ = require('underscore');
var ImportsModel = require('builder/data/background-importer/imports-model');
var BackgroundImporter = require('builder/components/background-importer/background-importer');
var BackgroundPollingModel = require('builder/data/background-importer/background-polling-model');
var ImportsCollection = require('builder/data/background-importer/background-importer-imports-collection');
var UserModel = require('builder/data/user-model');
var ConfigModel = require('builder/data/config-model');
var FactoryModals = require('../../factories/modals');

describe('editor/components/background-importer/background-importer', function () {
  beforeEach(function () {
    this.userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: 'c'
    });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    cdb.god = new Backbone.Model();
    spyOn(cdb.god, 'bind').and.callThrough();

    this.importsCollection = new ImportsCollection(undefined, {
      userModel: this.userModel,
      configModel: this.configModel
    });

    this.model = new BackgroundPollingModel({}, {
      vis: {},
      userModel: this.userModel,
      configModel: this.configModel,
      importsCollection: this.importsCollection
    });

    this.importer = BackgroundImporter.init({
      modals: FactoryModals.createModalService(),
      pollingModel: this.model,
      createVis: {},
      userModel: this.userModel,
      configModel: this.configModel
    });
  });

  it('should add importers properly', function () {
    var mdl = new ImportsModel({}, {
      userModel: this.userModel,
      configModel: {}
    });

    this.model.addImportItem(mdl);
    expect(_.keys(this.importer._importers).length).toBe(1);
  });
});
