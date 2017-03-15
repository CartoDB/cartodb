var Backbone = require('backbone');
var LeafletLayerView = require('../../../../src/geo/leaflet/leaflet-layer-view');

LeafletLayerView.prototype._createLeafletLayer = function () {
  return jasmine.createSpyObj('leafletLayer', ['redraw']);
};

describe('leaflet-layer-view', function () {
  beforeEach(function () {
    this.layerModel = new Backbone.Model();
    spyOn(this.layerModel, 'bind');
    spyOn(this.layerModel, 'unbind');
    this.leafletMap = jasmine.createSpyObj('leafletMap', ['removeLayer']);
    this.layerView = new LeafletLayerView(this.layerModel, this.leafletMap);
    this.leafletLayer = this.layerView.leafletLayer;
  });

  it('should have a model change binding', function () {
    expect(this.layerModel.bind).toHaveBeenCalledWith('change', this.layerView._modelUpdated, this.layerView);
  });

  describe('.remove', function () {
    beforeEach(function () {
      spyOn(this.layerView, 'trigger');
      spyOn(this.layerView, 'unbind');
      this.layerView.remove();
    });

    it('should remove layer from leaflet map', function () {
      expect(this.leafletMap.removeLayer).toHaveBeenCalledWith(this.leafletLayer);
    });

    it('should trigger remove event', function () {
      expect(this.layerView.trigger).toHaveBeenCalledWith('remove', this.layerView);
    });

    it('should unbind', function () {
      expect(this.layerModel.unbind).toHaveBeenCalledWith(null, null, this.layerView);
      expect(this.layerView.unbind).toHaveBeenCalled();
    });
  });

  describe('.reload', function () {
    beforeEach(function () {
      this.layerView.reload();
    });

    it('should redraw map', function () {
      expect(this.leafletLayer.redraw).toHaveBeenCalled();
    });
  });
});
