var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var AddCustomBasemapModel = require('../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/add_custom_basemap_model.js');

describe('common/dialog/add_custom_basemap/add_custom_basemap_model', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.map = jasmine.createSpyObj('map', ['setBounds', 'changeProvider']);
    this.model = new AddCustomBasemapModel({
      map: this.map,
      baseLayers: this.baseLayers
    });
  });

  it('should start with tabs for current view', function() {
    expect(this.model.get('currentView')).toEqual('tabs');
  });

  it('should start on XYZ tab', function() {
    expect(this.model.get('currentTab')).toEqual('xyz');
  });

  describe('.activeTabModel', function() {
    it('should return the model for current tab', function() {
      expect(this.model.activeTabModel()).toEqual(jasmine.any(Object));
    });
  });

  describe('.canSaveBasemap', function() {
    it('should return true if there is a layer set on current tab model and is not processing something', function() {
      expect(this.model.canSaveBasemap()).toBeFalsy();

      this.model.activeTabModel().set('layer', {});
      expect(this.model.canSaveBasemap()).toBeTruthy();

      this.model.set('currentView', 'not tabs');
      expect(this.model.canSaveBasemap()).toBeFalsy();
    });
  });

  describe('.saveBasemap', function() {
    beforeEach(function() {
      this.layer = new cdb.admin.TileLayer({
        bounding_boxes: [1, 2, 3, 4]
      });
      this.deferred = $.Deferred();
      spyOn(this.layer, 'save').and.returnValue(this.deferred);
      this.model.activeTabModel().set('layer', this.layer);
    });

    describe('when layer has already been added', function() {
      beforeEach(function() {
        this.baseLayers.add(this.layer);
        spyOn(this.model.activeTabModel(), 'hasAlreadyAddedLayer').and.returnValue(true);
        this.model.saveBasemap();
      });

      it('should call hasAlreadyAddedLayer with baseLayers', function() {
        expect(this.model.activeTabModel().hasAlreadyAddedLayer).toHaveBeenCalled();
        expect(this.model.activeTabModel().hasAlreadyAddedLayer).toHaveBeenCalledWith(this.baseLayers);
      });

      it('should change provider of map', function() {
        expect(this.map.changeProvider).toHaveBeenCalled();
        expect(this.map.changeProvider.calls.argsFor(0)[0]).toEqual('leaflet');
        expect(this.map.changeProvider.calls.argsFor(0)[1] instanceof cdb.admin.TileLayer).toBeTruthy();
        expect(this.map.changeProvider.calls.argsFor(0)[1]).not.toBe(this.layer); // the clone
        expect(this.map.changeProvider.calls.argsFor(0)[1].get('id')).toBeUndefined();
      });

      it('should set bounding box on map', function() {
        expect(this.map.setBounds).toHaveBeenCalled();
        expect(this.map.setBounds.calls.argsFor(0)[0]).toEqual([[2, 1], [4, 3]]);
      });

      it('should set current view to done', function() {
        expect(this.model.get('currentView')).toEqual('saveDone');
      });
    });

    describe('when layer is new', function() {
      beforeEach(function() {
        this.model.saveBasemap();
      });

      it('should add layer to baselayers', function() {
        expect(this.baseLayers.contains(this.layer)).toBeTruthy();
      });

      it('should call save on layer', function() {
        expect(this.layer.save).toHaveBeenCalled();
      });

      describe('when save succeeds', function() {
        beforeEach(function() {
          // fake id set
          this.layer.set('id', 'abc-123', { silent: true });
          this.deferred.resolve();
        });

        it('should change provider of map', function() {
          expect(this.map.changeProvider).toHaveBeenCalled();
          expect(this.map.changeProvider.calls.argsFor(0)[0]).toEqual('leaflet');
          expect(this.map.changeProvider.calls.argsFor(0)[1] instanceof cdb.admin.TileLayer).toBeTruthy();
          expect(this.map.changeProvider.calls.argsFor(0)[1]).not.toBe(this.layer); // the clone
          expect(this.map.changeProvider.calls.argsFor(0)[1].get('id')).toBeUndefined();
        });

        it('should set bounding box on map', function() {
          expect(this.map.setBounds).toHaveBeenCalled();
          expect(this.map.setBounds.calls.argsFor(0)[0]).toEqual([[2, 1], [4, 3]]);
        });

        it('should set current view to done', function() {
          expect(this.model.get('currentView')).toEqual('saveDone');
        });
      });

      describe('when save fails', function() {
        beforeEach(function() {
          this.deferred.reject();
        });

        it('should remove layer from baselayers', function() {
          expect(this.baseLayers.contains(this.layer)).toBeFalsy();
        });

        it('should set current view to ', function() {
          expect(this.model.get('currentView')).toEqual('saveFail');
        });
      });
    });
  });
});
