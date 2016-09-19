var _ = require('underscore');
var Backbone = require('backbone');
var LegendContentView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-content-view');
var LegendSizeTypes = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/size/legend-size-types');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var LegendFactory = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-factory');

describe('editor/layers/layer-content-view/legend/legend-content-view', function () {
  beforeEach(function () {
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
      configModel: {}
    });

    spyOn(LegendFactory, 'add');
    spyOn(LegendFactory, 'removeLegend');
    spyOn(LegendContentView.prototype, '_renderForm').and.callThrough();
    spyOn(LegendContentView.prototype, '_setHTMLSnippets').and.callThrough();

    this.legendDefinitionsCollection = new Backbone.Collection();
    this.legendDefinitionsCollection.findByLayerDefModelAndType = function () {
      return undefined;
    };

    this.legendDefinitionModel = new Backbone.Model({
      type: 'none'
    });

    this.editorModel = new Backbone.Model({
      edition: false
    });
    this.editorModel.isEditing = function () { return false; };

    this.htmlModel = new Backbone.Model();

    this.view = new LegendContentView({
      overlayModel: new Backbone.Model(),
      legendTypes: LegendSizeTypes,
      htmlModel: this.htmlModel,
      editorModel: this.editorModel,
      layerDefinitionModel: this.layerDefinitionModel,
      legendDefinitionModel: this.legendDefinitionModel,
      legendDefinitionsCollection: this.legendDefinitionsCollection
    });

    this.view.render();
  });

  it('should render properly', function () {
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
    expect(LegendFactory.add).toHaveBeenCalled();
  });

  it('should transmit html snippets changes properly', function () {
    this.htmlModel.set({
      preHTMLSnippet: 'Wadus'
    });

    expect(LegendContentView.prototype._setHTMLSnippets).toHaveBeenCalled();
    expect(this.view._legendDefinitionModel.get('preHTMLSnippet')).toBe('Wadus');

    this.htmlModel.set({
      preHTMLSnippet: 'Foo',
      postHTMLSnippet: 'Bar'
    });

    expect(LegendContentView.prototype._setHTMLSnippets).toHaveBeenCalled();
    expect(this.view._legendDefinitionModel.get('preHTMLSnippet')).toBe('Foo');
    expect(this.view._legendDefinitionModel.get('postHTMLSnippet')).toBe('Bar');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

