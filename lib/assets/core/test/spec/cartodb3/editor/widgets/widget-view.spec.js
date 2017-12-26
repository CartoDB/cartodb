var $ = require('jquery');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var EditorWidgetView = require('../../../../../javascripts/cartodb3/editor/widgets/widget-view');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/data/widget-definition-model');
var WidgetsService = require('../../../../../javascripts/cartodb3/editor/widgets/widgets-service');
var FactoryModals = require('../../factories/modals');

var ENTER_KEY_CODE = 13;
var WIDGET_DEFINITION = {
  type: 'formula',
  title: 'AVG districts homes',
  column: 'areas',
  operation: 'avg',
  layer_id: 'l-1',
  source: 'a0'
};
var LAYER_DEFINITION = {
  id: 'l-1',
  options: {
    type: 'CartoDB',
    color: 'red',
    name: 'Layer Name',
    table_name: 'table_name'
  }
};

var ANALYSIS_NODE_SOURCE = {
  get: function () {
    return 'Source';
  },
  isSourceType: function () {
    return true;
  },
  getColor: function () {
    return '#fabada';
  }
};

var ANALYSIS_NODE_NO_SOURCE = {
  get: function () {
    return 'Sampling';
  },
  isSourceType: function () {
    return false;
  },
  getColor: function () {
    return '#fabada';
  }
};

describe('editor/widgets/widget-view', function () {
  var view;
  var layerDefinitionModel;
  var stackLayoutModel;
  var widgetDefinitionModel;

  beforeEach(function () {
    jasmine.clock().install();

    widgetDefinitionModel = new WidgetDefinitionModel(WIDGET_DEFINITION, {
      configModel: {},
      mapId: 'm-123'
    });

    layerDefinitionModel = new LayerDefinitionModel(LAYER_DEFINITION, {
      parse: true,
      configModel: {}
    });
    layerDefinitionModel.findAnalysisDefinitionNodeModel = function () {
      return ANALYSIS_NODE_SOURCE;
    };

    stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['nextStep']);

    spyOn(EditorWidgetView.prototype, '_renameWidget');

    view = new EditorWidgetView({
      modals: FactoryModals.createModalService(),
      userActions: {},
      model: widgetDefinitionModel,
      layer: layerDefinitionModel,
      stackLayoutModel: stackLayoutModel,
      querySchemaModel: {}
    });

    view.render();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
    view.remove();
  });

  describe('.render', function () {
    it('should render correctly', function () {
      expect(view.$el.html()).toContain(WIDGET_DEFINITION.title);
      expect(view.$el.text()).toContain(WIDGET_DEFINITION.source);
      expect(view.$('.js-toggle-menu').length).toBe(1);
      expect(view.$el.html()).toContain(LAYER_DEFINITION.options.table_name);
    });
  });

  describe('when node is an analysis', function () {
    beforeEach(function () {
      layerDefinitionModel.findAnalysisDefinitionNodeModel = function () {
        return ANALYSIS_NODE_NO_SOURCE;
      };
      view.render();
    });
    describe('.render', function () {
      it('should render properly', function () {
        expect(view.$el.html()).toContain('CDB-IconFont-ray');
        expect(view.$el.html()).toContain(LAYER_DEFINITION.options.name);
      });
    });
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  it('should contain js-widgetItem class', function () {
    expect(view.$el.hasClass('js-widgetItem')).toBeTruthy();
  });

  it('should add a data attribute with the model cid', function () {
    expect(view.$el.data('model-cid')).toBe(widgetDefinitionModel.cid);
  });

  it('should show context menu', function () {
    view.$('.js-toggle-menu').click();
    expect(view._contextMenuFactory.getContextMenu().$('[data-val="rename-widget"]').length).toBe(1);
    expect(view._contextMenuFactory.getContextMenu().$('[data-val="delete-widget"]').length).toBe(1);
    document.body.removeChild(view._contextMenuFactory.getContextMenu().el);
  });

  it('should rename', function () {
    var event = $.Event('keyup');
    event.which = ENTER_KEY_CODE;

    view.$('.js-toggle-menu').click();
    view._contextMenuFactory.getContextMenu().$('[data-val="rename-widget"]').click();
    view.$('.js-input').val('foo').trigger('keyup');
    view.$('.js-input').trigger(event);
    expect(EditorWidgetView.prototype._renameWidget).toHaveBeenCalled();
  });

  describe('when clicking on remove', function () {
    it('should remove widget with WidgetsService', function () {
      spyOn(WidgetsService, 'removeWidget');
      view.$('.js-toggle-menu').click();
      view._contextMenuFactory.getContextMenu().$('[data-val="delete-widget"]').click();
      expect(WidgetsService.removeWidget).toHaveBeenCalledWith(widgetDefinitionModel);
    });
  });

  it('should edit widget with WidgetsService', function () {
    spyOn(WidgetsService, 'editWidget');
    view.$('.js-title').trigger('click');
    jasmine.clock().tick(201);
    expect(WidgetsService.editWidget).toHaveBeenCalledWith(widgetDefinitionModel);
  });
});
