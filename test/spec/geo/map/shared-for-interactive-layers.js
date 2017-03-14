var _ = require('underscore');

module.exports = function (LayerModel) {
  var METHODS = [
    'isVisible',
    'getName',
    'setDataProvider',
    'getDataProvider'
  ];

  _.each(METHODS, function (method) {
    it('should respond to .' + method, function () {
      var layer = new LayerModel({}, { vis: this.vis });

      expect(typeof layer[method] === 'function').toBeTruthy();
    });
  });

  it('should have legends', function () {
    var legends = [
      { type: 'bubble', title: 'My Bubble Legend' },
      { type: 'category', title: 'My Category Legend' },
      { type: 'choropleth', title: 'My Choropleth Legend' },
      { type: 'custom', title: 'My Custom Legend' }
    ];

    var layer = new LayerModel({
      legends: legends
    }, { vis: this.vis });

    expect(layer.get('legends')).toBeUndefined();
    expect(layer.legends.bubble.get('title')).toEqual('My Bubble Legend');
    expect(layer.legends.category.get('title')).toEqual('My Category Legend');
    expect(layer.legends.choropleth.get('title')).toEqual('My Choropleth Legend');
    expect(layer.legends.custom.get('title')).toEqual('My Custom Legend');
  });
};
