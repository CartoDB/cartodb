var LayersCollection = require('../../../../../../../javascripts/cartodb3/components/modals/add-basemap/wms/layers-collection');
var CustomBaselayerModel = require('../../../../../../../javascripts/cartodb3/data/custom-baselayer-model');

describe('editor/components/modals/add-basemap/wms/layer-model', function () {
  beforeEach(function () {
    // Create model from collection, like how its done in WMS view:
    this.layers = new LayersCollection();
    this.layers.url = 'WMS URL';
    this.llbbox = [86.85898, 27.92944, 86.991206, 28.044717];
    this.layers.reset([{
      llbbox: this.llbbox,
      matrix_sets: ['GoogleMapsCompatible'],
      name: 'everest',
      title: 'Everest_04262015_R2C2_Fotor',
      srs: 'srs val',
      layer: 'layer val'
    }]);
    this.model = this.layers.at(0);
  });

  it('should have idle state by default', function () {
    expect(this.model.get('state')).toEqual('idle');
  });

  describe('::supportedMatrixSets', function() {
    it('should return a subset of the supported matrix sets (used for a WMTS result)', function() {
      expect(this.model._supportedMatrixSets(['foo', 'bar', 'EPSG:4258', 'baz', 'EPSG:4326'])).toEqual(['EPSG:4258', 'EPSG:4326']);
    });

    it('should return empty results for empty or missing input', function() {
      expect(this.model._supportedMatrixSets()).toEqual([]);
      expect(this.model._supportedMatrixSets([])).toEqual([]);
    });
  });

  describe('.createProxiedLayerOrCustomBaselayerModel', function () {
    beforeEach(function () {
      this.wms = new this.model.WMSServiceModel();
      spyOn(this.wms, 'save');
      var self = this;
      spyOn(this.model, 'WMSServiceModel').and.callFake(function () {
        return self.wms;
      });
    });

    describe('when is a WMS resource', function () {
      beforeEach(function () {
        this.model.createProxiedLayerOrCustomBaselayerModel();
      });

      it('should change state to saving', function () {
        expect(this.model.get('state')).toEqual('saving');
      });

      it('should create a WMS Service model w/ URL defined on layers collection the model belongs to', function () {
        expect(this.model.WMSServiceModel.calls.argsFor(0)[0].wms_url).toEqual('WMS URL');
      });

      it('should create a WMS Service model from given this models attributes', function () {
        var attrs = this.model.WMSServiceModel.calls.argsFor(0)[0];
        expect(attrs).toEqual(jasmine.objectContaining({ title: 'Everest_04262015_R2C2_Fotor' }));
        expect(attrs).toEqual(jasmine.objectContaining({ name: 'everest' }));
        expect(attrs).toEqual(jasmine.objectContaining({ layer: 'everest' }));
        expect(attrs).toEqual(jasmine.objectContaining({ srs: 'srs val' }));
        expect(attrs).toEqual(jasmine.objectContaining({ bounding_boxes: this.llbbox }));
      });

      it('should save the WMS model', function () {
        expect(this.wms.save).toHaveBeenCalled();
      });

      describe('when save succeeds', function () {
        beforeEach(function () {
          this.newModel = new this.model.WMSServiceModel();
        });

        describe('when can create customBaselayerModel', function () {
          beforeEach(function () {
            this.customBaselayerModel = jasmine.createSpy('customBaselayerModel');
            spyOn(this.newModel, 'newCustomBaselayerModel').and.returnValue(this.customBaselayerModel);
            this.wms.save.calls.argsFor(0)[1].success(this.newModel);
          });

          it('should create a new tile layer', function () {
            expect(this.model.get('customBaselayerModel')).toBe(this.customBaselayerModel);
          });

          it('should set state to saveDone', function () {
            expect(this.model.get('state')).toEqual('saveDone');
          });
        });

        describe('when could not create customBaselayerModel', function () {
          beforeEach(function () {
            spyOn(this.newModel, 'newCustomBaselayerModel').and.throwError('meh');
            this.wms.save.calls.argsFor(0)[1].success(this.newModel);
          });

          it('should not have any customBaselayerModel set', function () {
            expect(this.model.get('customBaselayerModel')).toBeUndefined();
          });

          it('should set state to saveDone', function () {
            expect(this.model.get('state')).toEqual('saveFail');
          });
        });
      });

      describe('when save fails', function () {
        beforeEach(function () {
          this.wms.save.calls.argsFor(0)[1].error();
        });

        it('should set state to saveFail', function () {
          expect(this.model.get('state')).toEqual('saveFail');
        });
      });
    });

    describe('when is a WMTS resource with unsupported matrix set (e.g. GoogleMapsCompatible)', function () {
      beforeEach(function () {
        this.model.set({
          type: 'wmts',
          url_template: 'http://foo.com/bar/%%(z)s/%%(x)s/%%(y)s.png',
          matrix_sets: ['GoogleMapsCompatible']
        });
        spyOn(this.model, '_byCustomURL').and.callThrough();
        this.model.createProxiedLayerOrCustomBaselayerModel();
      });

      it('should create the tile layer with a proper XYZ URL', function () {
        expect(this.model._byCustomURL).toHaveBeenCalled();
        expect(this.model._byCustomURL.calls.argsFor(0)[0]).toEqual('http://foo.com/bar/{z}/{x}/{y}.png');
      });

      it('should return a tile layer directly instead', function () {
        expect(this.model.get('customBaselayerModel') instanceof CustomBaselayerModel).toBeTruthy();
      });

      it('should set saveDone', function () {
        expect(this.model.get('state')).toEqual('saveDone');
      });
    });
  });
});
