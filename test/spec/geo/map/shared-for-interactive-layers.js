var _ = require('underscore');

module.exports = function (LayerModel) {
  var METHODS = [
    'hasInteraction',
    'isVisible',
    'getInteractiveColumnNames',
    'getName',
    'setDataProvider',
    'getDataProvider'
  ];

  _.each(METHODS, function (method) {
    it('should respond to .' + method, function () {
      var layer = new LayerModel();

      expect(typeof layer[method] === 'function').toBeTruthy();
    });
  });

  _.each(['visible', 'sql', 'cartocss', 'source'], function (attribute) {
    it("should reload the map when the '" + attribute + "' attribute has changed", function () {
      var attributes = {};
      var map = jasmine.createSpyObj('map', ['reload']);
      var layer = new LayerModel({
        id: 'layer1'
      }, {
        map: map
      });

      attributes[attribute] = 'a';
      layer.set(attributes);

      expect(map.reload).toHaveBeenCalledWith({ sourceLayerId: 'layer1' });
      map.reload.calls.reset();

      attributes[attribute] = 'b';
      layer.set(attributes);

      expect(map.reload).toHaveBeenCalledWith({ sourceLayerId: 'layer1' });
      map.reload.calls.reset();

      attributes[attribute] = 'b';
      layer.set(attributes);

      expect(map.reload).not.toHaveBeenCalled();
    });
  });
};
