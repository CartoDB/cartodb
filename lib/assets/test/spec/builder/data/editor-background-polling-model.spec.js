var Backbone = require('backbone');
var $ = require('jquery');
var UserModel = require('builder/data/user-model');
var TableModel = require('builder/data/table-model');
var BackgroundPollingModel = require('builder/data/editor-background-polling-model');
var ImportsCollection = require('builder/data/background-importer/background-importer-imports-collection');
var UserActions = require('builder/data/user-actions');

describe('builder/data/editor-background-polling-model', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model();
    configModel.urlVersion = function () {};

    spyOn($, 'ajax').and.callFake(function (req) {
      var d = $.Deferred();
      d.resolve();
      return d.promise();
    });

    var userModel = new UserModel({
      username: 'pepe'
    }, {
      configModel: configModel
    });
    this.importsCollection = new ImportsCollection(undefined, {
      userModel: userModel,
      configModel: configModel
    });

    spyOn(TableModel.prototype, 'fetch').and.callThrough();

    this.userActions = UserActions({
      userModel: {},
      analysisDefinitionNodesCollection: {},
      analysisDefinitionsCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    spyOn(this.userActions, 'createLayerFromTable');

    this.model = new BackgroundPollingModel({}, {
      userModel: userModel,
      configModel: configModel,
      vis: new Backbone.Model({}),
      importsCollection: this.importsCollection,
      userActions: this.userActions
    });
  });

  describe('when an imports completes', function () {
    beforeEach(function () {
      this.importsCollection.reset({});
      this.importsModel = this.importsCollection.at(0);
      this.importsModel.set({
        step: 'import'
      });
    });

    it('should fetch table data', function () {
      this.importsModel._importModel.set({
        state: 'complete',
        table_name: 'tableName'
      });
      expect(TableModel.prototype.fetch).toHaveBeenCalled();
    });

    describe('when table is fetched', function () {
      it('should trigger the "importCompleted" event', function () {
        var callback = jasmine.createSpy('callback');
        this.model.bind('importCompleted', callback);

        this.importsModel._importModel.set({
          state: 'complete',
          table_name: 'tableName'
        });

        expect(callback).toHaveBeenCalledWith(this.importsModel, this.model);
      });

      it('should add a new layer definition to the collection', function () {
        this.importsModel._importModel.set({
          state: 'complete',
          table_name: 'tableName'
        });

        expect(this.userActions.createLayerFromTable).toHaveBeenCalled();
      });
    });
  });
});
