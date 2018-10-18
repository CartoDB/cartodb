var specHelper = require('../../spec-helper');
var WidgetModel = require('../../../../../javascripts/deep-insights/widgets/widget-model');
var FormulaWidgetContent = require('../../../../../javascripts/deep-insights/widgets/formula/content-view');
var AnimateValues = require('../../../../../javascripts/deep-insights/widgets/animate-values');

describe('widgets/formula/content-view', function () {
  var model, layerModel, dataviewModel;
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
      dataviewModel: dataviewModel,
      layerModel: layerModel
    });

    var view = new FormulaWidgetContent({
      model: model
    });

    return view;
  };

  describe('.render', function () {
    it('should render properly', function () {
      this.view = createViewFn();
      this.view.render();

      expect(this.view.$('.js-title').text()).toContain('Max population');
    });
  });

  describe('when collapsed is true', function () {
    beforeEach(function () {
      this.view = createViewFn();
      model.set('collapsed', true);
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$('.js-title').length).toBe(1);
        expect(this.view.$('.js-title').text()).toBe('Max population');
      });

      it('should not disable dataviewModel', function () {
        this.view.render();

        expect(dataviewModel.get('enabled')).toBeTruthy();
        dataviewModel.set('data', 67);
        expect(this.view.$('.js-value').text()).toBe('');
      });
    });
  });

  describe('when description is available', function () {
    var description = 'This is the best widget!';

    describe('.render', function () {
      it('should render properly', function () {
        this.view = createViewFn();
        this.view.render();

        expect(this.view.$('.js-description').length).toBe(0);
        model.set('description', description);
        this.view.render();

        expect(this.view.$('.js-description').length).toBe(1);
        expect(this.view.$('.js-description').text()).toBe(description);
      });
    });
  });

  describe('when show_stats is true', function () {
    describe('.render', function () {
      it('should render properly', function () {
        this.view = createViewFn();
        this.view.render();

        expect(this.view.$('.CDB-Widget-info').length).toBe(0);
        model.set('show_stats', true);
        this.view.render();

        expect(this.view.$('.CDB-Widget-info').length).toBe(1);
      });
    });
  });

  describe('when show_source is true', function () {
    var tableName = 'table_name';
    var sourceType = 'sampling';
    var layerName = 'Test Layer Name';

    beforeEach(function () {
      this.view = createViewFn();
      model.set({
        show_source: true,
        table_name: tableName
      });
    });

    describe('when dataViewModel is sourceType', function () {
      describe('.render', function () {
        it('should render properly', function () {
          this.view.render();

          expect(this.view.$el.html()).toContain(nodeId);
          expect(this.view.$el.html()).toContain('Source');
          expect(this.view.$el.html()).toContain(tableName);
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
          this.view.render();

          expect(this.view.$('.CDB-IconFont-ray').length).toBe(1);
          expect(this.view.$el.html()).toContain(nodeId);
          expect(this.view.$el.html()).toContain('Subsample');
          expect(this.view.$el.html()).toContain(layerName);
        });
      });
    });
  });

  describe('.initBinds', function () {
    it('should render the widget when the layer name changes', function () {
      this.view = createViewFn();
      this.view.render();

      spyOn(this.view, 'render');
      this.view._initBinds();
      layerModel.set('layer_name', 'Hello');
      expect(this.view.render).toHaveBeenCalled();
    });
  });
});
