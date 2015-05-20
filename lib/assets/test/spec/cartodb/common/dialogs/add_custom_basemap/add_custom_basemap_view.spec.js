var AddCustomBasemapView = require('../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/add_custom_basemap_view.js');
var AddCustomBasemapModel = require('../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/add_custom_basemap_model.js');
var Backbone = require('backbone');
var $ = require('jquery');

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
    expect(this.innerHTML()).toContain('js-xyz is-selected');
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when click OK', function() {
    beforeEach(function() {
      this.layer = new cdb.admin.TileLayer();
      this.deferred = $.Deferred();
      spyOn(this.layer, 'save').and.returnValue(this.deferred);
      this.view.model.activeTabModel().set({
        layer: this.layer
      });
      spyOn(this.view.model, 'saveLayer').and.callThrough();
      spyOn(this.view, 'close');
      this.view.$('.ok').click();
    });

    it('should save layer', function() {
      expect(this.view.model.saveLayer).toHaveBeenCalled();
      expect(this.view.model.saveLayer.calls.argsFor(0)[0]).toEqual(this.layer);
      expect(this.view.model.saveLayer.calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({
        success: jasmine.any(Function),
        error: jasmine.any(Function)
      }));
      expect(this.layer.save).toHaveBeenCalled();
    });

    it('should show saving…', function() {
      expect(this.innerHTML()).toContain('Setting basemap…');
    });

    it('should only save once', function() {
      this.view.$('.ok').click();
      expect(this.view.model.saveLayer.calls.count()).toEqual(1);
    });

    describe('when save succeeds', function() {
      beforeEach(function() {
        this.deferred.resolveWith();
      });

      it('should close view', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    describe('when save fails', function() {
      beforeEach(function() {
        this.deferred.reject();
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
