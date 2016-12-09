var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var LegendContentView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-content-view');
var LegendColorTypes = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/color/legend-color-types');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var LegendDefinitionCollection = require('../../../../../../../javascripts/cartodb3/data/legends/legend-definitions-collection');
var LegendFactory = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-factory');

describe('editor/layers/layer-content-view/legend/legend-content-view', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?://.*legends'))
      .andReturn({ status: 200 });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    this.layerDefinitionModel.styleModel = new Backbone.Model({
      fill: {
        color: {
          fixed: '#892b27'
        }
      }
    });

    var layerDefinitionsCollection = new Backbone.Collection();
    layerDefinitionsCollection.add(this.layerDefinitionModel);

    spyOn(LegendContentView.prototype, '_renderForm').and.callThrough();

    this.legendDefinitionsCollection = new LegendDefinitionCollection(null, {
      configModel: this.configModel,
      layerDefinitionsCollection: layerDefinitionsCollection,
      vizId: 'v-123'
    });

    LegendFactory.init(this.legendDefinitionsCollection);

    this.legendDefinitionModel = new Backbone.Model({
      type: 'none'
    }, {
      layerDefinitionModel: this.layerDefinitionModel,
      configModel: this.configModel,
      vizId: 'v-123'
    });

    this.editorModel = new Backbone.Model({
      edition: false
    });
    this.editorModel.isEditing = function () { return false; };

    function updateLegend () {}

    this.view = new LegendContentView({
      overlayModel: new Backbone.Model(),
      legendTypes: LegendColorTypes,
      updateLegend: updateLegend,
      editorModel: this.editorModel,
      layerDefinitionModel: this.layerDefinitionModel,
      legendDefinitionModel: this.legendDefinitionModel,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      type: 'color'
    });

    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should render properly', function () {
    expect(this.view._carouselCollection.length).toBe(2); // none and custom
    expect(_.size(this.view._subviews)).toBe(2); // carousel and overlay
    expect(this.view.$('.js-carousel').children().length).toBe(1);
    expect(this.view.$('.js-form').children().length).toBe(0);

    this.view._carouselCollection.at(1).set({selected: true});
    expect(_.size(this.view._subviews)).toBe(3); // carousel, overlay and form view
    expect(this.view.$('.js-form').children().length).toBe(1);

    // Clean the form view when type is none
    this.view._carouselCollection.at(0).set({selected: true});
    expect(_.size(this.view._subviews)).toBe(2);
    expect(this.view.$('.js-form').children().length).toBe(0);
  });

  it('should handle toggle state properly', function () {
    this.view._carouselCollection.at(0).set({selected: true});
    expect(this.editorModel.get('disabled')).toBe(true);
    this.view._carouselCollection.at(1).set({selected: true});
    expect(this.editorModel.get('disabled')).toBe(false);
  });

  it('should render form properly when carousel changes', function () {
    this.view._carouselCollection.at(1).set({selected: true});
    expect(LegendContentView.prototype._renderForm).toHaveBeenCalled();
  });

  describe('carousel', function () {
    it('should render carousel styleModel for points based', function () {
      this.layerDefinitionModel.styleModel = new Backbone.Model({
        fill: {
          color: {
            attribute: 'n_anclajes',
            attribute_type: 'number'
          }
        }
      });

      var view = new LegendContentView({
        overlayModel: new Backbone.Model(),
        legendTypes: LegendColorTypes,
        updateLegend: function () {},
        editorModel: this.editorModel,
        layerDefinitionModel: this.layerDefinitionModel,
        legendDefinitionModel: this.legendDefinitionModel,
        legendDefinitionsCollection: this.legendDefinitionsCollection,
        type: 'color'
      });

      view.render();

      expect(view._carouselCollection.pluck('val')).toEqual(['none', 'choropleth', 'custom']);
    });

    it('should render carousel styleModel for lines based', function () {
      this.layerDefinitionModel.styleModel = new Backbone.Model({
        stroke: {
          color: {
            attribute: 'n_anclajes',
            attribute_type: 'number'
          }
        }
      });

      var view = new LegendContentView({
        overlayModel: new Backbone.Model(),
        legendTypes: LegendColorTypes,
        updateLegend: function () {},
        editorModel: this.editorModel,
        layerDefinitionModel: this.layerDefinitionModel,
        legendDefinitionModel: this.legendDefinitionModel,
        legendDefinitionsCollection: this.legendDefinitionsCollection,
        type: 'color'
      });

      view.render();

      expect(view._carouselCollection.pluck('val')).toEqual(['none', 'choropleth', 'custom']);
    });

    it('should render category legend option in the carousel if styleModel has quantification category', function () {
      this.layerDefinitionModel.styleModel = new Backbone.Model({
        fill: {
          color: {
            attribute: 'n_anclajes',
            attribute_type: 'number',
            quantification: 'category'
          }
        }
      });

      var view = new LegendContentView({
        overlayModel: new Backbone.Model(),
        legendTypes: LegendColorTypes,
        updateLegend: function () {},
        editorModel: this.editorModel,
        layerDefinitionModel: this.layerDefinitionModel,
        legendDefinitionModel: this.legendDefinitionModel,
        legendDefinitionsCollection: this.legendDefinitionsCollection,
        type: 'color'
      });

      view.render();

      expect(view._carouselCollection.pluck('val')).toEqual(['none', 'category', 'custom']);
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

