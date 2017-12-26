var LayerView = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/layer_view.js');
var LayerModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/layer_model.js');

describe('common/dialog/add_custom_basemap/wms/layer_view', function() {
  beforeEach(function() {
    this.model = new LayerModel({
    });
    this.baseLayers = new cdb.admin.UserLayers();
    this.view = new LayerView({
      model: this.model,
      baseLayers: this.baseLayers
    });
    this.view.render();
  });

  it('should render item title or name', function() {
    this.model.set('name', 'Roads');
    this.view.render();
    expect(this.innerHTML()).toContain('Roads');
    this.model.set('title', 'Title has prio');
    this.view.render();
    expect(this.innerHTML()).toContain('Title has prio');
  });

  it('should not disable any item by default', function() {
    expect(this.innerHTML).not.toContain('is-disabled');
  });

  describe('when can not save layer', function() {
    beforeEach(function() {
      this.model.set('title', 'Test');
      this.baseLayers.add({
        kind: 'wms',
        name: 'Test'
      });
      this.view.render();
    });

    it('should disable item', function() {
      expect(this.innerHTML()).toContain('is-disabled');
    });
  });

  describe('when clicking add this', function() {
    beforeEach(function() {
      spyOn(this.model, 'save');
      spyOn(this.model, 'canSave');
    });

    it('should call save on model only if can save', function() {
      this.model.canSave.and.returnValue(false);
      this.view.$('.js-add').click();
      expect(this.model.save).not.toHaveBeenCalled();

      this.model.canSave.and.returnValue(true);
      this.view.$('.js-add').click();
      expect(this.model.save).toHaveBeenCalled();
    });
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
