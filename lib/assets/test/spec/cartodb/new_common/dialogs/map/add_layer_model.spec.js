var AddLayerModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/map/add_layer_model');
var sharedForCreateListingViewModel = require('../create/shared_for_create_listing_view_model');
var sharedForCreateListingImportViewModel = require('../create/listing/shared_for_import_view_model');
var sharedForCreateFromScratchViewModel = require('../create/listing/shared_for_create_from_scratch_view_model');

describe('new_common/dialogs/map/add_layer_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://cartodb.com'
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
  sharedForCreateFromScratchViewModel.call(this);

  it('should have listing as default content pane', function() {
    expect(this.model.get('contentPane')).toEqual('listing');
  });

  describe('when an dataset is selected', function() {
    describe('when dataset is not a remote one', function() {
      beforeEach(function() {
        this.model.bind('addingLayer', function() {
          this.addingLayerCalled = true;
        }, this);
        this.model.bind('addLayerDone', function() {
          this.addLayerDoneCalled = true;
        }, this);
        this.model.bind('addLayerFail', function() {
          this.addLayerFailCalled = true;
        }, this);

        this.map.layers = jasmine.createSpyObj('layers', ['saveLayers']);

        this.model.collection.reset([{
          table: {
            name: 'foobar_table'
          },
          type: 'table'
        }]);
        this.model.collection.at(0).set('selected', true);
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
        expect(this.model.get('contentPane')).toEqual('addingLayer');
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
          expect(this.addLayerFailCalled).toBeFalsy();
          this.map.addCartodbLayerFromTable.calls.argsFor(0)[2].error();
        });

        it('should trigger addLayerFail', function() {
          expect(this.addLayerFailCalled).toBeTruthy();
        });

      });
    });
  });
});
