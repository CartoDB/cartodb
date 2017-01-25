var Backbone = require('backbone');
var AddLayerModel = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/add-layer-model');
var TableModel = require('../../../../../../javascripts/cartodb3/data/table-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var sharedForCreateListingViewModel = require('./shared-for-create-listing-view-model.spec.js');
var sharedForCreateListingImportViewModel = require('./shared-for-import-view-model.spec.js');
var UserActions = require('../../../../../../javascripts/cartodb3/data/user-actions');

describe('components/modals/add-layer/add-layer-model', function () {
  beforeEach(function () {
    jasmine.Ajax.install();

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var vizUrl = 'http(s)?://(.)+' + configModel.get('base_url') + '/api/v1/viz.*';
    jasmine.Ajax.stubRequest(new RegExp(vizUrl)).andReturn({
      status: 200
    });

    this.pollingModel = new Backbone.Model();

    this.userModel = new UserModel({
      username: 'pepe'
    }, {
      configModel: configModel
    });

    this.userActions = UserActions({
      userModel: this.userModel,
      analysisDefinitionNodesCollection: {},
      analysisDefinitionsCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    spyOn(this.userActions, 'createLayerFromTable');

    this.model = new AddLayerModel(null, {
      pollingModel: this.pollingModel,
      configModel: configModel,
      userModel: this.userModel,
      userActions: this.userActions
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
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
      this.dataset = new Backbone.Model({
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
      describe('when dataset is a remote one (from library)', function () {
        beforeEach(function () {
          this.pollingModel.bind('importByUploadData', function (data) {
            this.importByUploadData = data;
          }, this);

          this.model._tablesCollection.reset([{
            id: 'abc-123',
            type: 'remote',
            name: 'foobar',
            external_source: {
              size: 1024
            }
          }]);
          this.model._tablesCollection.at(0).set('selected', true);
          this.model.finish();
        });

        it('should trigger a importByUploadData event', function () {
          expect(this.importByUploadData).toBeTruthy();
        });

        it('should pass a metadata object with necessary data to import dataset', function () {
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ type: 'remote' }));
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ value: 'foobar' }));
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ remote_visualization_id: 'abc-123' }));
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ size: 1024 }));
          expect(this.importByUploadData).toEqual(jasmine.objectContaining({ create_vis: false }));
        });
      });

      describe('when dataset is not a remote one', function () {
        beforeEach(function () {
          this.model.bind('addLayerDone', function () {
            this.addLayerDoneCalled = true;
          }, this);

          this.model._tablesCollection.reset([{
            id: 'abc',
            type: 'table',
            name: 'paco',
            table: {
              name: 'tableName'
            }
          }]);
          this.model._tablesCollection.at(0).set('selected', true);
          this.model.finish();
        });

        it('should create layer from dataset', function () {
          expect(this.userActions.createLayerFromTable).toHaveBeenCalled();
        });

        it('should create layer with expected params', function () {
          var tableModel = this.userActions.createLayerFromTable.calls.argsFor(0)[0];
          expect(tableModel.get('name')).toBe('tableName');
        });

        it('should change the content view setting', function () {
          expect(this.model.get('contentPane')).toEqual('addingNewLayer');
        });

        describe('when adding layer succeeds', function () {
          beforeEach(function () {
            expect(this.addLayerDoneCalled).toBeFalsy();
            this.userActions.createLayerFromTable.calls.argsFor(0)[1].success();
          });

          it('should trigger addLayerDone', function () {
            expect(this.addLayerDoneCalled).toBeTruthy();
          });
        });

        describe('when adding layer fails', function () {
          beforeEach(function () {
            this.userActions.createLayerFromTable.calls.argsFor(0)[1].error();
          });

          it('should change contentPane to addLayerFail', function () {
            expect(this.model.get('contentPane')).toEqual('addLayerFailed');
          });
        });
      });
    });

    describe('.createFromScratch', function () {
      beforeEach(function () {
        spyOn(TableModel.prototype, 'save').and.callFake(function () {
          this.set('name', 'name-just-for-testing-purposes', { silent: true });
          return this;
        });
      });

      it('should change to loading state', function () {
        this.model.createFromScratch();
        expect(this.model.get('contentPane')).toEqual('creatingFromScratch');
      });

      it('should save a new dataset table', function () {
        this.model.createFromScratch();
        expect(TableModel.prototype.save).toHaveBeenCalled();
      });

      describe('when table is successfully created', function () {
        it('should add the table as new layer', function () {
          this.model.createFromScratch();
          TableModel.prototype.save.calls.argsFor(0)[1].success();

          expect(this.userActions.createLayerFromTable).toHaveBeenCalled();
          var tableModel = this.userActions.createLayerFromTable.calls.argsFor(0)[0];
          expect(tableModel.get('name')).toBe('name-just-for-testing-purposes');
        });
      });
    });

    describe('when an upload is set', function () {
      beforeEach(function () {
        this.pollingModel.bind('importByUploadData', function (d) {
          this.importByUploadData = d;
        }, this);
        this.model.set('listing', 'import');
        this.model.finish();
      });

      it('should call pollingModel importByUploadData with expected data', function () {
        expect(this.importByUploadData).toBeTruthy();
        expect(this.importByUploadData).toEqual(jasmine.objectContaining({ state: 'idle' }));
      });
    });
  });
});
