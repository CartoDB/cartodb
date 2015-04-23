var cdb = require('cartodb.js');
var CreateModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_model');
var MapTemplates = require('../../../../../../javascripts/cartodb/new_common/map_templates');
var ImportModel = require('../../../../../../javascripts/cartodb/new_common/import_model');


describe('new_dashboard/dialogs/create/create_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({ username: 'paco' });

    this.model = new CreateModel({}, { user: this.user });
  });

  it("should have default values", function() {
    expect(this.model.get('type')).toBeDefined();
    expect(this.model.get('option')).toBeDefined();
  });

  it("should define several local models", function() {
    expect(this.model.selectedDatasets).toBeDefined();
    expect(this.model.upload).toBeDefined();
    expect(this.model.mapTemplate).toBeDefined();
  });

  it("should return values from those local models", function() {
    expect(this.model.getUpload()).toBeDefined();
    expect(this.model.getMapTemplate()).toBeDefined();
    expect(this.model.getSelectedDatasets()).toBeDefined();
  });

  it("should set a map template", function() {
    expect(_.isEmpty(this.model.mapTemplate.attributes)).toBeTruthy();
    this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
    expect(_.isEmpty(this.model.mapTemplate.attributes)).toBeFalsy();
  });

  it("should omit create_vis parameter when upload model changes", function() {
    this.model.setUpload({ create_vis: 'hello', type_guessing: true });
    expect(this.model.upload.get('create_vis')).not.toBe('hello');
  });

  it("should trigger events when local models change", function() {
    var changed = false;
    this.model.bind('change:mapTemplate', function() {
      changed = true;
    });
    this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
    expect(changed).toBeTruthy();
  });

  it("should clean mapTemplate when option changes", function() {
    this.model.set('option', 'templates');
    this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
    expect(this.model.get('option')).toBe('preview');
    this.model.set('option', 'templates');
    expect(_.isEmpty(this.model.get('mapTemplate'))).toBeTruthy();
  });

  describe('new map', function() {

    beforeEach(function() {
      this.user.set('max_layers', 4);
      spyOn(ImportModel.prototype, '_createRegularImport');
      spyOn(ImportModel.prototype, 'pollCheck');
      spyOn(ImportModel.prototype, 'destroyCheck');

      spyOn(cdb.admin.Visualization.prototype, 'save');
    });

    it('should not create a map if there isn\'t any selected dataset', function() {
      this.model.createMap();
      expect(this.model.get('option')).not.toBe('loading');
    });

    it('should start generating new map', function() {
      this.model.addSelectedDataset({ id: 'hey', type: 'table' });
      this.model.createMap();
      expect(this.model.get('option')).toBe('loading');
    });

  })

  describe('new dataset', function() {

    it('should change state when dataset creation starts', function() {
      spyOn(cdb.admin.CartoDBTableMetadata.prototype, 'save');
      this.model.createDataset();
      expect(this.model.get('option')).toBe('loading');
    });

    it('should trigger datasetCreated when it is created', function() {
      spyOn(cdb.admin.CartoDBTableMetadata.prototype, 'save').and.callFake(function(a, opts){
        opts.success();
      });
      var called = false;
      this.model.bind('datasetCreated', function(){ called = true });
      this.model.createDataset();
      expect(called).toBeTruthy();
    });

    it('should trigger datasetError when it fails', function() {
      spyOn(cdb.admin.CartoDBTableMetadata.prototype, 'save').and.callFake(function(a, opts){
        opts.error();
      });
      var called = false;
      this.model.bind('datasetError', function(){ called = true });
      this.model.createDataset();
      expect(called).toBeTruthy();
    });

  })

});
