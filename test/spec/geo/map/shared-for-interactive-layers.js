var _ = require('underscore');
var fakeFactory = require('../../../helpers/fakeFactory');

module.exports = function (LayerModel) {
  var layer;
  var source;
  var vis;

  beforeEach(function () {
    source = fakeFactory.createAnalysisModel({ id: 'a0' });
    vis = fakeFactory.createVisModel();
    layer = new LayerModel({
      source: source
    }, { vis: vis });
  });

  var METHODS = [
    'isVisible',
    'getName'
  ];

  _.each(METHODS, function (method) {
    it('should respond to .' + method, function () {
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
    }, { vis: vis });

    expect(layer.get('legends')).toBeUndefined();
    expect(layer.legends.bubble.get('title')).toEqual('My Bubble Legend');
    expect(layer.legends.category.get('title')).toEqual('My Category Legend');
    expect(layer.legends.choropleth.get('title')).toEqual('My Choropleth Legend');
    expect(layer.legends.custom.get('title')).toEqual('My Custom Legend');
  });

  describe('.update', function () {
    it('should allow a string as parameter (deprecated: keep this only for prevent breaking changes in the api)', function () {
      var newSource = fakeFactory.createAnalysisModel({ id: 'a1' });
      vis.analysis = {
        findNodeById: function (nodeId) {
          if (nodeId === source.id) {
            return source;
          }
          if (nodeId === newSource.id) {
            return newSource;
          }
        }
      };

      layer.update({ source: 'a1' });

      expect(layer.getSource()).toBe(newSource);
    });
  });

  describe('source references', function () {
    describe('when layer is initialized', function () {
      it('should mark source as referenced', function () {
        expect(source.isSourceOf(layer)).toBe(true);
      });
    });

    describe('when layer is updated', function () {
      it('should unmark source and mark new source as referenced', function () {
        var oldSource = source;
        var newSource = fakeFactory.createAnalysisModel({ id: 'a1' });

        expect(oldSource.isSourceOf(layer)).toBe(true);
        expect(newSource.isSourceOf(layer)).toBe(false);

        layer.update({ source: newSource });

        expect(oldSource.isSourceOf(layer)).toBe(false);
        expect(newSource.isSourceOf(layer)).toBe(true);
      });
    });

    describe('when layer is removed', function () {
      it('should unmark source as referenced', function () {
        expect(source.isSourceOf(layer)).toBe(true);

        layer.remove();

        expect(source.isSourceOf(layer)).toBe(false);
      });
    });
  });
};
