var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var LegendManager = require('../../../../javascripts/cartodb3/deep-insights-integration/legend-manager');
var LegendFactory = require('../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-factory');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var StyleDefinitionModel = require('../../../../javascripts/cartodb3/editor/style/style-definition-model');
var LegendDefinitionsCollection = require('../../../../javascripts/cartodb3/data/legends/legend-definitions-collection');

describe('deep-insights-integrations/legend-manager', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.styleModel = new StyleDefinitionModel({
      type: 'simple'
    }, {
      parse: true
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocartocss: 'asd',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    this.layerDefinitionModel.styleModel = this.styleModel;

    this.layerDefinitionsCollection = new Backbone.Collection();
    this.layerDefinitionsCollection.add(this.layerDefinitionModel);

    this.legendDefinitionsCollection = new LegendDefinitionsCollection(null, {
      configModel: this.configModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      vizId: 'v-123'
    });

    LegendFactory.init(this.legendDefinitionsCollection);

    this.originalAjax = Backbone.ajax;
    Backbone.ajax = function () {
      return {
        always: function (cb) {
          cb();
        }
      };
    };

    spyOn(LegendFactory, 'createLegend');
    spyOn(LegendFactory, 'removeLegend').and.callThrough();
    spyOn(StyleDefinitionModel.prototype, 'on').and.callThrough();

    LegendManager.track(this.layerDefinitionModel);
  });

  afterEach(function () {
    Backbone.ajax = this.originalAjax;
  });

  describe('points', function () {
    describe('without autostyle', function () {
      it('styles fixed', function () {
        this.styleModel.set('fill', {
          color: {
            fixed: '#fabada'
          },
          size: {
            fixed: 7
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
      });

      it('styles size', function () {
        this.styleModel.set('fill', {
          color: {
            fixed: '#045275'
          },
          size: {
            attribute: 'number',
            range: [1.05, 1.95]
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});
      });

      it('styles color', function () {
        this.styleModel.set('fill', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'quantiles',
            range: ['#ffc6c4', '#cc607d', '#672044']
          },
          size: {
            attribute: 'number',
            quantification: 'quantiles',
            range: [1.05, 1.95]
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(2);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'choropleth', {title: 'number'});
      });

      it('styles color category quantification', function () {
        this.styleModel.set('fill', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'category',
            range: ['#ffc6c4', '#cc607d', '#672044']
          },
          size: {
            fixed: 7
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(1);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
      });
    });

    describe('with autostyle', function () {
      beforeEach(function () {
        this.layerDefinitionModel.set({
          autoStyle: 'wadus'
        });
      });

      it('styles size', function () {
        this.styleModel.set('fill', {
          color: {
            fixed: '#045275'
          },
          size: {
            attribute: 'number',
            range: [1.05, 1.95]
          }
        });

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});

        LegendFactory.removeLegend.calls.reset();
        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          autoStyle: false,
          cartocss: 'sudaw'
        });

        expect(LegendFactory.removeLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'custom_choropleth');
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});
      });

      it('styles color', function () {
        this.styleModel.set('fill', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'quantiles',
            range: ['#ffc6c4', '#cc607d', '#672044']
          },
          size: {
            attribute: 'number',
            quantification: 'quantiles',
            range: [1.05, 1.95]
          }
        });

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});

        LegendFactory.removeLegend.calls.reset();
        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          autoStyle: false,
          cartocss: 'sudaw'
        });

        expect(LegendFactory.removeLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'custom_choropleth', jasmine.any(Function));
        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(2);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'choropleth', {title: 'number'});
      });

      it('styles color category quantification', function () {
        this.styleModel.set('fill', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'category',
            range: ['#ffc6c4', '#cc607d', '#672044']
          },
          size: {
            fixed: 7
          }
        });

        LegendFactory.removeLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(0);
        expect(LegendFactory.removeLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category');

        this.layerDefinitionModel.set({
          autoStyle: false,
          cartocss: 'sudaw'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(1);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
      });
    });
  });

  describe('lines', function () {
    describe('without autostyle', function () {
      it('styles fixed', function () {
        this.styleModel.set('fill', {
          color: {
            fixed: '#fabada'
          },
          size: {
            fixed: 7
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
      });

      it('styles size', function () {
        this.styleModel.set('stroke', {
          color: {
            fixed: '#045275'
          },
          size: {
            attribute: 'number',
            range: [1.05, 1.95]
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});
      });

      it('styles color', function () {
        this.styleModel.set('stroke', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'quantiles',
            range: ['#ffc6c4', '#cc607d', '#672044']
          },
          size: {
            attribute: 'number',
            quantification: 'quantiles',
            range: [1.05, 1.95]
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(2);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'choropleth', {title: 'number'});
      });

      it('styles color category quantification', function () {
        this.styleModel.set('stroke', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'category',
            range: ['#ffc6c4', '#cc607d', '#672044']
          },
          size: {
            fixed: 7
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(1);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
      });
    });

    describe('with autostyle', function () {
      beforeEach(function () {
        this.layerDefinitionModel.set({
          autoStyle: 'wadus'
        });
      });

      it('styles size', function () {
        this.styleModel.set('stroke', {
          color: {
            fixed: '#045275'
          },
          size: {
            attribute: 'number',
            range: [1.05, 1.95]
          }
        });

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          autoStyle: false,
          cartocss: 'sudaw'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});
      });

      it('styles color', function () {
        this.styleModel.set('stroke', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'quantiles',
            range: ['#ffc6c4', '#cc607d', '#672044']
          },
          size: {
            attribute: 'number',
            quantification: 'quantiles',
            range: [1.05, 1.95]
          }
        });

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});

        LegendFactory.removeLegend.calls.reset();
        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          autoStyle: false,
          cartocss: 'sudaw'
        });

        expect(LegendFactory.removeLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'custom_choropleth', jasmine.any(Function));
        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(2);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number'});
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'choropleth', {title: 'number'});
      });

      it('styles color category quantification', function () {
        this.styleModel.set('stroke', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'category',
            range: ['#ffc6c4', '#cc607d', '#672044']
          },
          size: {
            fixed: 7
          }
        });

        LegendFactory.removeLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(0);
        expect(LegendFactory.removeLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category');

        this.layerDefinitionModel.set({
          autoStyle: false,
          cartocss: 'sudaw'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(1);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
      });
    });
  });

  describe('polygons', function () {
    describe('without autostyle', function () {
      it('styles fixed', function () {
        this.styleModel.set('fill', {
          color: {
            fixed: '#fabada'
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
      });

      it('styles color', function () {
        this.styleModel.set('fill', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'quantiles',
            range: ['#ffc6c4', '#cc607d', '#672044']
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(1);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'choropleth', {title: 'number'});
      });

      it('styles color category quantification', function () {
        this.styleModel.set('fill', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'category',
            range: ['#ffc6c4', '#cc607d', '#672044']
          }
        });

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(1);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
      });
    });

    describe('with autostyle', function () {
      beforeEach(function () {
        this.layerDefinitionModel.set({
          autoStyle: 'wadus'
        });
      });

      it('styles color', function () {
        this.styleModel.set('fill', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'quantiles',
            range: ['#ffc6c4', '#cc607d', '#672044']
          }
        });

        LegendFactory.removeLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(0);
        expect(LegendFactory.removeLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'choropleth');

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          autoStyle: false,
          cartocss: 'sudaw'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'choropleth', {title: 'number'});
      });

      it('styles color category quantification', function () {
        this.styleModel.set('fill', {
          color: {
            attribute: 'number',
            attribute_type: 'number',
            bins: '3',
            quantification: 'category',
            range: ['#ffc6c4', '#cc607d', '#672044']
          }
        });

        LegendFactory.removeLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(0);
        expect(LegendFactory.removeLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category');

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          autoStyle: false,
          cartocss: 'sudaw'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledTimes(1);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
      });
    });
  });

  describe('torque', function () {
    beforeEach(function () {
      this.styleModel.set('type', 'animation');
    });

    it('styles color', function () {
      this.styleModel.set('fill', {
        color: {
          attribute: 'number',
          attribute_type: 'number',
          range: ['#ffc6c4', '#cc607d', '#672044'],
          domain: [20, 21, 22]
        },
        size: {
          fixed: 7
        }
      });

      this.layerDefinitionModel.set({
        cartocss: 'wadus'
      });

      expect(LegendFactory.createLegend).toHaveBeenCalledTimes(1);
      expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
    });
  });
});
