var SelectLayerView = require('../../../../../../../javascripts/cartodb3/components/modals/add-basemap/wms/select-layer-view');

describe('editor/components/modals/add-basemap/wms/select-layer-view', function() {
  beforeEach(function() {
    this.view = new SelectLayerView();
    this.view.render();
  });

  describe('when there are a bunch of layers and some unavailable ones', function() {
    beforeEach(function() {
      this.model.get('layers').reset([{
        title: 'item #1'
      }, {
        title: 'item #2'
      }, {
        title: 'item #3'
      }, {
        title: 'item #4'
      }]);
      this.view.render();
    });

    it('should render the amount of layers', function() {
      expect(this.innerHTML()).toContain('4 layers found');
      expect(this.innerHTML()).toContain('3 layers available');
    });

    it('should render the individual items', function() {
      expect(this.innerHTML()).toContain('item #1');
      expect(this.innerHTML()).toContain('item #4');
    });

    it('should not have any leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when click back', function() {
    beforeEach(function() {
      this.view.$('.js-back').click();
    });

    it('should set current view to go back to enter URL', function() {
      expect(this.model.get('currentView')).toEqual('enterURL');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
