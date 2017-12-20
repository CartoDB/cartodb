var specHelper = require('../../spec-helper');
var WidgetModel = require('../../../src/widgets/widget-model');
var FormulaWidgetContent = require('../../../src/widgets/formula/content-view');
var AnimateValues = require('../../../src/widgets/animate-values');

describe('widgets/formula/content-view', function () {
  var view, model, layerModel, dataviewModel;
  var nodeId = 'a0';

  var createViewFn = function (options) {
    AnimateValues.prototype.animateValue = function () {};
    var vis = specHelper.createDefaultVis();
    var source = vis.analysis.findNodeById(nodeId);

    layerModel = vis.map.layers.first();
    layerModel.set('layer_name', '< & ><h1>Hello</h1>');

    dataviewModel = vis.dataviews.createFormulaModel({
      column: 'col',
      source: source,
      operation: 'avg'
    });
    dataviewModel.set('data', 123, { silent: true });

    model = new WidgetModel({
      title: 'Max population',
      hasInitialState: true
    }, {
      dataviewModel,
      layerModel: layerModel
    });

    view = new FormulaWidgetContent({
      model: model
    });

    return view;
  };

  describe('.render', function () {
    it('should render properly', function () {
      view = createViewFn();
      view.render();

      expect(view.$('.js-title').text()).toContain('Max population');
    });
  });

  describe('when collapsed is true', function () {
    beforeEach(function () {
      view = createViewFn();
      model.set('collapsed', true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$('.js-title').length).toBe(0);
        expect(view.$('.js-value').length).toBe(1);
        expect(view.$('.js-value').text()).toBe('123');
      });

      it('should not disable dataviewModel', function () {
        view.render();

        expect(dataviewModel.get('enabled')).toBeTruthy();
        dataviewModel.set('data', 67);
        expect(view.$('.js-value').text()).toBe('67');
      });
    });
  });

  describe('when description is available', function () {
    var description = 'This is the best widget!';

    describe('.render', function () {
      it('should render properly', function () {
        view = createViewFn();
        view.render();

        expect(view.$('.js-description').length).toBe(0);
        model.set('description', description);
        view.render();

        expect(view.$('.js-description').length).toBe(1);
        expect(view.$('.js-description').text()).toBe(description);
      });
    });
  });

  describe('when show_stats is true', function () {
    describe('.render', function () {
      it('should render properly', function () {
        view = createViewFn();
        view.render();

        expect(view.$('.CDB-Widget-info').length).toBe(0);
        model.set('show_stats', true);
        view.render();

        expect(view.$('.CDB-Widget-info').length).toBe(1);
      });
    });
  });

  describe('when show_source is true', function () {
    var tableName = 'table_name';
    var sourceType = 'sampling';
    var layerName = 'Test Layer Name';

    beforeEach(function () {
      model.set({
        show_source: true,
        table_name: tableName
      });
    });

    describe('when dataViewModel is sourceType', function () {
      describe('.render', function () {
        it('should render properly', function () {
          view.render();

          expect(view.$el.html()).toContain(nodeId);
          expect(view.$el.html()).toContain('Source');
          expect(view.$el.html()).toContain(tableName);
        });
      });
    });

    describe('when dataViewModel is not sourceType', function () {
      beforeEach(function () {
        spyOn(dataviewModel, 'getSourceType').and.returnValue(sourceType);
        spyOn(dataviewModel, 'isSourceType').and.returnValue(false);
        layerModel.set('layer_name', layerName, { silent: true });
      });

      describe('.render', function () {
        it('should render properly', function () {
          view.render();

          expect(view.$('.CDB-IconFont-ray').length).toBe(1);
          expect(view.$el.html()).toContain(nodeId);
          expect(view.$el.html()).toContain('Sampling');
          expect(view.$el.html()).toContain(layerName);
        });
      });
    });
  });

  describe('.initBinds', function () {
    it('should render the widget when the layer name changes', function () {
      view = createViewFn();
      view.render();

      spyOn(view, 'render');
      view._initBinds();
      layerModel.set('layer_name', 'Hello');
      expect(view.render).toHaveBeenCalled();
    });
  });
});
