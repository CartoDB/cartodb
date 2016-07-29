var $ = require('jquery');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var EditorWidgetView = require('../../../../../javascripts/cartodb3/editor/widgets/widget-view');
var WidgetDefinitionModel = require('../../../../../javascripts/cartodb3/data/widget-definition-model');

describe('editor/widgets/widget-view', function () {
  beforeEach(function () {
    jasmine.clock().install();

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new WidgetDefinitionModel({
      type: 'formula',
      title: 'AVG districts homes',
      column: 'areas',
      operation: 'avg',
      layer_id: 'l-1'
    }, {
      configModel: configModel,
      mapId: 'm-123'
    });

    this.layer = new LayerDefinitionModel({
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

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['nextStep']);

    spyOn(EditorWidgetView.prototype, '_confirmDeleteWidget');
    spyOn(EditorWidgetView.prototype, '_renameWidget');

    this.view = new EditorWidgetView({
      modals: {},
      userActions: {},
      model: this.model,
      layer: this.layer,
      stackLayoutModel: this.stackLayoutModel,
      querySchemaModel: {}
    });

    this.view.render();
    this.view.$el.appendTo(document.body);
  });

  afterEach(function () {
    jasmine.clock().uninstall();
    this.view.remove();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should contain js-widgetItem class', function () {
    expect(this.view.$el.hasClass('js-widgetItem')).toBeTruthy();
  });

  it('should add a data attribute with the model cid', function () {
    expect(this.view.$el.data('model-cid')).toBe(this.model.cid);
  });

  it('should render correctly', function () {
    expect(this.view.$el.text()).toContain('AVG districts home');
    expect(this.view.$('.SelectorLayer-letter').length).toBe(1);
    expect(this.view.$('.js-toggle-menu').length).toBe(1);
    expect(this.view.$el.text()).toContain('layerrr');
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
    expect(EditorWidgetView.prototype._renameWidget).toHaveBeenCalled();
  });

  describe('when clicking on remove', function () {
    it('should destroy view', function () {
      this.view.$('.js-toggle-menu').click();
      this.view._contextMenuFactory.getContextMenu().$('[data-val="delete-widget"]').click();
      expect(EditorWidgetView.prototype._confirmDeleteWidget).toHaveBeenCalled();
    });

    describe('when destroyed', function () {
      beforeEach(function () {
        spyOn(this.view, 'clean');
        this.model.trigger('destroy');
      });

      it('should clean the view', function () {
        expect(this.view.clean).toHaveBeenCalled();
      });
    });
  });

  it('should go to next stack layout step if element is clicked', function () {
    this.view.$('.js-title').trigger('click');
    jasmine.clock().tick(201);
    expect(this.stackLayoutModel.nextStep).toHaveBeenCalledWith(this.model, 'widget-content');
  });
});
