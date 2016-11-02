var FeatureDefinitionModel = require('../../../../javascripts/cartodb3/data/feature-definition-model');

describe('data/feature-definition-model', function () {
  beforeEach(function () {
    this.feature = new FeatureDefinitionModel({
      id: '0123456789'
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
          options && options.success({
            toJSON: function () {
              return {
                id: '0123456789',
                name: 'Madrid',
                country: 'Spain'
              };
            }
          });
        });
      });

      it('should invoke the success callback', function () {
        var successCallback = jasmine.createSpy('successCallback');
        this.feature.save({
          success: successCallback
        });

        expect(successCallback).toHaveBeenCalled();
      });

      it('should update the feature', function () {
        this.feature.save();

        expect(this.feature.toJSON()).toEqual({
          id: '0123456789',
          name: 'Madrid',
          country: 'Spain'
        });
      });

      it('should trigger a save event', function () {
        var saveCallback = jasmine.createSpy('save');
        this.feature.on('save', saveCallback);

        this.feature.save();

        expect(saveCallback).toHaveBeenCalled();
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
