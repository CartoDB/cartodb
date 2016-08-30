var Backbone = require('backbone');
var WidgetOptionModel = require('../../../../../../../javascripts/cartodb3/components/modals/add-widgets/widget-option-model');
var StatView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/stat-view');
var TableStats = require('../../../../../../../javascripts/cartodb3/components/modals/add-widgets/tablestats');

describe('editor/layers/layers-content-view/data/stat-view', function () {
  var view;

  beforeEach(function () {
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
      column: 'number',
      title: 'location of wadus',
      name: 'location',
      layer_index: 0,
      table: 'marias',
      selected: false,
      tuples: tuples
    });

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['goToStep']);

    view = new StatView({
      stackLayoutModel: this.stackLayoutModel,
      statModel: statModel,
      isVisible: true
    });

    spyOn(view, 'clean');

    var Graph = {
      stats: {
        freqs: true
      },
      getNullsPercentage: function () {
        return 0;
      },
      getPercentageInTopCategories: function () {
        return 3;
      },
      getCategory: function () {
        return 'foo';
      }
    };

    spyOn(TableStats.prototype, 'graphFor').and.callFake(function () {
      view.model.set({graph: Graph});
    });

    view.render();
    view.$el.appendTo(document.body);
  });

  afterEach(function () {
    view.remove();
  });

  it('should render properly', function () {
    expect(view.$('.js-checkbox').length).toBe(1);
    expect(view.$('.js-stat').length).toBe(1);
    expect(view.$('.js-title').text()).toBe('location of wadus');
    expect(view.$('.StatsList-tag').text()).toBe('number');
  });

  it('should select/unselect the widget properly', function () {
    view.$('.js-checkbox').trigger('click');
    expect(view._statModel.get('selected')).toBe(true);
    expect(view.$('.js-style').hasClass('is-hidden')).toBe(false);
    view.$('.js-checkbox').trigger('click');
    expect(view._statModel.get('selected')).toBe(false);
    expect(view.$('.js-style').length).toBe(0);
  });

  it('should be selected when widget is added', function () {
    view._statModel.set({selected: true});
    expect(view.$('.js-checkbox').prop('checked')).toBe(true);
  });

  it('should go to style widget when clicked on style link', function () {
    view.$('.js-checkbox').trigger('click');
    expect(view.$('.js-style').hasClass('is-hidden')).toBe(false);
    view.$('.js-style').trigger('click');
    expect(this.stackLayoutModel.goToStep).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
