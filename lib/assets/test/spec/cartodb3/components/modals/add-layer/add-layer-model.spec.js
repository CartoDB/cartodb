var cdb = require('cartodb-deep-insights.js');
var AddLayerModel = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/add-layer-model');
var TableModel = require('../../../../../../javascripts/cartodb3/data/table-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var sharedForCreateListingViewModel = require('./shared-for-create-listing-view-model.spec.js');
var sharedForCreateListingImportViewModel = require('./shared-for-import-view-model.spec.js');

describe('components/modals/add-layer/add-layer-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({
      username: 'pepe'
    }, {
      configModel: configModel
    });

    this.visMap = jasmine.createSpyObj('visMap', ['addCartodbLayerFromTable']);
    this.visusalizationModel = jasmine.createSpyObj('VisualizationModel', ['tableMetadata']);

    this.model = new AddLayerModel(
      {},
      {
        visMap: this.visMap,
        configModel: configModel,
        userModel: this.userModel
      }
    );
  });

  sharedForCreateListingViewModel.call(this);
  sharedForCreateListingImportViewModel.call(this);

  it('should have listing as default content pane', function () {
    expect(this.model.get('contentPane')).toEqual('listing');
  });

  describe('.canFinish', function () {
    describe('when listing is import', function () {
      beforeEach(function () {
        spyOn(this.model._uploadModel, 'isValidToUpload');
        this.model.set('listing', 'import');
      });

      it('should return true only if upload is valid', function () {
        expect(this.model.canFinish()).toBeFalsy();

        this.model._uploadModel.isValidToUpload = function () { return true; };
        expect(this.model.canFinish()).toBeTruthy();
      });
    });

    describe('when listing is datasets', function () {
      beforeEach(function () {
        this.model.set('listing', 'datasets');
      });

      it('should return true if there is at least one dataset selected', function () {
        expect(this.model.canFinish()).toBeFalsy();

        this.model._selectedDatasetsCollection.add({});
        expect(this.model.canFinish()).toBeTruthy();
      });
    });
  });

  describe('.canSelect', function () {
    beforeEach(function () {
      this.dataset = new cdb.core.Model({
        selected: false
      });
    });

    it('should return true only if there is dataset selected or if wanting to deselect', function () {
      expect(this.model.canSelect(this.dataset)).toBeTruthy();

      this.model._selectedDatasetsCollection.add({ selected: true });
      expect(this.model.canSelect(this.dataset)).toBeFalsy();

      this.dataset.set('selected', true);
      expect(this.model.canSelect(this.dataset)).toBeTruthy();
    });
  });

  describe('.finish', function () {
    describe('when an dataset is selected', function () {
      // TBD!
      // describe('when dataset is a remote one (from library)', function() {
      //   beforeEach(function() {
      //     cdb.god.bind('importByUploadData', function(data) {
      //       this.importByUploadData = data;
      //     }, this);
      //
      //     this.model._tablesCollection.reset([{
      //       id: 'abc-123',
      //       type: 'remote',
      //       name: 'foobar',
      //       external_source: {
      //         size: 1024
      //       }
      //     }]);
      //     this.model._tablesCollection.at(0).set('selected', true);
      //     this.model.finish();
      //   });
      //
      //   it('should trigger a importByUploadData event on the cdb.god event bus', function() {
      //     expect(this.importByUploadData).toBeTruthy();
      //   });
      //
      //   it('should pass a metadata object with necessary data to import dataset', function() {
      //     expect(this.importByUploadData).toEqual(jasmine.objectContaining({ type: 'remote' }));
      //     expect(this.importByUploadData).toEqual(jasmine.objectContaining({ value: 'foobar' }));
      //     expect(this.importByUploadData).toEqual(jasmine.objectContaining({ remote_visualization_id: 'abc-123' }));
      //     expect(this.importByUploadData).toEqual(jasmine.objectContaining({ size: 1024 }));
      //     expect(this.importByUploadData).toEqual(jasmine.objectContaining({ create_vis: false }));
      //   });
      // });

      describe('when dataset is not a remote one', function () {
        beforeEach(function () {
          this.model.bind('addLayerDone', function () {
            this.addLayerDoneCalled = true;
          }, this);

          this.visMap.layers = jasmine.createSpyObj('layers', ['saveLayers']);

          this.model._tablesCollection.reset([{
            table: {
              name: 'foobar_table'
            },
            type: 'table',
            id: 'a'
          }]);
          this.model._tablesCollection.at(0).set('selected', true);
          this.model.finish();
        });

        // TBD!
        // it('should create layer from dataset', function() {
        //   expect(this.visMap.addCartodbLayerFromTable).toHaveBeenCalled();
        // });
        //
        // it('should create layer with expected params', function() {
        //   expect(this.visMap.addCartodbLayerFromTable.calls.argsFor(0)[0]).toEqual('foobar_table');
        //   expect(this.visMap.addCartodbLayerFromTable.calls.argsFor(0)[1]).toEqual('pepe');
        //   expect(this.visMap.addCartodbLayerFromTable.calls.argsFor(0)[2]).toEqual(jasmine.objectContaining({
        //     vis: this.vis
        //   }));
        // });

        it('should change the content view setting', function () {
          expect(this.model.get('contentPane')).toEqual('addingNewLayer');
        });

        // TBD!
        // describe('when adding layer succeeds', function() {
        //   beforeEach(function() {
        //     expect(this.addLayerDoneCalled).toBeFalsy();
        //     this.visMap.addCartodbLayerFromTable.calls.argsFor(0)[2].success();
        //   });
        //
        //   it('should trigger addLayerDone', function() {
        //     expect(this.addLayerDoneCalled).toBeTruthy();
        //   });
        //
        //   it('should save layers', function() {
        //     expect(this.map.layers.saveLayers).toHaveBeenCalled();
        //   });
        // });

      // describe('when adding layer fails', function() {
      //   beforeEach(function() {
      //     this.map.addCartodbLayerFromTable.calls.argsFor(0)[2].error();
      //   });
      //
      //   it('should change contentPane to addLayerFail', function() {
      //     expect(this.model.get('contentPane')).toEqual('addLayerFailed');
      //   });
      // });
      });
    });

    describe('.createFromScratch', function () {
      beforeEach(function () {
        var self = this;
        spyOn(TableModel.prototype, 'save').and.callFake(function () {
          self.table = this;
          return this;
        });
        this.model.createFromScratch();
      });

      it('should change to loading state', function () {
        expect(this.model.get('contentPane')).toEqual('creatingFromScratch');
      });

      it('should save a new dataset table', function () {
        expect(TableModel.prototype.save).toHaveBeenCalled();
      });

      describe('when table is successfully created', function () {
        beforeEach(function () {
          this.table.set('name', 'name-just-for-testing-purposes', { silent: true });
          TableModel.prototype.save.calls.argsFor(0)[1].success();
        });

      // TBD!
      // it('should add the table as new layer', function() {
      //   expect(this.map.addCartodbLayerFromTable).toHaveBeenCalled();
      //   expect(this.map.addCartodbLayerFromTable).toHaveBeenCalledWith('name-just-for-testing-purposes', 'pepe', jasmine.any(Object));
      // });
      });
    });

  // TBD!
  // describe('when an upload is set', function() {
  //   beforeEach(function() {
  //     cdb.god.bind('importByUploadData', function(d) {
  //       this.importByUploadData = d;
  //     }, this);
  //     this.model.set('listing', 'import');
  //     this.model.finish();
  //   });
  //
  //   it('should call cdb.god importByUploadData with expected data', function() {
  //     expect(this.importByUploadData).toBeTruthy();
  //     expect(this.importByUploadData).toEqual(jasmine.objectContaining({ state: 'idle' }));
  //   });
  // });
  });
});
