var $ = require('jquery');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var EditorWidgetView = require('../../../../../javascripts/cartodb3/editor/widgets/widget-view');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/data/widget-definition-model');
var WidgetsService = require('../../../../../javascripts/cartodb3/editor/widgets/widgets-service');

describe('editor/widgets/widget-view', function () {
  var model;
  var view;
  var layer;
  var stackLayoutModel;

  beforeEach(function () {
    jasmine.clock().install();

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    model = new WidgetDefinitionModel({
      type: 'formula',
      title: 'AVG districts homes',
      column: 'areas',
      operation: 'avg',
      layer_id: 'l-1'
    }, {
      configModel: configModel,
      mapId: 'm-123'
    });

    layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        color: 'red',
        name: 'layerrr'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['nextStep']);

    spyOn(EditorWidgetView.prototype, '_renameWidget');

    view = new EditorWidgetView({
      modals: {},
      userActions: {},
      model: model,
      layer: layer,
      stackLayoutModel: stackLayoutModel,
      querySchemaModel: {}
    });

    view.render();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
    view.remove();
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  it('should contain js-widgetItem class', function () {
    expect(view.$el.hasClass('js-widgetItem')).toBeTruthy();
  });

  it('should add a data attribute with the model cid', function () {
    expect(view.$el.data('model-cid')).toBe(model.cid);
  });

  it('should render correctly', function () {
    expect(view.$el.text()).toContain('AVG districts home');
    expect(view.$('.SelectorLayer-letter').length).toBe(1);
    expect(view.$('.js-toggle-menu').length).toBe(1);
    expect(view.$el.text()).toContain('layerrr');
  });

  it('should show context menu', function () {
    view.$('.js-toggle-menu').click();
    expect(view._contextMenuFactory.getContextMenu().$('[data-val="rename-widget"]').length).toBe(1);
    expect(view._contextMenuFactory.getContextMenu().$('[data-val="delete-widget"]').length).toBe(1);
    document.body.removeChild(view._contextMenuFactory.getContextMenu().el);
  });

  it('should rename', function () {
    var e = $.Event('keyup');
    e.which = 13;

    view.$('.js-toggle-menu').click();
    view._contextMenuFactory.getContextMenu().$('[data-val="rename-widget"]').click();
    view.$('.js-input').val('foo').trigger('keyup');
    view.$('.js-input').trigger(e);
    expect(EditorWidgetView.prototype._renameWidget).toHaveBeenCalled();
  });

  describe('when clicking on remove', function () {
    it('should remove widget with WidgetsService', function () {
      spyOn(WidgetsService, 'removeWidget');
      view.$('.js-toggle-menu').click();
      view._contextMenuFactory.getContextMenu().$('[data-val="delete-widget"]').click();
      expect(WidgetsService.removeWidget).toHaveBeenCalledWith(model);
    });
  });

  it('should edit widget with WidgetsService', function () {
    spyOn(WidgetsService, 'editWidget');
    view.$('.js-title').trigger('click');
    jasmine.clock().tick(201);
    expect(WidgetsService.editWidget).toHaveBeenCalledWith(model);
  });
});
