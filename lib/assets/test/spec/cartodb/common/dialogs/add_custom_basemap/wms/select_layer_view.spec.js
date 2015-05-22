var SelectLayerView = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/select_layer_view.js');
var WMSViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/wms_model.js');

describe('common/dialog/add_custom_basemap/wms/select_layer_view', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new WMSViewModel({
      baseLayers: this.baseLayers
    });
    this.view = new SelectLayerView({
      model: this.model
    });
    this.view.render();
  });

  describe('when there are a bunch of layers and some unavailable ones', function() {
    beforeEach(function() {
      this.model.get('layers').reset([{
        name: 'item #1'
      }, {
        name: 'item #2'
      }, {
        name: 'item #3'
      }, {
        name: 'item #4'
      }]);
      this.view.render();
    });

    it('should render the amount of layers', function() {
      expect(this.innerHTML()).toContain('4 available layers found');
    });

    it('should render the individual items', function() {
      expect(this.innerHTML()).toContain('item #1');
      expect(this.innerHTML()).toContain('item #4');
    });

    it('should not have any leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
