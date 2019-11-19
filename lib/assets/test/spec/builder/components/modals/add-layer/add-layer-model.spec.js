var Backbone = require('backbone');
var AddLayerModel = require('builder/components/modals/add-layer/add-layer-model');
var TableModel = require('builder/data/table-model');
var UserModel = require('builder/data/user-model');
var ConfigModel = require('builder/data/config-model');
var sharedForCreateListingViewModel = require('./shared-for-create-listing-view-model.spec.js');
var sharedForCreateListingImportViewModel = require('./shared-for-import-view-model.spec.js');
var UserActions = require('builder/data/user-actions');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');

describe('components/modals/add-layer/add-layer-model', function () {
  beforeEach(function () {
    jasmine.Ajax.install();

    spyOn(MetricsTracker, 'track');

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
    describe('when listing is upload', function () {
      beforeEach(function () {
        spyOn(this.model._uploadModel, 'isValidToUpload');
        this.model.set('listing', 'upload');
      });

      it('should return false if upload is not valid', function () {
        this.model._uploadModel.isValidToUpload = function () { return false; };
        expect(this.model.canFinish()).toBeFalsy();
      });

      it('should return true if upload is valid', function () {
        this.model._uploadModel.isValidToUpload = function () { return true; };
        expect(this.model.canFinish()).toBeTruthy();
      });
    });

    describe('when listing is import', function () {
      beforeEach(function () {
        spyOn(this.model._uploadModel, 'isValidToUpload');
        this.model.set('listing', 'import');
      });

      it('should return false if upload is not valid', function () {
        this.model._uploadModel.isValidToUpload = function () { return false; };
        expect(this.model.canFinish()).toBeFalsy();
      });

      it('should return true if upload is valid', function () {
        this.model._uploadModel.isValidToUpload = function () { return true; };
        expect(this.model.canFinish()).toBeTruthy();
      });
    });

    describe('when listing is datasets', function () {
      beforeEach(function () {
        this.model.set('listing', 'datasets');
      });

      it('should return false if there is not at least one dataset selected', function () {
        expect(this.model.canFinish()).toBeFalsy();
      });

      it('should return true if there is at least one dataset selected', function () {
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
            var createdModel = new Backbone.Model({ id: 'test' });
            expect(this.addLayerDoneCalled).toBeFalsy();
            this.userActions.createLayerFromTable.calls.argsFor(0)[1].success(createdModel);
          });

          it('should trigger addLayerDone', function () {
            expect(this.addLayerDoneCalled).toBeTruthy();
          });
        });

        describe('when adding layer fails', function () {
          beforeEach(function () {
            this.userActions.createLayerFromTable.calls.argsFor(0)[1].error({}, {
              responseText: '{"error": ["meh"]}'
            });
          });

          it('should change contentPane to addLayerFail', function () {
            expect(this.model.get('contentPane')).toEqual('addLayerFailed');
          });
        });

        describe('when table quota exceeded', function () {
          beforeEach(function () {
            this.userActions.createLayerFromTable.calls.argsFor(0)[1].error({}, {
              responseText: '{"errors": ["You have reached your table quota"]}'
            });
          });

          it('should change contentPane to datasetQuotaExceeded', function () {
            expect(this.model.get('contentPane')).toEqual('datasetQuotaExceeded');
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
        var spy = spyOn(this.userModel, 'hasOwnTwitterCredentials');
        spy.and.returnValue(true);
        expect(this.model.showPrivacyToggler()).toBe(true);

        spy.and.returnValue(false);
        expect(this.model.showPrivacyToggler()).toBe(false);
      });
    });
  });
});
