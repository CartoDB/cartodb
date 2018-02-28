var Backbone = require('backbone');
var _ = require('underscore');
var WidgetOptionModel = require('builder/components/modals/add-widgets/widget-option-model');
var StatView = require('builder/editor/layers/layer-content-views/data/stat-view');
var TableStats = require('builder/components/modals/add-widgets/tablestats');
var Router = require('builder/routes/router');

describe('editor/layers/layers-content-view/data/stat-view', function () {
  var nullValue = 0.0059;
  var topCatValue = 0.8534;
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
      tuples: tuples,
      widget: new Backbone.Model({ id: 'widget-1' })
    });

    view = new StatView({
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

    spyOn(Router, 'goToWidget');
    spyOn(TableStats.prototype, 'graphFor').and.callFake(function () {
      view.model.set({graph: graph});
    });

    view.render();
    view.$el.appendTo(document.body);
  }

  describe('.render', function () {
    beforeEach(function () {
      createView();
    });

    it('should render properly', function () {
      expect(view.$('.js-checkbox').length).toBe(1);
      expect(view.$('.js-stat').length).toBe(1);
      expect(view.$('.js-title').text()).toBe('location of wadus');
      expect(view.$('.StatsList-tag').text()).toBe('number');
      expect(_.size(view._subviews)).toBe(0);
    });

    describe('when _statModel is selected', function () {
      beforeEach(function () {
        view._statModel.set('selected', true);
      });

      it('should render correctly', function () {
        expect(view.$('.js-help').length).toBe(1);
        expect(_.size(view._subviews)).toBe(1); // [tooltip]
      });
    });
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
    expect(Router.goToWidget).toHaveBeenCalledWith('widget-1');
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

  describe('._isSelected', function () {
    it('returns the value of _statModel selected', function () {
      expect(view._isSelected()).toBe(false);
      view._statModel.set('selected', true);
      expect(view._isSelected()).toBe(true);
    });
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    var parent = view.el.parentNode;
    parent && parent.removeChild(view.el);
    view.clean();
  });
});
