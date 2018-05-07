var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var LegendManager = require('builder/deep-insights-integration/legend-manager');
var LegendFactory = require('builder/editor/layers/layer-content-views/legend/legend-factory');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var StyleDefinitionModel = require('builder/editor/style/style-definition-model');
var LegendDefinitionsCollection = require('builder/data/legends/legend-definitions-collection');
var StyleHelper = require('builder/helpers/style');
var Validations = require('builder/editor/layers/layer-content-views/legend/legend-validations');

function getSuccessResponse (response, id, type, title) {
  var success = _.clone(TestResponses[response].success);
  success.responseText = _.template(success.responseText)({
    id: id,
    type: type,
    title: title || ''
  });

  return success;
}

var TestResponses = {
  save: {
    success: {
      'status': '200',
      'content-type': 'application/json',
      responseText: '{"created_at":"2016-09-30T07:57:15+00:00","id":"<%= id %>","layer_id":"l-1","title":"<%= title %>","type":"<%= type %>","definition": {"color":"#fabada", "prefix":"", "suffix": "" }}'
    }
  },
  destroy: {
    success: {
      status: 204
    }
  }
};

describe('deep-insights-integrations/legend-manager', function () {
  beforeEach(function () {
    jasmine.Ajax.install();

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

    spyOn(Validations, 'bubble').and.returnValue(true);
    spyOn(Validations, 'choropleth').and.returnValue(true);
    spyOn(Validations, 'category').and.returnValue(true);

    LegendFactory.init(this.legendDefinitionsCollection);

    spyOn(LegendFactory, 'createLegend').and.callThrough();
    spyOn(LegendFactory, 'removeLegend').and.callThrough();
    spyOn(StyleDefinitionModel.prototype, 'on').and.callThrough();

    LegendManager.track(this.layerDefinitionModel);
  });

  afterEach(function () {
    this.layerDefinitionModel.off();
    jasmine.Ajax.uninstall();
  });

  describe('points', function () {
    describe('without existing legend', function () {
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

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
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

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
      });
    });

    describe('with existing legend', function () {
      it('styles fixed', function () {
        this.styleModel.set('fill', {
          color: {
            fixed: '#fabada'
          },
          size: {
            fixed: 7
          }
        });

        LegendFactory.createLegend(this.layerDefinitionModel, 'category');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'category'));

        LegendFactory.createLegend.calls.reset();

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

        LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'bubble'));

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number', fillColor: '#045275'});
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

        LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'choropleth'));
        LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 2, 'bubble'));

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend.calls.count()).toBe(2);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number', fillColor: '#ffc6c4'});
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

        LegendFactory.createLegend(this.layerDefinitionModel, 'category');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'category'));

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
      });
    });
  });

  describe('lines', function () {
    describe('without existing legend', function () {
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

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
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

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
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

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
      });
    });

    describe('with existing legend', function () {
      it('styles fixed', function () {
        this.styleModel.set('fill', {
          color: {
            fixed: '#fabada'
          },
          size: {
            fixed: 7
          }
        });

        LegendFactory.createLegend(this.layerDefinitionModel, 'category');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'category'));

        LegendFactory.createLegend.calls.reset();

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

        LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'bubble'));

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number', fillColor: '#045275'});
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

        LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'choropleth'));
        LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 2, 'bubble'));

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend.calls.count()).toBe(2);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number', fillColor: '#ffc6c4'});
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

        LegendFactory.createLegend(this.layerDefinitionModel, 'category');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'category'));

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
      });

      describe('custom legend', function () {
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

          LegendFactory.createLegend(this.layerDefinitionModel, 'custom');
          jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'custom'));
          LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
          jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 2, 'bubble'));

          LegendFactory.createLegend.calls.reset();

          this.layerDefinitionModel.set({
            cartocss: 'wadus'
          });

          expect(LegendFactory.createLegend.calls.count()).toBe(1);
          expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', {title: 'number', fillColor: '#ffc6c4'});
          expect(LegendFactory.createLegend).not.toHaveBeenCalledWith(this.layerDefinitionModel, 'choropleth', {title: 'number'});
        });
      });
    });
  });

  describe('polygons', function () {
    describe('without existing legend', function () {
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

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
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

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
      });
    });

    describe('with existing legend', function () {
      it('styles fixed', function () {
        this.styleModel.set('fill', {
          color: {
            fixed: '#fabada'
          },
          size: {
            fixed: 7
          }
        });

        LegendFactory.createLegend(this.layerDefinitionModel, 'category');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'category'));

        LegendFactory.createLegend.calls.reset();

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

        LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'choropleth'));

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
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

        LegendFactory.createLegend(this.layerDefinitionModel, 'category');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'category'));

        LegendFactory.createLegend.calls.reset();

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'category', {title: 'number'});
      });
    });
  });

  describe('torque', function () {
    beforeEach(function () {
      this.styleModel.set('type', 'animation');
    });

    describe('without existing legend', function () {
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

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
      });
    });

    describe('with existing legend', function () {
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

        LegendFactory.createLegend(this.layerDefinitionModel, 'torque');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'torque'));

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        var items = StyleHelper.getStyleCategories(this.styleModel);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'torque', {title: 'number', items: items});
      });
    });
  });

  describe('heatmap', function () {
    beforeEach(function () {
      this.styleModel.set('type', 'heatmap');

      var fillProperties = {
        color: {
          attribute: 'cartodb_id',
          bins: '5',
          opacity: 1,
          quantification: 'equal',
          range: ['#ecda9a', '#f1b973', '#f7945d', '#f86f56', '#ee4d5a']
        },
        size: {
          fixed: 7.5
        }
      };

      this.styleModel.set('fill', fillProperties);
    });

    describe('without existing legend', function () {
      it('styles color', function () {
        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        expect(LegendFactory.createLegend).not.toHaveBeenCalled();
      });
    });

    describe('with existing legend', function () {
      it('styles color', function () {
        LegendFactory.createLegend(this.layerDefinitionModel, 'custom_choropleth');
        jasmine.Ajax.requests.mostRecent().respondWith(getSuccessResponse('save', 1, 'custom_choropleth'));

        this.layerDefinitionModel.set({
          cartocss: 'wadus'
        });

        var colors = StyleHelper.getColorsFromRange(this.styleModel);
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(
          this.layerDefinitionModel, 'custom_choropleth', {
            title: 'editor.legend.pixel-title',
            colors: colors
          });
      });
    });
  });
});
