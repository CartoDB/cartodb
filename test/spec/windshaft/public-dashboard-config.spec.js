var PublicDashboardConfig = require('cdb/windshaft/public-dashboard-config');
var CartoDBLayer = require('cdb/geo/map/cartodb-layer');
var HistogramModel = require('cdb/geo/ui/widgets/histogram/model');
var CategoryFilter = require('cdb/windshaft/filters/category');

describe ('src/windshaft/public-dashboard-config', function() {

  beforeEach(function() {
    this.cartoDBLayer1 = new CartoDBLayer({
      id: 'layer1',
      sql: 'sql1',
      cartocss: 'cartoCSS1',
      cartocss_version: '2.0'
    });
    var widget = new HistogramModel({
      id: 'widgetId',
      column: 'column1',
      bins: 10
    }, {});
    this.cartoDBLayer1.addWidget(widget);

    this.cartoDBLayer2 = new CartoDBLayer({
      id: 'layer2',
      sql: 'sql2',
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0'
    });
    var widget = new HistogramModel({
      id: 'widgetId',
      column: 'column2',
      bins: 5
    }, {});
    this.cartoDBLayer2.addWidget(widget);
  })

  describe('.generate', function() {

    it('should generate the config', function() {
      var config = PublicDashboardConfig.generate({
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
                widgetId: {
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

    it('should not include hidden layers', function() {
      this.cartoDBLayer1.set('visible', false);

      var config = PublicDashboardConfig.generate({
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
                widgetId: {
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