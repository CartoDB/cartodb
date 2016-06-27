var cdb = require('cartodb.js-v3');
var LayersCollection = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/layers_collection.js');

describe('common/dialog/add_custom_basemap/wms/layer_model', function() {
  beforeEach(function() {
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

  it('should have idle state by default', function() {
    expect(this.model.get('state')).toEqual('idle');
  });

  describe('.save', function() {
    beforeEach(function() {
      this.statsSpy = jasmine.createSpy('stats');
      cdb.god.bind('metrics', this.statsSpy);
      this.wms = new cdb.admin.WMSService();
      spyOn(this.wms, 'save');
      var self = this;
      spyOn(cdb.admin, 'WMSService').and.callFake(function() {
        return self.wms;
      });
    });

    describe('when is a WMS resource', function() {
      beforeEach(function() {
        this.model.save();
      });

      it('should change state to saving', function() {
        expect(this.model.get('state')).toEqual('saving');
      });

      it('should create a WMS Service model w/ URL defined on layers collection the model belongs to', function() {
        expect(cdb.admin.WMSService.calls.argsFor(0)[0].wms_url).toEqual('WMS URL');
      });

      it('should create a WMS Service model from given this models attributes', function() {
        var attrs = cdb.admin.WMSService.calls.argsFor(0)[0];
        expect(attrs).toEqual(jasmine.objectContaining({ title: 'Everest_04262015_R2C2_Fotor' }));
        expect(attrs).toEqual(jasmine.objectContaining({ name: 'everest' }));
        expect(attrs).toEqual(jasmine.objectContaining({ layer: 'everest' }));
        expect(attrs).toEqual(jasmine.objectContaining({ srs: 'srs val' }));
        expect(attrs).toEqual(jasmine.objectContaining({ bounding_boxes: this.llbbox }));
      });

      it('should trigger stats', function() {
        expect(this.statsSpy).toHaveBeenCalled();
        expect(this.statsSpy.calls.argsFor(0)[0]).toEqual('select_wms');
      });

      it('should save the WMS model', function() {
        expect(this.wms.save).toHaveBeenCalled();
      });

      describe('when save succeeds', function() {
        beforeEach(function() {
          this.newModel = new cdb.admin.WMSService();
        });

        describe('when can create tilelayer', function() {
          beforeEach(function() {
            this.tileLayer = jasmine.createSpy('tilelayer')
            spyOn(this.newModel, 'newTileLayer').and.returnValue(this.tileLayer);
            this.wms.save.calls.argsFor(0)[1].success(this.newModel);
          });

          it('should create a new tile layer', function() {
            expect(this.model.get('tileLayer')).toBe(this.tileLayer);
          });

          it('should set state to saveDone', function() {
            expect(this.model.get('state')).toEqual('saveDone');
          });
        });

        describe('when could not create tilelayer', function() {
          beforeEach(function() {
            spyOn(this.newModel, 'newTileLayer').and.throwError('meh');
            this.wms.save.calls.argsFor(0)[1].success(this.newModel);
          });

          it('should not have any tilelayer set', function() {
            expect(this.model.get('tileLayer')).toBeUndefined();
          });

          it('should set state to saveDone', function() {
            expect(this.model.get('state')).toEqual('saveFail');
          });
        });
      });

      describe('when save fails', function() {
        beforeEach(function() {
          this.wms.save.calls.argsFor(0)[1].error();
        });

        it('should set state to saveFail', function() {
          expect(this.model.get('state')).toEqual('saveFail');
        });
      });
    });

    describe('when is a WMTS resource with unsupported matrix set (e.g. GoogleMapsCompatible)', function() {
      beforeEach(function() {
        this.model.set({
          type: 'wmts',
          url_template: 'http://foo.com/bar/%%(z)s/%%(x)s/%%(y)s.png',
          matrix_sets: ['GoogleMapsCompatible']
        });
        spyOn(cdb.admin.TileLayer, 'byCustomURL').and.callThrough();
        this.model.save();
      });

      it('should create the tile layer with a proper XYZ URL', function() {
        expect(cdb.admin.TileLayer.byCustomURL).toHaveBeenCalled();
        expect(cdb.admin.TileLayer.byCustomURL.calls.argsFor(0)[0]).toEqual('http://foo.com/bar/{z}/{x}/{y}.png');
      });

      it('should return a tile layer directly instead', function() {
        expect(this.model.get('tileLayer') instanceof cdb.admin.TileLayer).toBeTruthy();
      });

      it('should set saveDone', function() {
        expect(this.model.get('state')).toEqual('saveDone');
      });
    });
  });
});
