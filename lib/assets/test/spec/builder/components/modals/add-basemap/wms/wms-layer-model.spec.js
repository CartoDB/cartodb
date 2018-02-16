var LayersCollection = require('builder/components/modals/add-basemap/wms/wms-layers-collection');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');
var WMSService = require('builder/data/wms-service');

describe('editor/components/modals/add-basemap/wms/wms-layer-model', function () {
  beforeEach(function () {
    this.wmsService = new WMSService();
    this.wmsLayersCollection = new LayersCollection(null, {
      wmsService: this.wmsService
    });

    this.wmsLayersCollection.reset([{}]);

    this.model = this.wmsLayersCollection.at(0);
  });

  it('should have idle state by default', function () {
    expect(this.model.get('state')).toEqual('idle');
  });

  describe('.createProxiedLayerOrCustomBaselayerModel', function () {
    beforeEach(function () {
      spyOn(this.model, 'save');
    });

    describe('when is a WMS resource', function () {
      beforeEach(function () {
        this.model.createProxiedLayerOrCustomBaselayerModel();
      });

      it('should change state to saving', function () {
        expect(this.model.get('state')).toEqual('saving');
      });

      it('should save the WMS model', function () {
        expect(this.model.save).toHaveBeenCalled();
      });

      describe('when save succeeds', function () {
        describe('when can create customBaselayerModel', function () {
          beforeEach(function () {
            this.customBaselayerModel = jasmine.createSpy('customBaselayerModel');
            spyOn(this.model, '_newProxiedBaselayerModel').and.returnValue(this.customBaselayerModel);
            this.model.save.calls.argsFor(0)[1].success();
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
            spyOn(this.model, '_newProxiedBaselayerModel').and.throwError('meh');
            this.model.save.calls.argsFor(0)[1].success();
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
          this.model.save.calls.argsFor(0)[1].error();
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

  describe('._newProxiedBaselayerModel', function () {
    it('should throw an error unless mapproxy id is present', function () {
      expect(function () {
        this.model._newProxiedBaselayerModel();
      }).toThrowError();
    });

    describe('when mapproxy id is present', function () {
      beforeEach(function () {
        this.model.set({
          mapproxy_id: 'abc123',
          attribution: 'attribution',
          name: 'tilelayer test',
          bounding_boxes: [1, 2, 3, 4]
        });
        this.proxiedBaselayerModel = this.model._newProxiedBaselayerModel();
      });

      it('should return a tilelayer object', function () {
        expect(this.proxiedBaselayerModel).toEqual(jasmine.any(CustomBaselayerModel));
      });

      it('should should have expected attrs on returned object', function () {
        expect(this.proxiedBaselayerModel.get('urlTemplate')).toMatch('/abc123/wmts/');
        expect(this.proxiedBaselayerModel.get('attribution')).toEqual('attribution');
        expect(this.proxiedBaselayerModel.get('maxZoom')).toEqual(21);
        expect(this.proxiedBaselayerModel.get('minZoom')).toEqual(0);
        expect(this.proxiedBaselayerModel.get('name')).toEqual('tilelayer test');
        expect(this.proxiedBaselayerModel.get('proxy')).toBeTruthy();
        expect(this.proxiedBaselayerModel.get('bounding_boxes')).toEqual([1, 2, 3, 4]);
      });
    });
  });
});
