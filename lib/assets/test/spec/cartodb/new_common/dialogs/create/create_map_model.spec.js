var cdb = require('cartodb.js');
var _ = require('underscore');
var CreateMapModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_map_model');
var ImportModel = require('../../../../../../javascripts/cartodb/new_common/background_importer/import_model');
var sharedForCreateViewModel = require('./shared_for_create_view_model');
var sharedForCreateListingViewModel = require('./shared_for_create_listing_view_model');
var sharedForCreateListingImportViewModel = require('./listing/shared_for_import_view_model');
var sharedForCreateFromScratchViewModel = require('./listing/shared_for_create_from_scratch_view_model');
var MapTemplates = require('../../../../../../javascripts/cartodb/new_common/map_templates');

function createRemoteData() {
  return {
    id: 'paco',
    name: 'title',
    type: 'remote',
    external_source: {
      size: 100
    },
    selected: true
  }
}

describe('new_common/dialogs/create/create_map_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'paco',
      base_url: 'http://url.com'
    });

    this.model = new CreateMapModel({
    }, {
      selectedDatasets: [{
        id: 'test',
        name: 'paco',
        selected: true
      }],
      user: this.user
    });
  });

  sharedForCreateViewModel.call(this);
  sharedForCreateListingViewModel.call(this);
  sharedForCreateListingImportViewModel.call(this);
  sharedForCreateFromScratchViewModel.call(this);

  it('should have default values', function() {
    expect(this.model.get('type')).toBeDefined();
    expect(this.model.get('currentImport')).toBeDefined();
    expect(this.model.get('tableIdsArray')).toBeDefined();
  });

  it('should define several local models', function() {
    expect(this.model.upload).toBeDefined();
    expect(this.model.mapTemplate).toBeDefined();
  });

  describe('.getMapTemplate', function() {
    it("should return current map template", function() {
      expect(this.model.getMapTemplate()).toBeDefined();
    });
  });

  describe('.setMapTemplate', function() {
    it('should set a map template', function() {
      expect(_.isEmpty(this.model.mapTemplate.attributes)).toBeTruthy();
      this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
      expect(_.isEmpty(this.model.mapTemplate.attributes)).toBeFalsy();
    });

    it("should trigger events when local models change", function() {
      this.model.bind('change:mapTemplate', function() {
        this.changed = true;
      }, this);

      this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
      expect(this.changed).toBeTruthy();
    });

    it('should clean mapTemplate when option changes', function() {
      this.model.set('option', 'templates');
      this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
      expect(this.model.get('option')).toBe('preview');

      this.model.set('option', 'templates');
      expect(_.isEmpty(this.model.get('mapTemplate'))).toBeTruthy();
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
        spyOn(cdb.admin.Visualization.prototype, 'save');
        this.model.bind('mapCreated', function() {
          this.mapCreated = true;
        }, this);
        this.model.bind('mapError', function() {
          this.mapCreateError = true;
        }, this);
        this.model.createMap();
      });

      it('should create the new map directly if save succeeds', function() {
        expect(cdb.admin.Visualization.prototype.save).toHaveBeenCalled();
        cdb.admin.Visualization.prototype.save.calls.argsFor(0)[1].success();
        expect(this.mapCreated).toBeTruthy();
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

        spyOn(cdb.admin.Visualization.prototype, 'save').and.callFake(function(attrs, opts){
          opts.success();
        });

        spyOn(ImportModel.prototype, '_createRegularImport');
        this.model.bind('importCompleted', function() {
          this.importCompletedEvent = true;
        }, this);

        this.model.collection.reset([createRemoteData(), { id: 'hello', name: 'paco', selected: true }])
        this.model.createMap();

        var currentImport = this.model.get('currentImport');
        currentImport.imp.set('state', 'complete');
      });

      it("should import the remote datasets and then generate a new map", function() {
        expect(this.importCompletedEvent).toBeTruthy();
        expect(this.model.get('tableIdsArray').length).toBe(2);
        expect(this.model.get('currentImport')).toBe('');
      });
    });
  });
});
