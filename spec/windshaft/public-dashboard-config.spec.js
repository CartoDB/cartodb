var Backbone = require('backbone');
var cdb = require('cartodb.js');
var PublicDashboardConfig = require('app/windshaft/public-dashboard-config');
var HistogramModel = require('app/widgets/histogram/model');

describe('windshaft/public-dashboard-config', function () {
  beforeEach(function () {
    this.widgets = new Backbone.Collection();

    this.cartoDBLayer1 = new cdb.geo.CartoDBLayer({
      id: 'layer1',
      sql: 'sql1',
      cartocss: 'cartoCSS1',
      cartocss_version: '2.0'
    });
    var widget = new HistogramModel({
      id: 'widgetId',
      column: 'column1',
      bins: 10
    }, {
      layer: this.cartoDBLayer1
    });
    this.widgets.add(widget);

    this.cartoDBLayer2 = new cdb.geo.CartoDBLayer({
      id: 'layer2',
      sql: 'sql2',
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0'
    });
    var widget2 = new HistogramModel({
      id: 'widgetId2',
      column: 'column2',
      bins: 5
    }, {
      layer: this.cartoDBLayer2
    });
    this.widgets.add(widget2);
  });

  describe('.generate', function () {
    it('should generate the config', function () {
      var config = PublicDashboardConfig.generate({
        widgets: this.widgets,
        layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ]
      });

      expect(config).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              sql: 'sql1',
              cartocss: 'cartoCSS1',
              cartocss_version: '2.0',
              interactivity: [ 'cartodb_id' ],
              widgets: {
                widgetId: {
                  type: 'histogram',
                  options: {
                    column: 'column1',
                    bins: 10
                  }
                }
              }
            }
          },
          {
            type: 'cartodb',
            options: {
              sql: 'sql2',
              cartocss: 'cartoCSS2',
              cartocss_version: '2.0',
              interactivity: [ 'cartodb_id' ],
              widgets: {
                widgetId2: {
                  type: 'histogram',
                  options: {
                    column: 'column2',
                    bins: 5
                  }
                }
              }
            }
          }
        ]
      });
    });

    it('should not include hidden layers', function () {
      this.cartoDBLayer1.set('visible', false);

      var config = PublicDashboardConfig.generate({
        widgets: this.widgets,
        layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ]
      });

      expect(config).toEqual({
        layers: [
          {
            type: 'cartodb',
            options: {
              sql: 'sql2',
              cartocss: 'cartoCSS2',
              cartocss_version: '2.0',
              interactivity: [ 'cartodb_id' ],
              widgets: {
                widgetId2: {
                  type: 'histogram',
                  options: {
                    column: 'column2',
                    bins: 5
                  }
                }
              }
            }
          }
        ]
      });
    });
  });
});
