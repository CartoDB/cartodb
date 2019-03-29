var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var CreateMapModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');
var ImportModel = require('../../../../../../javascripts/cartodb/common/background_polling/models/import_model');
var sharedForCreateListingViewModel = require('./shared_for_create_listing_view_model');
var sharedForCreateListingImportViewModel = require('./listing/shared_for_import_view_model');

function createRemoteData() {
  return {
    id: 'paco',
    name: 'title',
    type: 'remote',
    external_source: {
      size: 100
    }
  }
}

describe('common/dialogs/create/create_map_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'paco',
      base_url: 'http://url.com'
    });

    this.model = new CreateMapModel({
    }, {
      user: this.user
    });
    this.model.collection.reset([{
      id: 'test',
      name: 'paco'
    }]);
    this.model.collection.at(0).set('selected', true);
  });

  sharedForCreateListingViewModel.call(this);
  sharedForCreateListingImportViewModel.call(this);

  it('should have default values', function() {
    expect(this.model.get('type')).toBeDefined();
    expect(this.model.get('currentImport')).toBeDefined();
    expect(this.model.get('tableIdsArray')).toBeDefined();
  });

  it('should define local models', function() {
    expect(this.model.upload).toBeDefined();
  });

  describe('.viewsReady', function() {
    describe('when given a set of pre-selected items', function() {
      beforeEach(function() {
        spyOn(CreateMapModel.prototype, 'createMap');
        spyOn(cdb.admin.Visualizations.prototype, 'fetch');

        this.model = new CreateMapModel({
        }, {
          selectedItems: [{
            foo: 'bar'
          }],
          user: this.user
        });

        this.model.viewsReady();
      });

      it('should create the map directly', function() {
        expect(CreateMapModel.prototype.createMap).toHaveBeenCalled();
      });

      it('should not fetch collection for new datasets', function() {
        expect(cdb.admin.Visualizations.prototype.fetch).not.toHaveBeenCalled();
      });
    });

  });

  describe('.createMap', function() {
    describe('when remote dataset validation fails', function() {
      beforeEach(function() {
        this.model.bind('importingRemote', function() {
          this.importEvent = true;
        }, this);
        this.model.bind('importFailed', function() {
          this.failedEvent = true;
        }, this);
        this.user.set('remaining_byte_quota', 1);
        this.model.collection.reset([createRemoteData()]);
        this.model.collection.at(0).set('selected', true);
        this.model.createMap();
      });

      it('should raise an error', function() {
        expect(this.failedEvent).toBeTruthy();
        expect(this.importEvent).toBeTruthy();

        var importError = this.model.get('currentImport').getError();
        expect(importError.error_code).toBe(8001);

        expect(this.model.get('tableIdsArray').length).toBe(0);
      });
    });

    describe('when selected non-remote datasets', function() {
      beforeEach(function() {
        var self = this;
        spyOn(cdb.admin.Visualization.prototype, 'save').and.callFake(function() {
          self.vis = this;
        });
        this.model.bind('mapError', function() {
          this.mapCreateError = true;
        }, this);
        this.model.createMap();
      });

      it('should create the new map directly if save succeeds', function() {
        expect(cdb.admin.Visualization.prototype.save).toHaveBeenCalled();
        var url = new cdb.common.MapUrl({ base_url: 'https://carto.com/user/pepe/viz/abc-123' });
        spyOn(this.vis, 'viewUrl').and.returnValue(url);
        spyOn(this.model, '_redirectTo');

        cdb.admin.Visualization.prototype.save.calls.argsFor(0)[1].success();
        expect(this.model._redirectTo).toHaveBeenCalled();
        expect(this.model._redirectTo).toHaveBeenCalledWith('https://carto.com/user/pepe/viz/abc-123/map');
      });

      it('should trigger an error event if save fails', function() {
        expect(cdb.admin.Visualization.prototype.save).toHaveBeenCalled();
        cdb.admin.Visualization.prototype.save.calls.argsFor(0)[1].error();
        expect(this.mapCreateError).toBeTruthy();
      });
    });

    describe('when selected remote datasets', function() {
      beforeEach(function() {
        this.user.set('remaining_byte_quota', 10000);

        var self = this;
        spyOn(cdb.admin.Visualization.prototype, 'save').and.callFake(function() {
          self.vis = this;
        });

        spyOn(ImportModel.prototype, '_createRegularImport');
        this.model.bind('importCompleted', function() {
          this.importCompletedEvent = true;
        }, this);

        this.model.selectedDatasets.reset();
        this.model.collection.reset([createRemoteData(), { id: 'hello', name: 'paco' }]);
        this.model.collection.at(0).set('selected', true);
        this.model.collection.at(1).set('selected', true);
        this.model.createMap();

        var currentImport = this.model.get('currentImport');
        currentImport.imp.set('state', 'complete');

        expect(cdb.admin.Visualization.prototype.save).toHaveBeenCalled();
        var url = new cdb.common.MapUrl({ base_url: 'https://carto.com/user/pepe/viz/abc-123' });
        spyOn(this.vis, 'viewUrl').and.returnValue(url);
        spyOn(this.model, '_redirectTo');
        cdb.admin.Visualization.prototype.save.calls.argsFor(0)[1].success();
      });

      it('should import the remote datasets and then generate a new map', function() {
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
