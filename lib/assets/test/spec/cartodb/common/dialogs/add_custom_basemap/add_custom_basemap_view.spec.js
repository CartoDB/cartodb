var AddCustomBasemapView = require('../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/add_custom_basemap_view.js');
var AddCustomBasemapModel = require('../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/add_custom_basemap_model.js');
var Backbone = require('backbone-cdb-v3');

describe('common/dialog/add_custom_basemap/add_custom_basemap_view', function() {
  beforeEach(function() {
    spyOn(AddCustomBasemapModel.prototype, 'initialize').and.callThrough();
    this.map = new cdb.admin.Map();
    this.baseLayers = new Backbone.Collection({
      urlRoot: 'localhost/user/layers'
    });
    this.view = new AddCustomBasemapView({
      map: this.map,
      baseLayers: this.baseLayers
    });
    this.view.render();
  });

  it('should render the tabs', function() {
    expect(this.innerHTML()).toContain('XYZ');
  });

  it('should create view model with map and baselayers', function() {
    expect(AddCustomBasemapModel.prototype.initialize).toHaveBeenCalled();
    expect(AddCustomBasemapModel.prototype.initialize).toHaveBeenCalledWith(jasmine.objectContaining({ map: this.map }));
    expect(AddCustomBasemapModel.prototype.initialize).toHaveBeenCalledWith(jasmine.objectContaining({ baseLayers: this.baseLayers }));
  });

  it('should start on XYZ view', function() {
    expect(this.innerHTML()).toContain('Insert your XYZ URL');
  });

  it('should hilight the selected tab', function() {
    expect(this.innerHTML()).toMatch('name="xyz".*is-selected');
    expect(this.innerHTML()).not.toMatch('name="wms".*is-selected');
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when clicking on a tab', function() {
    beforeEach(function() {
      this.view.$('button[data-name="wms"]').click();
    });

    it('should change tab', function() {
      expect(this.innerHTML()).toContain('Insert your WMS/WMTS URL');
    });

    it('should highlight new tab', function() {
      expect(this.innerHTML()).toMatch('name="wms".*is-selected');
      expect(this.innerHTML()).not.toMatch('name="xyz".*is-selected');
    });
  });

  describe('when click OK', function() {
    beforeEach(function() {
      spyOn(this.view.model, 'canSaveBasemap').and.returnValue(true);
      spyOn(this.view.model, 'saveBasemap');
      this.view.$('.ok').click();
    });

    it('should save new basemap', function() {
      expect(this.view.model.saveBasemap).toHaveBeenCalled();
    });

    describe('when save succeeds', function() {
      beforeEach(function() {
        spyOn(this.view, 'close');
        this.view.model.set('currentView', 'saveDone');
      });

      it('should close view', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    describe('when save fails', function() {
      beforeEach(function() {
        this.view.model.set('currentView', 'saveFail');
      });

      it('should show an error explanation', function() {
        expect(this.innerHTML()).toContain('error');
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
