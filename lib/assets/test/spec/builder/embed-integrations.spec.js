var _ = require('underscore');
var deepInsights = require('deep-insights/index');
var LayerStyleCollection = require('builder/embed/style-collection');
var EmbedIntegrations = require('builder/embed/embed-integrations');
var VisModel = require('internal-carto.js/src/vis/vis');

describe('embed-integrations', function () {
  var el;

  beforeAll(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });
  });

  beforeEach(function (done) {
    spyOn(VisModel.prototype, 'instantiateMap').and.callFake(function (options) {
      options.success({
        layergroupid: '123456789',
        metadata: {
          layers: []
        }
      });
    });

    el = document.createElement('div');
    el.id = 'wdmtmp';
    document.body.appendChild(el);

    var vizjson = {
      bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
      center: '[41.40578459184651, 2.2230148315429688]',
      user: {},
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      layers: [{
        id: 'l-1',
        kind: 'carto',
        type: 'CartoDB',
        options: {
          table_name: 'something',
          cartocss: 'hello',
          source: 'a0'
        },
        legends: [
          {
            type: 'bubble',
            title: 'My Bubble Legend',
            fillColor: '#FABADA'
          }, {
            type: 'category',
            title: 'My category Legend',
            fillColor: '#FABADA'
          }, {
            type: 'choropleth',
            title: 'My choropleth Legend',
            fillColor: '#FABADA'
          }, {
            type: 'custom',
            title: 'My custom Legend',
            fillColor: '#FABADA'
          }, {
            type: 'custom_choropleth',
            title: 'My custom_choropleth Legend',
            fillColor: '#FABADA'
          }
        ]
      }],
      options: {
        scrollwheel: false
      },
      legends: true,
      widgets: [
        {
          id: 'w-1',
          type: 'category',
          title: 'name',
          order: 0,
          layer_id: 'l-1',
          source: {
            id: 'a0'
          },
          options: {
            column: 'name',
            aggregation_column: 'name',
            aggregation: 'count',
            sync_on_bbox_change: true
          },
          style: {
            widget_style: {
              definition: {
                color: {
                  fixed: '#9DE0AD',
                  opacity: 1
                }
              }
            },
            auto_style: {
              custom: true,
              allowed: true
            }
          }
        }
      ],
      analyses: [{
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foo;'
        }
      }]
    };

    deepInsights.createDashboard('#wdmtmp', vizjson, {
      autoStyle: true
    }, function (error, dashboard) {
      if (error) {
        throw new Error('error creating dashboard ' + error);
      }

      var layersData = [{
        id: 'l-1',
        kind: 'carto',
        options: {
          table_name: 'something',
          cartocss: '...',
          source: 'a0'
        }
      }];

      var layerStyleCollection = new LayerStyleCollection();
      layerStyleCollection.resetByLayersData(layersData);

      this.integrations = new EmbedIntegrations({
        deepInsightsDashboard: dashboard,
        layerStyleCollection: layerStyleCollection
      });

      done();
    }.bind(this));
  });

  afterEach(function () {
    document.body.removeChild(el);
  });

  describe('hasInitialState', function () {
    beforeEach(function () {
      var widgetCollection = this.integrations._getWidgets();
      this.widget = widgetCollection.at(0);

      this.widget.set('hasInitialState', true);
      this.widget.dataviewModel.set('data', [{ name: 'matallo', agg: false, value: 10 }]);

      this.layer = this.integrations._getLayers().at(0);
      this.legends = this.layer.legends;
    });

    afterEach(function () {
      var nodes = document.querySelectorAll('.CDB-Box-modal');
      [].slice.call(nodes).forEach(function (node) {
        var parent = node.parentNode;
        parent.removeChild(node);
      });
    });

    describe('points', function () {
      describe('without autostyle', function () {
        it('styles size', function () {
          this.layer.set('cartocss', '#layer { marker-fill: #045275; marker-width: ramp([name], range(1.05, 1.95), quantiles(5)); }');

          expect(this.legends.bubble.get('visible')).toBe(true);
        });

        it('styles color', function () {
          this.layer.set('cartocss', '#layer { marker-fill: ramp([name], (#ffc6c4, #cc607d, #672044), quantiles); marker-width: ramp([name], range(1.05, 1.95), quantiles(5)); }');

          expect(this.legends.bubble.get('visible')).toBe(true);
          expect(this.legends.choropleth.get('visible')).toBe(true);
        });

        it('styles color category quantification', function () {
          this.layer.set('cartocss', '#layer { marker-fill: ramp([name], (#ffc6c4, #cc607d, #672044), ("matallo", "matallo", "matallo"), "="); }');

          expect(this.legends.category.get('visible')).toBe(true);
        });
      });

      describe('with autostyle', function () {
        it('styles size', function () {
          this.layer.set('cartocss', '#layer { marker-fill: #045275; marker-width: ramp([name], range(1.05, 1.95), quantiles(5)); }');

          this.widget.set('autoStyle', true);

          expect(this.legends.bubble.get('visible')).toBe(true);

          this.widget.set('autoStyle', false);

          expect(this.legends.bubble.get('visible')).toBe(true);
        });

        it('styles color', function () {
          this.layer.set('cartocss', '#layer { marker-fill: ramp([name], (#ffc6c4, #cc607d, #672044), quantiles); marker-width: ramp([name], range(1.05, 1.95), quantiles(5)); }');

          this.widget.set('autoStyle', true);

          expect(this.legends.bubble.get('visible')).toBe(true);
          expect(this.legends.choropleth.get('visible')).toBe(false);

          this.widget.set('autoStyle', false);

          expect(this.legends.bubble.get('visible')).toBe(true);
          expect(this.legends.choropleth.get('visible')).toBe(true);
        });

        it('styles color category quantification', function () {
          this.layer.set('cartocss', '#layer { marker-fill: ramp([name], (#ffc6c4, #cc607d, #672044), ("matallo", "matallo", "matallo"), "="); }');

          this.widget.set('autoStyle', true);

          expect(this.legends.category.get('visible')).toBe(false);

          this.widget.set('autoStyle', false);

          expect(this.legends.category.get('visible')).toBe(true);
        });
      });
    });

    describe('lines', function () {
      describe('without autostyle', function () {
        it('styles size', function () {
          this.layer.set('cartocss', '#layer { line-width: ramp([cartodb_id], range(1.05, 1.95), quantiles(5)); line-color: #045275; }');

          expect(this.legends.bubble.get('visible')).toBe(true);
        });

        it('styles color', function () {
          this.layer.set('cartocss', '#layer { line-width: ramp([cartodb_id], range(1.05, 1.95), quantiles(5)); line-color: ramp([cartodb_id], (#ffc6c4, #cc607d, #672044), quantiles); }');

          expect(this.legends.bubble.get('visible')).toBe(true);
          expect(this.legends.choropleth.get('visible')).toBe(true);
        });

        it('styles color category quantification', function () {
          this.layer.set('cartocss', '#layer { line-color: ramp([name], (#ffc6c4, #cc607d, #672044), ("matallo", "matallo", "matallo"), "="); }');

          expect(this.legends.category.get('visible')).toBe(true);
        });
      });

      describe('with autostyle', function () {
        it('styles size', function () {
          this.layer.set('cartocss', '#layer { line-width: ramp([cartodb_id], range(1.05, 1.95), quantiles(5)); line-color: #045275; }');

          this.widget.set('autoStyle', true);

          expect(this.legends.bubble.get('visible')).toBe(true);

          this.widget.set('autoStyle', false);

          expect(this.legends.bubble.get('visible')).toBe(true);
        });

        it('styles color', function () {
          this.layer.set('cartocss', '#layer { line-width: ramp([cartodb_id], range(1.05, 1.95), quantiles(5)); line-color: ramp([cartodb_id], (#ffc6c4, #cc607d, #672044), quantiles); }');

          this.widget.set('autoStyle', true);

          expect(this.legends.bubble.get('visible')).toBe(true);

          this.widget.set('autoStyle', false);

          expect(this.legends.bubble.get('visible')).toBe(true);
          expect(this.legends.choropleth.get('visible')).toBe(true);
        });

        it('styles color category quantification', function () {
          this.layer.set('cartocss', '#layer { line-color: ramp([name], (#ffc6c4, #cc607d, #672044), ("matallo", "matallo", "matallo"), "="); }');

          this.widget.set('autoStyle', true);

          expect(this.legends.category.get('visible')).toBe(false);

          this.widget.set('autoStyle', false);

          expect(this.legends.category.get('visible')).toBe(true);
        });
      });
    });

    describe('polygons', function () {
      describe('without autostyle', function () {
        it('styles color', function () {
          this.layer.set('cartocss', '#layer { polygon-fill: ramp([name], (#ffc6c4, #cc607d, #672044), quantiles); }');

          expect(this.legends.choropleth.get('visible')).toBe(true);
        });

        it('styles color category quantification', function () {
          this.layer.set('cartocss', '#layer { polygon-fill: ramp([name], (#ffc6c4, #cc607d, #672044), ("matallo", "matallo", "matallo"), "="); }');

          expect(this.legends.category.get('visible')).toBe(true);
        });
      });

      describe('with autostyle', function () {
        it('styles color', function () {
          this.layer.set('cartocss', '#layer { polygon-fill: ramp([name], (#ffc6c4, #cc607d, #672044), quantiles); }');

          this.widget.set('autoStyle', true);

          expect(this.legends.choropleth.get('visible')).toBe(false);

          this.widget.set('autoStyle', false);

          expect(this.legends.choropleth.get('visible')).toBe(true);
        });

        it('styles color category quantification', function () {
          this.layer.set('cartocss', '#layer { polygon-fill: ramp([name], (#ffc6c4, #cc607d, #672044), ("matallo", "matallo", "matallo"), "="); }');

          this.widget.set('autoStyle', true);

          expect(this.legends.category.get('visible')).toBe(false);

          this.widget.set('autoStyle', false);

          expect(this.legends.category.get('visible')).toBe(true);
        });
      });
    });
  });
});
