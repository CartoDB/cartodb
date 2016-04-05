var Backbone = require('backbone');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var _ = require('underscore');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');
var AnalysisFactory = require('../../../../src/analysis/analysis-factory.js');

describe('geo/map/cartodb-layer', function () {
  sharedTestsForInteractiveLayers(CartoDBLayer);

  it('should be type CartoDB', function () {
    var layer = new CartoDBLayer();
    expect(layer.get('type')).toEqual('CartoDB');
  });

  describe('.getInteractiveColumnNames', function () {
    beforeEach(function () {
      this.layer = new CartoDBLayer();
      spyOn(this.layer, 'getInfowindowFieldNames');
      spyOn(this.layer, 'getTooltipFieldNames');
    });

    it('should include cartodb_id if there is any other field required from the infowindow or tooltip', function () {
      this.layer.getInfowindowFieldNames.and.returnValue(['column_a']);
      this.layer.getTooltipFieldNames.and.returnValue([]);
      expect(_.contains(this.layer.getInteractiveColumnNames(), 'cartodb_id')).toBeTruthy();

      this.layer.getInfowindowFieldNames.and.returnValue([]);
      this.layer.getTooltipFieldNames.and.returnValue(['column_b']);
      expect(_.contains(this.layer.getInteractiveColumnNames(), 'cartodb_id')).toBeTruthy();
    });

    it("should not include cartodb_id if there isn't any field required", function () {
      this.layer.getInfowindowFieldNames.and.returnValue([]);
      this.layer.getTooltipFieldNames.and.returnValue([]);
      expect(_.contains(this.layer.getInteractiveColumnNames(), 'cartodb_id')).toBeFalsy();
    });
  });

  describe('.update', function () {
    beforeEach(function () {
      this.analysisCollection = new Backbone.Collection();
      var map = jasmine.createSpyObj('map', ['reload']);

      this.layer = new CartoDBLayer(null, {
        analysisCollection: this.analysisCollection,
        map: map
      });
      this.analysisFactory = new AnalysisFactory({
        analysisCollection: this.analysisCollection,
        map: map
      });
    });

    it('should update the source given a valid id', function () {
      this.analysisFactory.analyse({
        id: 'a1',
        type: 'trade-area',
        params: {
          kind: 'walk',
          time: 300,
          source: {
            id: 'a0',
            type: 'source',
            params: {
              query: 'SELECT * FROM subway_stops'
            }
          }
        }
      });

      this.layer.update({
        source: 'a0',
        something: 'something'
      });

      expect(this.layer.get('source')).toEqual('a0');
      expect(this.layer.get('something')).toEqual('something');

      this.layer.update({
        source: 'a1',
        else: 'else'
      });

      expect(this.layer.get('source')).toEqual('a1');
      expect(this.layer.get('else')).toEqual('else');
    });

    it('should raise an error when given an invalid id as the source', function () {
      expect(function () {
        this.layer.update({
          source: 'something'
        });
      }.bind(this)).toThrowError("No analysis with the id 'something' was found");

      this.analysisFactory.analyse({
        id: 'a1',
        type: 'trade-area',
        params: {
          kind: 'walk',
          time: 300,
          source: {
            id: 'a0',
            type: 'source',
            params: {
              query: 'SELECT * FROM subway_stops'
            }
          }
        }
      });

      expect(function () {
        this.layer.update({
          source: 'something'
        });
      }.bind(this)).toThrowError("No analysis with the id 'something' was found");
    });
  });
});
