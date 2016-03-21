var _ = require('underscore');
var cdb = require('cartodb.js');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var WidgetDefinitionsCollection = require('../../../../javascripts/cartodb3/data/widget-definitions-collection');

describe('data/widget-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.el = document.createElement('div');
    this.el.id = 'wdmtmp';
    document.body.appendChild(this.el);
    this.dashboard = cdb.deepInsights.createDashboard('#wdmtmp', {
      bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
      user: {},
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      layers: [{
        id: 'l-1',
        type: 'CartoDB'
      }],
      widgets: []
    });

    this.dashboardWidgets = this.dashboard.widgets;
    this.collection = new WidgetDefinitionsCollection([], {
      configModel: configModel,
      visMap: this.dashboard.vis.map,
      dashboardWidgets: this.dashboardWidgets,
      mapId: 'm-123'
    });
  });

  afterEach(function () {
    document.body.removeChild(this.el);
  });

  describe('when a model is created', function () {
    beforeEach(function () {
      spyOn(this.dashboardWidgets, 'createFormulaModel').and.callThrough();
      spyOn(cdb.core.Model.prototype, 'sync');

      this.req = {
        type: 'formula',
        title: 'avg of something',
        layer_id: 'l-1',
        options: {
          column: 'col',
          operation: 'avg'
        }
      };
      this.collection.create(this.req, {
        wait: true
      });
    });

    it('should not have added the widget definition just yet', function () {
      expect(this.collection.isEmpty()).toBe(true);
    });

    it('should set a new order when a widget is created', function () {
      var histogram = {
        type: 'histogram',
        title: 'histogram',
        layer_id: 'l-1',
        options: {
          column: 'col'
        }
      };
      this.collection.create(histogram);
      var widget = this.collection.at(0);
      expect(widget.get('order')).toBe(0);
      widget.set('order', 10);
      var category = {
        type: 'category',
        title: 'category',
        layer_id: 'l-1',
        options: {
          column: 'col'
        }
      };
      this.collection.create(category);
      var widget2 = this.collection.at(1);
      expect(widget2.get('order')).toBe(11);
    });

    describe('when confirmed created', function () {
      beforeEach(function () {
        var response = _.extend(
          {
            id: 'w-100'
          },
          this.req
        );
        cdb.core.Model.prototype.sync.calls.argsFor(0)[2].success(response);
        this.model = this.collection.first();
      });

      it('should add the widget definition model to the collection', function () {
        expect(this.collection.isEmpty()).toBe(false);
        expect(this.model.id).toEqual('w-100');
      });

      it('should create the corresponding widget model for the dashboard', function () {
        expect(this.dashboardWidgets.createFormulaModel).toHaveBeenCalled();
        var args = this.dashboardWidgets.createFormulaModel.calls.argsFor(0);
        expect(args[0]).toEqual(jasmine.objectContaining({
          title: 'avg of something',
          layer_id: 'l-1',
          column: 'col',
          operation: 'avg'
        }));
        expect(args[1]).toBe(this.dashboard.vis.map.layers.first());
      });

      it('should enable show_stats for the created widget model', function () {
        var widgetModel = this.dashboard.widgets.get(this.model.id);
        expect(widgetModel.get('show_stats')).toBeTruthy();
      });

      describe('when definition changes data', function () {
        beforeEach(function () {
          this.widgetModel = this.dashboard.widgets.get(this.model.id);
          spyOn(this.widgetModel, 'update').and.callThrough();

          this.model.set('operation', 'max');
        });

        it('should update the corresponding widget model', function () {
          expect(this.widgetModel.update).toHaveBeenCalled();
          expect(this.widgetModel.update).toHaveBeenCalledWith({ operation: 'max' });
        });
      });

      describe('when definition changes type', function () {
        beforeEach(function () {
          this.widgetModel = this.dashboard.widgets.get(this.model.id);
          spyOn(this.widgetModel, 'remove').and.callThrough();
          spyOn(this.dashboardWidgets, 'createCategoryModel').and.callThrough();

          this.model.changeType('category');
        });

        it('should remove the corresponding widget model', function () {
          expect(this.widgetModel.remove).toHaveBeenCalled();
        });

        it('should keep some attrs', function () {
          expect(this.model.id).toEqual('w-100');
          expect(this.model.get('id')).toEqual('w-100');
          expect(this.model.get('layer_id')).toEqual('l-1');
          expect(this.model.get('sync_on_data_change')).toBe(true);
          expect(this.model.get('sync_on_bbox_change')).toBe(true);
          expect(this.model.get('title')).toEqual('avg of something');
        });

        it('should have new relevant attrs', function () {
          expect(this.model.get('type')).toEqual('category');
          expect(this.model.get('column')).toEqual('col');
          expect(this.model.get('aggregation')).toEqual('count');
          expect(this.model.get('aggregation_column')).toEqual('col');
        });

        it('should remove attrs of no interest anymore', function () {
          expect(this.model.get('operation')).toBeUndefined();
        });

        it('should create a new widget model for the type', function () {
          expect(this.dashboardWidgets.createCategoryModel).toHaveBeenCalled();
          // Same ceation flow as previously tested, so don't test more into detail for now
          expect(this.dashboardWidgets.createCategoryModel).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object));
        });

        it('should set show_stats in the new widget model', function () {
          var widgetModel = this.dashboardWidgets.get(this.model.id);
          expect(widgetModel.get('show_stats')).toBeTruthy();
        });
      });

      describe('when definition is destroyed', function () {
        beforeEach(function () {
          this.widgetModel = this.dashboard.widgets.get(this.model.id);
          spyOn(this.widgetModel, 'remove').and.callThrough();

          // Fake deletion
          this.model.trigger('destroy', this.model);
        });

        it('should remove the corresponding widget model', function () {
          expect(this.widgetModel.remove).toHaveBeenCalled();
        });
      });
    });
  });
});
