var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var FeatureDefinitionModel = require('builder/data/feature-definition-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');

describe('data/feature-definition-model', function () {
  var userModel;
  var configModel;
  var layerDefinitionsCollection;
  var layerDefinitionModel;

  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    userModel = new UserModel({}, {
      configModel: configModel
    });

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
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
    layerDefinitionModel = layerDefinitionsCollection.at(0);
    layerDefinitionModel.getColumnNamesFromSchema = function () { return ['name', 'country', 'the_geom']; };

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

  it('should create _changesHistory at the beginning', function () {
    expect(this.feature._changesHistory).toEqual([]);
  });

  describe('change bind', function () {
    it('should set at the beginning if model is new', function () {
      spyOn(FeatureDefinitionModel.prototype, '_bindChangeEvent');
      var feature = new FeatureDefinitionModel({}, {
        configModel: configModel,
        layerDefinitionModel: layerDefinitionModel,
        userModel: userModel
      });
      expect(FeatureDefinitionModel.prototype._bindChangeEvent).toHaveBeenCalled();
      expect(feature.isNew()).toBeTruthy();
    });

    it('should not be set at the beginning if model is not new', function () {
      spyOn(FeatureDefinitionModel.prototype, '_bindChangeEvent');
      var feature = new FeatureDefinitionModel({
        cartodb_id: 1
      }, {
        configModel: configModel,
        layerDefinitionModel: layerDefinitionModel,
        userModel: userModel
      });
      expect(FeatureDefinitionModel.prototype._bindChangeEvent).not.toHaveBeenCalled();
      expect(feature.isNew()).toBeFalsy();
    });
  });

  describe('.fetch', function () {
    describe('on success', function () {
      beforeEach(function () {
        this.fakeQueryRowModel.fetch.and.callFake(function (options) {
          options && options.success(
            new Backbone.Model({
              cartodb_id: '3',
              the_geom: '{whatever}'
            })
          );
        });
      });

      it('should fetch from query row model', function () {
        this.feature.fetch();
        expect(this.fakeQueryRowModel.fetch).toHaveBeenCalled();
      });

      it('should unbind change binding', function () {
        spyOn(this.feature, '_unbindChangeEvent');
        this.feature.fetch();
        expect(this.feature._unbindChangeEvent).toHaveBeenCalled();
      });

      it('should set properties after fetch', function () {
        expect(this.feature.get('cartodb_id')).toBe('12345');
        this.feature.fetch();
        expect(this.feature.get('cartodb_id')).toBe('3');
      });

      it('should listen changes after fetching successfully', function () {
        spyOn(this.feature, '_onChange');
        this.feature.fetch();
        this.feature.set('cartodb_id', 'hello');
        expect(this.feature._onChange).toHaveBeenCalled();
      });

      it('should add to changesHistory all changed attributes after fetching', function () {
        this.feature.fetch();
        this.feature.set('cartodb_id', 'hey');
        expect(this.feature._changesHistory).toEqual(['cartodb_id']);
        this.feature.set('the_geom', '{}');
        expect(this.feature._changesHistory).toEqual(['cartodb_id', 'the_geom']);
        this.feature.set('name', 'Barcelona');
        expect(this.feature._changesHistory).toEqual(['cartodb_id', 'the_geom', 'name']);
        this.feature.set('cartodb_id', '1');
        expect(this.feature._changesHistory).toEqual(['cartodb_id', 'the_geom', 'name']);
      });
    });
  });

  describe('.hasBeenChangedAfterLastSaved', function () {
    beforeEach(function () {
      this.feature._changesHistory = ['the_geom', 'cartodb_id'];
    });

    it('should return if an attribute has been changed before last saved', function () {
      expect(this.feature.hasBeenChangedAfterLastSaved('the_geom')).toBeTruthy();
      expect(this.feature.hasBeenChangedAfterLastSaved('name')).toBeFalsy();
      expect(this.feature.hasBeenChangedAfterLastSaved('cartodb_id')).toBeTruthy();
    });
  });

  describe('._cleanChangesHistory', function () {
    beforeEach(function () {
      this.feature._changesHistory = ['the_geom', 'cartodb_id'];
    });

    it('should clean changesHistory', function () {
      expect(this.feature.hasBeenChangedAfterLastSaved('the_geom')).toBeTruthy();
      expect(this.feature.hasBeenChangedAfterLastSaved('cartodb_id')).toBeTruthy();
      this.feature._cleanChangesHistory();
      expect(this.feature.hasBeenChangedAfterLastSaved('the_geom')).toBeFalsy();
      expect(this.feature.hasBeenChangedAfterLastSaved('cartodb_id')).toBeFalsy();
      expect(this.feature._changesHistory).toEqual([]);
    });
  });

  describe('.save', function () {
    beforeEach(function () {
      this.feature._changesHistory = ['the_geom'];
    });

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

      it('should clean changes history', function () {
        this.feature.save();
        expect(this.feature._changesHistory.length).toBe(0);
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

      it('should not clean changes history', function () {
        this.feature.save();
        expect(this.feature._changesHistory.length).toBe(1);
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
