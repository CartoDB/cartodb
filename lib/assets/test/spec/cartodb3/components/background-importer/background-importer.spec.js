var Backbone = require('backbone');
var cdb = require('cartodb.js');
var _ = require('underscore');
var ImportsModel = require('../../../../../javascripts/cartodb3/data/background-importer/imports-model');
var BackgroundImporter = require('../../../../../javascripts/cartodb3/components/background-importer/background-importer');
var BackgroundPollingModel = require('../../../../../javascripts/cartodb3/data/background-importer/background-polling-model');
var ImportsCollection = require('../../../../../javascripts/cartodb3/data/background-importer/background-importer-imports-collection');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');

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
      modals: {},
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
