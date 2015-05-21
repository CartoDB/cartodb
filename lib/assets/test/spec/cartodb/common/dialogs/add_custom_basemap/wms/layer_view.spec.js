var LayerView = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/layer_view.js');
var LayerModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/layer_model.js');

describe('common/dialog/add_custom_basemap/wms/layer_view', function() {
  beforeEach(function() {
    this.model = new LayerModel({
    });
    this.view = new LayerView({
      model: this.model
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

  describe('when clicking add this', function() {
    beforeEach(function() {
      spyOn(this.model, 'save');
      this.view.$('.js-add').click();
    });

    it('should call save on model', function() {
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
