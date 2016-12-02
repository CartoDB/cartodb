var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var FeatureDefinitionModel = require('../../../../javascripts/cartodb3/data/feature-definition-model');

describe('data/feature-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var userModel = new UserModel({}, {
      configModel: configModel
    });

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });
    var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });
    layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo'
      }
    });
    var layerDefinitionModel = layerDefinitionsCollection.at(0);

    this.feature = new FeatureDefinitionModel({
      cartodb_id: '12345',
      name: 'Madrid',
      country: 'Spain'
    }, {
      configModel: configModel,
      layerDefinitionModel: layerDefinitionModel,
      userModel: userModel
    });

    this.fakeQueryRowModel = jasmine.createSpyObj('fakeQueryRowModel', ['save', 'fetch', 'destroy']);
    spyOn(this.feature, '_getQueryRowModel').and.returnValue(this.fakeQueryRowModel);
  });

  describe('.save', function () {
    it('should save the feature using the query row model', function () {
      this.feature.save();

      expect(this.fakeQueryRowModel.save).toHaveBeenCalled();
    });

    describe('when save succeeds', function () {
      beforeEach(function () {
        this.fakeQueryRowModel.save.and.callFake(function (attrs, options) {
          options && options.success(new Backbone.Model(attrs));
        });
      });

      it('should invoke the success callback', function () {
        var successCallback = jasmine.createSpy('successCallback');
        this.feature.save({
          success: successCallback
        });

        expect(successCallback).toHaveBeenCalled();
      });

      it('should trigger a save event', function () {
        var saveCallback = jasmine.createSpy('save');
        this.feature.on('save', saveCallback);

        this.feature.save();

        expect(saveCallback).toHaveBeenCalled();
      });

      it('should update the cartodb_id of the feature when creating a new row', function () {
        this.feature.set('cartodb_id', null);

        expect(this.feature.isNew()).toBeTruthy();

        this.fakeQueryRowModel.save.and.callFake(function (attrs, options) {
          attrs = _.extend({}, attrs, {
            cartodb_id: '56789'
          });
          options && options.success(new Backbone.Model(attrs));
        });

        this.feature.save();

        expect(this.fakeQueryRowModel.save.calls.mostRecent().args[0]).toEqual({
          name: 'Madrid',
          country: 'Spain'
        });
        expect(this.feature.get('cartodb_id')).toEqual('56789');
      });

      it('should NOT update the cartodb_id of the feature when updating an existing row', function () {
        expect(this.feature.get('cartodb_id')).toEqual('12345');

        // Row is updated and it returns a different cartodb_id. This will never happen
        // in The Real World, but it helps in this test
        this.fakeQueryRowModel.save.and.callFake(function (attrs, options) {
          attrs = _.extend({}, attrs, {
            cartodb_id: '56789'
          });
          options && options.success(new Backbone.Model(attrs));
        });

        this.feature.save();

        expect(this.fakeQueryRowModel.save.calls.mostRecent().args[0]).toEqual({
          name: 'Madrid',
          country: 'Spain'
        });
        expect(this.feature.get('cartodb_id')).toEqual('12345');
      });
    });

    describe('when save fails', function () {
      beforeEach(function () {
        this.fakeQueryRowModel.save.and.callFake(function (attrs, options) {
          options && options.error();
        });
      });

      it('should invoke the error callback', function () {
        var errorCallback = jasmine.createSpy('errorCallback');
        this.feature.save({
          error: errorCallback
        });

        expect(errorCallback).toHaveBeenCalled();
      });
    });
  });

  describe('.destroy', function () {
    describe('when destroy succeeds', function () {
      beforeEach(function () {
        this.fakeQueryRowModel.destroy.and.callFake(function (options) {
          options && options.success();
        });
      });

      it('should invoke the success callback', function () {
        var successCallback = jasmine.createSpy('successCallback');

        this.feature.destroy({
          success: successCallback
        });

        expect(successCallback).toHaveBeenCalled();
      });

      it('should trigger an event', function () {
        var onRemoveCallback = jasmine.createSpy('onRemoveCallback');
        this.feature.on('remove', onRemoveCallback);

        this.feature.destroy();

        expect(onRemoveCallback).toHaveBeenCalled();
      });
    });

    describe('when destroy fails', function () {
      beforeEach(function () {
        this.fakeQueryRowModel.destroy.and.callFake(function (options) {
          options && options.error();
        });
      });

      it('should invoke the error callback', function () {
        var errorCallback = jasmine.createSpy('errorCallback');

        this.feature.destroy({
          error: errorCallback
        });

        expect(errorCallback).toHaveBeenCalled();
      });
    });
  });
});
