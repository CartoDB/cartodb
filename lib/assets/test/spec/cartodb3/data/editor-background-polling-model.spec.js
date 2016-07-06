var Backbone = require('backbone');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var BackgroundPollingModel = require('../../../../javascripts/cartodb3/data/editor-background-polling-model');
var ImportsCollection = require('../../../../javascripts/cartodb3/data/background-importer/background-importer-imports-collection');
var UserActions = require('../../../../javascripts/cartodb3/data/user-actions');

describe('cartodb3/data/editor-background-polling-model', function () {
  beforeEach(function () {
    var configModel = 'c';
    var userModel = new UserModel({
      username: 'pepe'
    }, {
      configModel: configModel
    });
    this.importsCollection = new ImportsCollection(undefined, {
      userModel: userModel,
      configModel: configModel
    });

    this.userActions = UserActions({
      analysisDefinitionNodesCollection: {},
      analysisDefinitionsCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    spyOn(this.userActions, 'createLayerForTable');

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

      expect(this.userActions.createLayerForTable).toHaveBeenCalledWith('tableName');
    });
  });
});
