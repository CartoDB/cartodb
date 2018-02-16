var Backbone = require('backbone');
var $ = require('jquery');
var ConfigModel = require('builder/data/config-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var WidgetHeader = require('builder/editor/widgets/widgets-form/widget-header');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');
var FactoryModals = require('../../../factories/modals');

describe('editor/widgets/widgets-form/widgets-header', function () {
  var nodeDefModel;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    nodeDefModel = new Backbone.Model({
      id: 'a0',
      type: 'source',
      table_name: 'kvothe'
    });
    nodeDefModel.isSourceType = function () {
      return true;
    };

    var layerDefinitionModel = new LayerDefinitionModel({
      id: 'l1',
      color: 'red',
      name: 'Kvothe Kingskiller',
      kind: 'carto',
      table_name: 'kvothe'
    }, {
      parse: false,
      configModel: configModel
    });

    layerDefinitionModel.findAnalysisDefinitionNodeModel = function () {
      return nodeDefModel;
    };

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

    this.modals = FactoryModals.createModalService();

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);

    spyOn(WidgetHeader.prototype, '_confirmDeleteWidget');
    spyOn(WidgetHeader.prototype, '_renameWidget');

    this.view = new WidgetHeader({
      userActions: {},
      modals: this.modals,
      model: this.widgetDefinitionModel,
      layerDefinitionModel: layerDefinitionModel,
      stackLayoutModel: this.stackLayoutModel,
      configModel: configModel
    });

    this.view.render();
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(this.view.$('.js-toggle-menu').length).toBe(1);
      expect(this.view.$('.js-title').length).toBe(1);
      expect(this.view.$('.js-title').text()).toContain('some title');
      expect(this.view.$el.html()).toContain('a0');
      expect(this.view.$el.html()).toContain('kvothe');
    });
  });

  describe('when node is an analysis', function () {
    describe('.render', function () {
      beforeEach(function () {
        nodeDefModel.isSourceType = function () {
          return false;
        };
        this.view.render();
      });

      it('should render properly', function () {
        expect(this.view.$el.html()).toContain('Kvothe Kingskiller');
        expect(this.view.$el.html()).toContain('CDB-IconFont-ray');
      });
    });
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
