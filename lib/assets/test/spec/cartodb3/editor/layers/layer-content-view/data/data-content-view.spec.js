var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var DataContentView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-content-view');
var DataColumnsModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-columns-model');
var TableStats = require('../../../../../../../javascripts/cartodb3/components/modals/add-widgets/tablestats');

describe('editor/layers/layers-content-view/data/data-content-view', function () {
  var view;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'cdb',
      api_key: 'foo'
    });

    var ts = new TableStats({
      configModel: configModel
    });

    var layerDefinitionModel = new Backbone.Model();
    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return new Backbone.Model();
    };

    var widgetDefinitionsCollection = new Backbone.Collection([
      {
        type: 'category',
        source: 'a0',
        column: 'city'
      }
    ]);

    var columnModel = new Backbone.Model({
      columns: 1
    });

    var stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['goToStep']);

    var columnsModel = new DataColumnsModel({}, {
      layerDefinitionModel: layerDefinitionModel,
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      tableStats: ts
    });

    spyOn(columnsModel, 'getCollection').and.returnValue(new Backbone.Collection([
      {selected: false}
    ]));

    spyOn(DataContentView.prototype, '_handleWidget');
    spyOn(DataContentView.prototype, '_renderStats');
    spyOn(DataContentView.prototype, '_columnsReady').and.returnValue(false);

    view = new DataContentView({
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      stackLayoutModel: stackLayoutModel,
      columnsNumberModel: columnModel,
      columnsModel: columnsModel,
      infoboxModel: new Backbone.Model()
    });

    view.render();
  });

  it('should render "placeholder" if columns not ready', function () {
    expect(view.$('.FormPlaceholder-paragraph').length).toBe(4);
    expect(_.keys(view._subviews).length).toBe(0);
  });

  it('should bind events properly', function () {
    view._columnsModel.set({render: true});
    expect(view._renderStats).toHaveBeenCalled();
    view._columnsCollection.at(0).set({selected: true});
    expect(view._handleWidget).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
