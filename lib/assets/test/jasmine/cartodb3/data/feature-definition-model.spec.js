var _ = require('underscore');
var Backbone = require('backbone');
var FeatureDefinitionModel = require('../../../../javascripts/cartodb3/data/feature-definition-model');

describe('data/feature-definition-model', function () {
  beforeEach(function () {
    this.feature = new FeatureDefinitionModel({
      cartodb_id: '12345',
      name: 'Madrid',
      country: 'Spain'
    }, {
      configModel: {},
      layerDefinitionModel: {
        getColumnNamesFromSchema: function () {
          return ['name', 'country', 'the_geom'];
        }
      }
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
        this.feature.unset('cartodb_id');

        expect(this.feature.isNew()).toBeTruthy();

        this.fakeQueryRowModel.save.and.callFake(function (attrs, options) {
          attrs = _.extend(attrs, {
            cartodb_id: '56789'
          });
          options && options.success(new Backbone.Model(attrs));
        });

        this.feature.save();

        expect(this.feature.get('cartodb_id')).toEqual('56789');
      });

      it('should NOT update the cartodb_id of the feature when updating an existing row', function () {
        expect(this.feature.get('cartodb_id')).toEqual('12345');

        // Row is updated and it returns a different cartodb_id. This will never happen
        // in The Real World, but it helps in this test
        this.fakeQueryRowModel.save.and.callFake(function (attrs, options) {
          attrs = _.extend(attrs, {
            cartodb_id: '56789'
          });
          options && options.success(new Backbone.Model(attrs));
        });

        this.feature.save();

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
