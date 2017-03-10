var Backbone = require('backbone');
var WidgetOptionModel = require('../../../../../../../javascripts/cartodb3/components/modals/add-widgets/widget-option-model');
var StatView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/stat-view');
var TableStats = require('../../../../../../../javascripts/cartodb3/components/modals/add-widgets/tablestats');

describe('editor/layers/layers-content-view/data/stat-view', function () {
  var nullValue = 0.0059;
  var topCatValue = 0.8534;
  var stackLayoutModel;
  var view;
  var graph;

  function createView (withBooleanColumn, withProperBoolean) {
    var layerDefinitionModel = new Backbone.Model();
    var analysisDefinitionNodeModel = new Backbone.Model({
      id: 'a0'
    });

    var tuples = [{
      columnModel: new Backbone.Model(),
      analysisDefinitionNodeModel: analysisDefinitionNodeModel,
      layerDefinitionModel: layerDefinitionModel
    }];

    var statModel = new WidgetOptionModel({
      type: 'category',
      column: withBooleanColumn ? 'boolean' : 'number',
      title: 'location of wadus',
      name: 'location',
      layer_index: 0,
      table: 'marias',
      selected: false,
      tuples: tuples
    });

    stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['goToStep']);

    view = new StatView({
      stackLayoutModel: stackLayoutModel,
      statModel: statModel,
      isVisible: true
    });

    spyOn(view, 'clean');

    graph = {
      stats: {
        freqs: true
      },
      getNullsPercentage: function () {
        return nullValue;
      },
      getPercentageInTopCategories: function () {
        return topCatValue;
      },
      getCategory: function () {
        return 'foo';
      },
      getTrues: function () {
        return withProperBoolean ? 0.45635 : undefined;
      }
    };

    spyOn(TableStats.prototype, 'graphFor').and.callFake(function () {
      view.model.set({graph: graph});
    });

    view.render();
    view.$el.appendTo(document.body);
  }

  beforeEach(function () {
  });

  afterEach(function () {
    view.remove();
  });

  it('should render properly', function () {
    createView();
    expect(view.$('.js-checkbox').length).toBe(1);
    expect(view.$('.js-stat').length).toBe(1);
    expect(view.$('.js-title').text()).toBe('location of wadus');
    expect(view.$('.StatsList-tag').text()).toBe('number');
  });

  it('should select/unselect the widget properly', function () {
    createView();
    view.$('.js-checkbox').trigger('click');
    expect(view._statModel.get('selected')).toBe(true);
    expect(view.$('.js-style').hasClass('is-hidden')).toBe(false);
    view.$('.js-checkbox').trigger('click');
    expect(view._statModel.get('selected')).toBe(false);
    expect(view.$('.js-style').length).toBe(0);
  });

  it('should be selected when widget is added', function () {
    createView();
    view._statModel.set({selected: true});
    expect(view.$('.js-checkbox').prop('checked')).toBe(true);
  });

  it('should go to style widget when clicked on style link', function () {
    createView();
    view.$('.js-checkbox').trigger('click');
    expect(view.$('.js-style').hasClass('is-hidden')).toBe(false);
    view.$('.js-style').trigger('click');
    expect(stackLayoutModel.goToStep).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    createView();
    expect(view).toHaveNoLeaks();
  });

  describe('_showCategory', function () {
    it('non-zero null data should be rounded up to two decimal positions.', function () {
      // Arrange
      createView();

      // Act
      view._showCategory(graph);

      // Assert
      expect(view.$('.js-null')[0].textContent.trim()).toEqual('0.59editor.data.stats.null');
      expect(view.$('.js-percent')[0].textContent.trim()).toEqual('85.3editor.data.stats.top-cat');
    });

    it('boolean column proper data should be rounded up to two decimal positions', function () {
      // Arrange
      createView(true, true);

      // Act
      view._showCategory(graph);

      // Arrange
      expect(view.$('.js-percent')[0].textContent.trim()).toEqual('45.6editor.data.stats.trues');
    });

    it('boolean column with no proper data should not be rendered', function () {
      // Arrange
      createView(true, false);

      // Act
      view._showCategory(graph);

      // Arrange
      expect(view.$('.js-percent')[0].textContent.trim()).toBeFalsy();
    });
  });
});
