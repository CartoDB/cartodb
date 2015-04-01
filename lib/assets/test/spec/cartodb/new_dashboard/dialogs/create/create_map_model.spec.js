var cdb = require('cartodb.js');
var CreateMapModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_map_model');
var ImportModel = require('../../../../../../javascripts/cartodb/new_common/import_model');

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

describe('new_dashboard/dialogs/create/create_map_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({ username: 'paco' });

    this.model = new CreateMapModel({
      selectedDatasets: [{ id: 'test', name: 'paco' }]
    }, {
      user: this.user
    });

    spyOn(this.model, '_checkCollection').and.callThrough();
  });

  it("should have default values", function() {
    expect(this.model.get('type')).toBeDefined();
    expect(this.model.get('currentImport')).toBeDefined();
    expect(this.model.get('tableIdsArray')).toBeDefined();
  });

  it("should start creating map", function() {
    this.model.start();
    expect(this.model._checkCollection).toHaveBeenCalled();
  });

  it("should raise an error if remote dataset validation fails", function() {
    var failedEvent = false;
    var importEvent = false;

    this.model.bind('importingRemote', function(){
      importEvent = true;
    });

    this.model.bind('importFailed', function(){
      failedEvent = true;
    });

    this.user.set('remaining_byte_quota', 1);
    this.model.set('selectedDatasets', [createRemoteData()])
    this.model.start();
    var importError = this.model.get('currentImport').getError();
    expect(failedEvent).toBeTruthy();
    expect(importEvent).toBeTruthy();
    expect(importError.error_code).toBe(8001);
    expect(this.model.get('tableIdsArray').length).toBe(0);
  });

  it("should generate a new map when all datasets are not remote type", function() {
    spyOn(cdb.admin.Visualization.prototype, 'save').and.callFake(function(attrs, opts){
      opts.success();
    });

    var called = false;

    this.model.bind('mapCreated', function() {
      called = true;
    });

    this.model.start();
    expect(this.model._checkCollection.calls.count()).toBe(2);
    expect(cdb.admin.Visualization.prototype.save).toHaveBeenCalled();
    expect(called).toBeTruthy();
  });

  it("should trigger an error event when map creation fails", function() {
    spyOn(cdb.admin.Visualization.prototype, 'save').and.callFake(function(attrs, opts){
      opts.error();
    });
    
    var called = false;

    this.model.bind('mapError', function() {
      called = true;
    });

    this.model.start();
    expect(this.model._checkCollection.calls.count()).toBe(2);
    expect(called).toBeTruthy();
  })

  it("should import remote datasets and then generate a new map", function() {
    var importCompletedEvent = false;
    this.user.set('remaining_byte_quota', 10000);

    spyOn(cdb.admin.Visualization.prototype, 'save').and.callFake(function(attrs, opts){
      opts.success();
    });

    spyOn(ImportModel.prototype, '_createRegularImport');
    this.model.bind('importCompleted', function() {
      importCompletedEvent = true;
    });

    this.model.set('selectedDatasets', [createRemoteData(), { id: 'hello', name: 'paco' }])
    this.model.start();
    var currentImport = this.model.get('currentImport');

    currentImport.imp.set('state', 'complete');
    expect(importCompletedEvent).toBeTruthy();
    expect(this.model._checkCollection.calls.count()).toBe(3);
    expect(this.model.get('tableIdsArray').length).toBe(2);
    expect(this.model.get('selectedDatasets').length).toBe(0);
    expect(this.model.get('currentImport')).toBe('');
  });

});
