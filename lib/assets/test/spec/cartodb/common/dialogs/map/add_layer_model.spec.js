var AddLayerModel = require('../../../../../../javascripts/cartodb/common/dialogs/map/add_layer_model');
var sharedForCreateListingViewModel = require('../create/shared_for_create_listing_view_model');
var sharedForCreateListingImportViewModel = require('../create/listing/shared_for_import_view_model');

describe('common/dialogs/map/add_layer_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'https://carto.com'
    });

    this.map = jasmine.createSpyObj('cdb.admin.Map', ['addCartodbLayerFromTable']);
    this.vis = jasmine.createSpyObj('cdb.admin.Visualization', ['tableMetadata']);

    this.model = new AddLayerModel({
    }, {
      map: this.map,
      vis: this.vis,
      user: this.user
    });

  });

  sharedForCreateListingViewModel.call(this);
  sharedForCreateListingImportViewModel.call(this);

  it('should have listing as default content pane', function() {
    expect(this.model.get('contentPane')).toEqual('listing');
  });

  describe('.canFinish', function() {
    describe('when listing is import', function() {
      beforeEach(function() {
        spyOn(this.model.upload, 'isValidToUpload');
        this.model.set('listing', 'import');
      });

      it('should return true only if upload is valid', function() {
        expect(this.model.canFinish()).toBeFalsy();

        this.model.upload.isValidToUpload = function() { return true };
        expect(this.model.canFinish()).toBeTruthy();
      });
    });

    describe('when listing is datasets', function() {
      beforeEach(function() {
        this.model.set('listing', 'datasets');
      });

      it('should return true if there is at least one dataset selected', function() {
        expect(this.model.canFinish()).toBeFalsy();

        this.model.selectedDatasets.add({});
        expect(this.model.canFinish()).toBeTruthy();
      });
    });
  });

  describe('.canSelect', function() {
    beforeEach(function() {
      this.dataset = new cdb.core.Model({
        selected: false
      });
    });

    it('should return true only if there is dataset selected or if wanting to deselect', function() {
      expect(this.model.canSelect(this.dataset)).toBeTruthy();

      this.model.selectedDatasets.add({ selected: true });
      expect(this.model.canSelect(this.dataset)).toBeFalsy();

      this.dataset.set('selected', true);
      expect(this.model.canSelect(this.dataset)).toBeTruthy();
    });
  });

  describe('.finish', function() {
    describe('when an dataset is selected', function() {
      describe('when dataset is a remote one (from library)', function() {
        beforeEach(function() {
          cdb.god.bind('importByUploadData', function(data) {
            this.importByUploadData = data;
          }, this);

          this.model.collection.reset([{
            id: 'abc-123',
            type: 'remote',
            name: 'foobar',
            external_source: {
              size: 1024
            }
          }]);
          this.model.collection.at(0).set('selected', true);
          this.model.finish();
        });

        it('should trigger a importByUploadData event on the cdb.god event bus', function() {
          expect(this.importByUploadData).toBeTruthy();
        });

        it('should pass a metadata object with necessary data to import dataset', function() {
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ type: 'remote' }));
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ value: 'foobar' }));
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ remote_visualization_id: 'abc-123' }));
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ size: 1024 }));
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ create_vis: false }));
        });
      });

      describe('when dataset is not a remote one', function() {
        beforeEach(function() {
          this.model.bind('addLayerDone', function() {
            this.addLayerDoneCalled = true;
          }, this);

          this.map.layers = jasmine.createSpyObj('layers', ['saveLayers']);

          this.model.collection.reset([{
            table: {
              name: 'foobar_table'
            },
            type: 'table'
          }]);
          this.model.collection.at(0).set('selected', true);
          this.model.finish();
        });

        it('should create layer from dataset', function() {
          expect(this.map.addCartodbLayerFromTable).toHaveBeenCalled();
        });

        it('should create layer with expected params', function() {
          expect(this.map.addCartodbLayerFromTable.calls.argsFor(0)[0]).toEqual('foobar_table');
          expect(this.map.addCartodbLayerFromTable.calls.argsFor(0)[1]).toEqual('pepe');
          expect(this.map.addCartodbLayerFromTable.calls.argsFor(0)[2]).toEqual(jasmine.objectContaining({
            vis: this.vis
          }));
        });

        it('should change the content view setting', function() {
          expect(this.model.get('contentPane')).toEqual('addingNewLayer');
        });

        describe('when adding layer succeeds', function() {
          beforeEach(function() {
            expect(this.addLayerDoneCalled).toBeFalsy();
            this.map.addCartodbLayerFromTable.calls.argsFor(0)[2].success();
          });

          it('should trigger addLayerDone', function() {
            expect(this.addLayerDoneCalled).toBeTruthy();
          });

          it('should save layers', function() {
            expect(this.map.layers.saveLayers).toHaveBeenCalled();
          });
        });

        describe('when adding layer fails', function() {
          beforeEach(function() {
            this.map.addCartodbLayerFromTable.calls.argsFor(0)[2].error();
          });

          it('should change contentPane to addLayerFail', function() {
            expect(this.model.get('contentPane')).toEqual('addLayerFailed');
          });
        });
      });
    });

    describe('.createFromScratch', function() {
      beforeEach(function() {
        var self = this;
        spyOn(cdb.admin.CartoDBTableMetadata.prototype, 'save').and.callFake(function() {
          self.table = this;
          return this;
        });
        this.model.createFromScratch();
      });

      it('should change to loading state', function() {
        expect(this.model.get('contentPane')).toEqual('creatingFromScratch');
      });

      it('should save a new dataset table', function() {
        expect(cdb.admin.CartoDBTableMetadata.prototype.save).toHaveBeenCalled();
      });

      describe('when table is successfully created', function() {
        beforeEach(function() {
          this.table.set('name', 'name-just-for-testing-purposes', { silent: true });
          cdb.admin.CartoDBTableMetadata.prototype.save.calls.argsFor(0)[1].success();
        });

        it('should add the table as new layer', function() {
          expect(this.map.addCartodbLayerFromTable).toHaveBeenCalled();
          expect(this.map.addCartodbLayerFromTable).toHaveBeenCalledWith('name-just-for-testing-purposes', 'pepe', jasmine.any(Object));
        });
      });
    });

    describe('when an upload is set', function() {
      beforeEach(function() {
        cdb.god.bind('importByUploadData', function(d) {
          this.importByUploadData = d;
        }, this);
        this.model.set('listing', 'import');
        this.model.finish();
      });

      it('should call cdb.god importByUploadData with expected data', function() {
        expect(this.importByUploadData).toBeTruthy();
        expect(this.importByUploadData).toEqual(jasmine.objectContaining({ state: 'idle' }));
      });
    });
  });

  describe('when listing', function () {
    it('should detect which', function () {
      this.model.set('listing', 'import');
      expect(this.model._atImportPane()).toBe(true);

      this.model.set('listing', 'datasets');
      expect(this.model._atImportPane()).toBe(false);
      expect(this.model._atDatasetsPane()).toBe(true);

      this.model.set('listing', 'scratch');
      expect(this.model._atDatasetsPane()).toBe(false);
      expect(this.model._atScratchPane()).toBe(true);
    });

    it('should detect "twitter import pane"', function () {
      this.model.set('listing', 'import');

      this.model.set('activeImportPane', 'twitter');
      expect(this.model._atTwitterImportPane()).toBe(true);

      this.model.set('activeImportPane', '*whatever-else*');
      expect(this.model._atTwitterImportPane()).toBe(false);
    });

    describe('and deciding on togglers', function () {
      it('should decide to show "guessing toggler" if at import', function () {
        this.model.set('listing', 'import');
        expect(this.model.showGuessingToggler()).toBe(true);

        this.model.set('listing', 'datasets');
        expect(this.model.showGuessingToggler()).toBe(false);
      });

      it('should decide to show "privacy toggler" if at import (unless deprecated twitter)', function () {
        this.model.set('listing', 'import');

        this.model.set('activeImportPane', '*whatever-but-twitter*');
        expect(this.model.showPrivacyToggler()).toBe(true);

        this.model.set('activeImportPane', 'twitter');
        var spy = spyOn(this.user, 'hasOwnTwitterCredentials');
        spy.and.returnValue(true);
        expect(this.model.showPrivacyToggler()).toBe(true);

        spy.and.returnValue(false);
        expect(this.model.showPrivacyToggler()).toBe(false);
      });
    });
  });

});
