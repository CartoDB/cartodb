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
};
