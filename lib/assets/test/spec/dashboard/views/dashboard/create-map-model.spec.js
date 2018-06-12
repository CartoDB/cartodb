const Backbone = require('backbone');
const CreateMapModel = require('dashboard/views/dashboard/create-map-model');
const ImportModel = require('builder/data/background-importer/import-model');
const UserModel = require('dashboard/data/user-model');
const VisualizationModel = require('dashboard/data/visualization-model');
const MapURLModel = require('dashboard/data/map-url-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');
const VisualizationsCollection = require('dashboard/data/visualizations-collection');
const BackgroundPollingView = require('dashboard/views/dashboard/background-polling/background-polling-view');
const sharedForCreateListingViewModel = require('./shared-for-create-listing-view-model');
const sharedForCreateListingImportViewModel = require('./listing/shared-for-import-view-model');

function createRemoteData () {
  return {
    id: 'paco',
    name: 'title',
    type: 'remote',
    external_source: {
      size: 100
    }
  };
}

describe('dashboard/views/dashboard/create-map-model', function () {
  beforeEach(function () {
    this.user = new UserModel({
      username: 'paco',
      base_url: 'http://url.com'
    });

    this.backgroundPollingView = new BackgroundPollingView({
      configModel: ConfigModelFixture,
      userModel: this.user,
      model: new Backbone.Model(),
      createVis: false
    });

    this.model = new CreateMapModel({}, {
      userModel: this.user,
      configModel: ConfigModelFixture,
      backgroundPollingView: this.backgroundPollingView
    });

    this.model.collection.reset([{
      id: 'test',
      name: 'paco'
    }]);
    this.model.collection.at(0).set('selected', true);
  });

  sharedForCreateListingViewModel.call(this);
  sharedForCreateListingImportViewModel.call(this);

  it('should have default values', function () {
    expect(this.model.get('type')).toBeDefined();
    expect(this.model.get('currentImport')).toBeDefined();
    expect(this.model.get('tableIdsArray')).toBeDefined();
  });

  it('should define local models', function () {
    expect(this.model.upload).toBeDefined();
  });

  describe('.viewsReady', function () {
    describe('when given a set of pre-selected items', function () {
      beforeEach(function () {
        spyOn(CreateMapModel.prototype, 'createMap');
        spyOn(VisualizationsCollection.prototype, 'fetch');

        this.model = new CreateMapModel({}, {
          selectedItems: [{
            id: 'test',
            foo: 'bar'
          }],
          userModel: this.user,
          configModel: ConfigModelFixture,
          backgroundPollingView: this.backgroundPollingView
        });

        this.model.viewsReady();
      });

      it('should create the map directly', function () {
        expect(CreateMapModel.prototype.createMap).toHaveBeenCalled();
      });

      it('should not fetch collection for new datasets', function () {
        expect(VisualizationsCollection.prototype.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('.createMap', function () {
    describe('when remote dataset validation fails', function () {
      beforeEach(function () {
        this.model.bind('importingRemote', function () {
          this.importEvent = true;
        }, this);
        this.model.bind('importFailed', function () {
          this.failedEvent = true;
        }, this);
        this.user.set('remaining_byte_quota', 1);
        this.model.collection.reset([createRemoteData()]);
        this.model.collection.at(0).set('selected', true);
        this.model.createMap();
      });

      it('should raise an error', function () {
        expect(this.failedEvent).toBeTruthy();
        expect(this.importEvent).toBeTruthy();

        var importError = this.model.get('currentImport').getError();
        expect(importError.errorCode).toBe(8001);

        expect(this.model.get('tableIdsArray').length).toBe(0);
      });
    });

    describe('when selected non-remote datasets', function () {
      beforeEach(function () {
        var self = this;
        spyOn(VisualizationModel.prototype, 'save').and.callFake(function () {
          self.vis = this;
        });
        this.model.bind('mapError', function () {
          this.mapCreateError = true;
        }, this);
        this.model.createMap();
      });

      it('should create the new map directly if save succeeds', function () {
        expect(VisualizationModel.prototype.save).toHaveBeenCalled();
        var url = new MapURLModel({ base_url: 'https://carto.com/user/pepe/viz/abc-123' });
        spyOn(this.vis, 'viewUrl').and.returnValue(url);
        spyOn(this.model, '_redirectTo');

        VisualizationModel.prototype.save.calls.argsFor(0)[1].success();
        expect(this.model._redirectTo).toHaveBeenCalled();
        expect(this.model._redirectTo).toHaveBeenCalledWith('https://carto.com/user/pepe/viz/abc-123/map');
      });

      it('should trigger an error event if save fails', function () {
        expect(VisualizationModel.prototype.save).toHaveBeenCalled();
        VisualizationModel.prototype.save.calls.argsFor(0)[1].error();
        expect(this.mapCreateError).toBeTruthy();
      });
    });

    describe('when selected remote datasets', function () {
      beforeEach(function () {
        this.user.set('remaining_byte_quota', 10000);

        var self = this;
        spyOn(VisualizationModel.prototype, 'save').and.callFake(function () {
          self.vis = this;
        });
        spyOn(ImportModel.prototype, '_createRegularImport');

        this.model.bind('importCompleted', function () {
          this.importCompletedEvent = true;
        }, this);

        this.model.selectedDatasets.reset();
        this.model.collection.reset([createRemoteData(), { id: 'hello', name: 'paco' }]);
        this.model.collection.at(0).set('selected', true);
        this.model.collection.at(1).set('selected', true);
        this.model.createMap();

        var currentImport = this.model.get('currentImport');
        currentImport._importModel.set('state', 'complete');

        expect(VisualizationModel.prototype.save).toHaveBeenCalled();
        var url = new MapURLModel({ base_url: 'https://carto.com/user/pepe/viz/abc-123' });
        spyOn(this.model.vis, 'viewUrl').and.returnValue(url);
        spyOn(this.model, '_redirectTo');
        VisualizationModel.prototype.save.calls.argsFor(0)[1].success();
      });

      it('should import the remote datasets and then generate a new map', function () {
        expect(this.importCompletedEvent).toBeTruthy();
        expect(this.model.get('tableIdsArray').length).toBe(2);
        expect(this.model.get('currentImport')).toBe('');
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

      this.model.set('option', 'listing.import.twitter');
      expect(this.model._atTwitterImportPane()).toBe(true);

      this.model.set('option', '*whatever-else*');
      expect(this.model._atTwitterImportPane()).toBe(false);
    });

    describe('and deciding on togglers', function () {
      it('should decide to show "guessing toggler" if at import', function () {
        this.model.set('listing', 'import');
        expect(this.model.showGuessingToggler()).toBe(true);

        this.model.set('listing', 'datasets');
        expect(this.model.showGuessingToggler()).toBe(true); // it seems to be the desired behaviour
      });

      it('should decide to show "privacy toggler" if at import (unless deprecated twitter)', function () {
        this.model.set('listing', 'import');

        this.model.set('option', '*whatever-but-twitter*');
        expect(this.model.showPrivacyToggler()).toBe(true);

        this.model.set('option', 'listing.import.twitter');
        var spy = spyOn(this.user, 'hasOwnTwitterCredentials');
        spy.and.returnValue(true);
        expect(this.model.showPrivacyToggler()).toBe(true);

        spy.and.returnValue(false);
        expect(this.model.showPrivacyToggler()).toBe(false);
      });
    });
  });
});
