var cdb = require('cartodb.js');
var CreateModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_model');
var MapTemplates = require('../../../../../../javascripts/cartodb/new_common/map_templates');


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

  it("should trigger events when local models change", function() {
    var changed = false;
    this.model.bind('change:mapTemplate', function() {
      changed = true;
    });
    this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
    expect(changed).toBeTruthy();

    // changed = false;
    // this.model.bind('change:selectedDatasets', function() {
    //   changed = true;
    // });
    // console.log("to be implemented");
    // expect(changed).toBeTruthy();
  });

  it("should clean mapTemplate when option changes", function() {
    this.model.set('option', 'templates');
    this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
    expect(this.model.get('option')).toBe('preview');
    this.model.set('option', 'templates');
    expect(_.isEmpty(this.model.get('mapTemplate'))).toBeTruthy();
  });

});
