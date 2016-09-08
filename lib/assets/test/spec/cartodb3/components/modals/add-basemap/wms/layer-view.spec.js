var LayerView = require('../../../../../../../javascripts/cartodb3/components/modals/add-basemap/wms/layer-view');

describe('editor/components/modals/add-basemap/wms/layer-view', function() {
  beforeEach(function() {
    this.view = new LayerView();
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
