var $ = require('jquery');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var WidgetHeader = require('../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widget-header');
var WidgetDefinitionModel = require('../../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/widgets/widgets-form/widgets-header', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var layerDefinitionModel = new LayerDefinitionModel({
      id: 'l1',
      color: 'red',
      name: 'layerrr',
      kind: 'carto'
    }, {
      parse: true,
      configModel: configModel
    });

    this.widgetDefinitionModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title',
      type: 'formula',
      layer_id: 'l1',
      source: 'a0',
      column: 'hello',
      operation: 'sum',
      prefix: 'my-prefix'
    }, {
      configModel: configModel,
      mapId: 'm-123'
    });

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);

    spyOn(WidgetHeader.prototype, '_confirmDeleteWidget');
    spyOn(WidgetHeader.prototype, '_renameWidget');

    this.view = new WidgetHeader({
      userActions: {},
      modals: {},
      model: this.widgetDefinitionModel,
      layerDefinitionModel: layerDefinitionModel,
      stackLayoutModel: this.stackLayoutModel
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-toggle-menu').length).toBe(1);
    expect(this.view.$('.js-title').length).toBe(1);
    expect(this.view.$('.js-title').text()).toContain('some title');
  });

  it('should show context menu', function () {
    this.view.$('.js-toggle-menu').click();
    expect(this.view._contextMenuFactory.getContextMenu().$('[data-val="rename-widget"]').length).toBe(1);
    expect(this.view._contextMenuFactory.getContextMenu().$('[data-val="delete-widget"]').length).toBe(1);
  });

  it('should rename', function () {
    var e = $.Event('keyup');
    e.which = 13;

    this.view.$('.js-toggle-menu').click();
    this.view._contextMenuFactory.getContextMenu().$('[data-val="rename-widget"]').click();
    this.view.$('.js-input').val('foo').trigger('keyup');
    this.view.$('.js-input').trigger(e);
    expect(WidgetHeader.prototype._renameWidget).toHaveBeenCalled();
  });

  it('should delete', function () {
    this.view.$('.js-toggle-menu').click();
    this.view._contextMenuFactory.getContextMenu().$('[data-val="delete-widget"]').click();
    expect(WidgetHeader.prototype._confirmDeleteWidget).toHaveBeenCalled();
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
