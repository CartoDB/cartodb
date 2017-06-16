
/*

describe('when a widget-definition is created', function () {
  beforeEach(function () {
    spyOn(this.integrations, '_bindWidgetChanges').and.callThrough();
    spyOn(dashBoard, 'createFormulaWidget').and.callThrough();
    spyOn(WidgetsService, 'editWidget');
    spyOn(WidgetsService, 'removeWidget');

    this.model = this.widgetDefinitionsCollection.add({
      id: 'w-100',
      type: 'formula',
      title: 'avg of something',
      layer_id: 'l-1',
      source: {
        id: 'a0'
      },
      options: {
        column: 'col',
        operation: 'avg'
      }
    });
    this.model.trigger('sync', this.model);
  });

  afterEach(function () {
    // delete widget after test case
    this.widgetModel = dashBoard.getWidget(this.model.id);
    spyOn(this.widgetModel, 'remove').and.callThrough();

    // Fake deletion
    this.model.trigger('destroy', this.model);
    expect(this.widgetModel.remove).toHaveBeenCalled();
  });

  it('should bind widgets changes', function () {
    expect(this.integrations._bindWidgetChanges).toHaveBeenCalled();
  });

  it('should call widgets service properly', function () {
    var widget = dashBoard.getWidget(this.model.id);
    widget.trigger('editWidget', widget);
    expect(WidgetsService.editWidget).toHaveBeenCalled();

    widget.trigger('removeWidget', widget);
    expect(WidgetsService.removeWidget).toHaveBeenCalled();
  });

  it('should create the corresponding widget model for the dashboard', function () {
    expect(dashBoard.createFormulaWidget).toHaveBeenCalled();

    var args = dashBoard.createFormulaWidget.calls.argsFor(0);
    expect(args[0]).toEqual(jasmine.objectContaining({
      title: 'avg of something',
      layer_id: 'l-1',
      column: 'col',
      operation: 'avg',
      source: {id: 'a0'}
    }));
    expect(args[1]).toBe(this.integrations.visMap().layers.first());
  });

  it('should enable show_stats and show_options for the created widget model', function () {
    var widgetModel = dashBoard.getWidget(this.model.id);
    expect(widgetModel.get('show_stats')).toBeTruthy();
    expect(widgetModel.get('show_options')).toBeTruthy();
  });

  describe('when definition changes data', function () {
    beforeEach(function () {
      this.widgetModel = dashBoard.getWidget(this.model.id);
      spyOn(this.widgetModel, 'update').and.callThrough();
    });

    describe('of any normal param', function () {
      beforeEach(function () {
        this.model.set('operation', 'max');
      });

      it('should update the corresponding widget model', function () {
        expect(this.widgetModel.update).toHaveBeenCalled();
        expect(this.widgetModel.update).toHaveBeenCalledWith({ operation: 'max' });
      });
    });

    describe('of the source', function () {
      beforeEach(function () {
        this.model.set({
          operation: 'max',
          source: 'a1'
        });
      });

      it('should maintain normal params but massage the source', function () {
        expect(this.widgetModel.update).toHaveBeenCalled();
        expect(this.widgetModel.update).toHaveBeenCalledWith({
          operation: 'max',
          source: {id: 'a1'}
        });
      });
    });
  });

  describe('when definition changes type', function () {
    beforeEach(function () {
      this.widgetModel = dashBoard.getWidget(this.model.id);
      spyOn(this.widgetModel, 'remove').and.callThrough();
      spyOn(dashBoard, 'createCategoryWidget').and.callThrough();

      this.model.set('type', 'category');
    });

    it('should remove the corresponding widget model', function () {
      expect(this.widgetModel.remove).toHaveBeenCalled();
    });

    describe('should create a new widget model for the type', function () {
      beforeEach(function () {
        expect(dashBoard.createCategoryWidget).toHaveBeenCalled();
        // Same ceation flow as previously tested, so don't test more into detail for now
        expect(dashBoard.createCategoryWidget).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object));
      });

      it('with new attrs', function () {
        expect(dashBoard.createCategoryWidget.calls.argsFor(0)[0]).toEqual(
          jasmine.objectContaining({
            id: 'w-100',
            type: 'category',
            source: {id: 'a0'}
          })
        );
      });

      it('with prev layer-defintion', function () {
        expect(dashBoard.createCategoryWidget.calls.argsFor(0)[1].id).toEqual('l-1');
      });
    });

    it('should set show_stats in the new widget model', function () {
      var widgetModel = dashBoard.getWidget(this.model.id);
      expect(widgetModel.get('show_stats')).toBeTruthy();
    });
  });
});


describe('time series', function () {
  var xhrSpy = jasmine.createSpyObj('xhr', ['abort', 'always', 'fail']);

  var cartocss = 'Map {-torque-frame-count: 256;-torque-animation-duration: 30;-torque-time-attribute: cartodb_id";-torque-aggregation-function: "count(1)";-torque-resolution: 4;-torque-data-aggregation: linear;} #layer {}, #layer[frame-offset=1] {marker-width: 9; marker-fill-opacity: 0.45;} #layer[frame-offset=2] {marker-width: 11; marker-fill-opacity: 0.225;}';

  var animatedChanged1 = {attribute: 'cartodb_id', duration: 24, overlap: false, resolution: 4, steps: 256, trails: 2};
  var animatedChanged2 = {attribute: 'cartodb_id', duration: 24, overlap: false, resolution: 4, steps: 256, trails: 3};

  beforeEach(function () {
    spyOn(Backbone.Model.prototype, 'sync').and.returnValue(xhrSpy);

    this.layerDefModel = new LayerDefinitionModel({
      id: 'wadus',
      kind: 'torque',
      options: {
        sql: 'SELECT * FROM fooo',
        table_name: 'fooo',
        cartocss: cartocss,
        // source: 'd0',
        style_properties: {
          type: 'animation',
          properties: {
            animated: {
              attribute: 'cartodb_id',
              duration: 30,
              overlap: false,
              resolution: 4,
              steps: 256,
              trails: 2
            }
          }
        }
      }
    }, { parse: true, configModel: 'c' });

    this.layerDefinitionsCollection.add(this.layerDefModel);

    this.d0 = this.analysisDefinitionNodesCollection.add({
      id: 'd0',
      type: 'source',
      params: {
        query: 'SELECT * FROM fooo'
      }
    });

    var nodeMod = this.analysis._analysisCollection.at(0);
    spyOn(nodeMod, 'isDone');
  });

  it('should create time-series widget on layer changes', function () {
    var l = this.integrations.visMap().layers.get(this.layerDefModel.id);
    spyOn(this.integrations, '_createTimeseries').and.callThrough();

    expect(l).toBeDefined();
    this.layerDefModel.styleModel.set({animated: animatedChanged1});
    this.layerDefModel.set({alias: 'wadus'});

    expect(this.integrations._createTimeseries).toHaveBeenCalled();
  });

  it('should create only one time-series widget', function () {
    spyOn(this.integrations, '_createTimeseries').and.callThrough();
    this.layerDefModel.styleModel.set({animated: animatedChanged1});
    this.layerDefModel.set({alias: 'wadus'});

    expect(this.integrations._createTimeseries).toHaveBeenCalled();

    Backbone.Model.prototype.sync.calls.argsFor(0)[2].error({
      error: 'abort'
    });

    this.layerDefModel.styleModel.set({animated: animatedChanged2});
    this.layerDefModel.set({alias: 'wadus wadus'});

    expect(this.integrations._createTimeseries).toHaveBeenCalled();

    Backbone.Model.prototype.sync.calls.argsFor(0)[2].success({
      id: '1',
      layer_id: 'wadus',
      options: {
        column: 'cartodb_id',
        bins: 256,
        animated: true,
        sync_on_data_change: true,
        sync_on_bbox_change: true
      },
      order: 0,
      source: {
        id: 'a0'
      },
      style: {
        widget_style: {
          definition: {
            color: {
              fixed: '#F2CC8F',
              opacity: 1
            }
          }
        }
      },
      title: 'time_date__t',
      type: 'time-series'
    });

    expect(this.widgetDefinitionsCollection.length).toBe(1);
  });
});



describe('autoStyle', function () {
  var category;
  var histogram;
  var layerDefinitionModel;
  var nodeDefinitionModel;
  var originalAjax;

  beforeEach(function () {
    originalAjax = Backbone.ajax;
    Backbone.ajax = function () {
      return {
        always: function (cb) {
          cb();
        }
      };
    };

    this.a0 = this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      params: {
        query: 'SELECT * FROM foobar'
      }
    });

    layerDefinitionModel = this.layerDefinitionsCollection.add({
      id: 'integration-test',
      kind: 'carto',
      options: {
        table_name: 'something',
        source: 'a0',
        cartocss: ''
      }
    });

    spyOn(layerDefinitionModel.styleModel, 'resetPropertiesFromAutoStyle').and.callThrough();
    spyOn(layerDefinitionModel.styleModel, 'setPropertiesFromAutoStyle').and.callThrough();

    nodeDefinitionModel = layerDefinitionModel.getAnalysisDefinitionNodeModel();
    nodeDefinitionModel.set('simple_geom', 'point');

    category = this.widgetDefinitionsCollection.add({
      id: 'as1',
      type: 'category',
      title: 'category',
      layer_id: 'integration-test',
      options: {
        column: 'col'
      },
      source: {
        id: 'a0'
      }
    });
    category.trigger('sync', category);

    histogram = this.widgetDefinitionsCollection.add({
      id: 'as2',
      type: 'histogram',
      title: 'histogram',
      layer_id: 'integration-test',
      options: {
        column: 'col'
      },
      source: {
        id: 'a0'
      }
    });
    histogram.trigger('sync', histogram);
  });

  afterEach(function () {
    Backbone.ajax = originalAjax;
    category.trigger('destroy', category);
    histogram.trigger('destroy', category);

    var nodes = document.querySelectorAll('.CDB-Widget-tooltip');
    [].slice.call(nodes).forEach(function (node) {
      var parent = node.parentNode;
      parent.removeChild(node);
    });
  });

  it('should cancel autostyle on remove widget', function () {
    var model = dashBoard.getWidget(category.id);
    spyOn(model, 'cancelAutoStyle');
    model.set({autoStyle: true});

    category.trigger('destroy', category);
    expect(model.cancelAutoStyle).toHaveBeenCalled();
  });

  it('should update layer definition model\'s autostyle properly', function () {
    var model = dashBoard.getWidget(category.id);
    model.set({autoStyle: true});
    expect(layerDefinitionModel.get('autoStyle')).toBe(model.id);
    expect(layerDefinitionModel.styleModel.setPropertiesFromAutoStyle).toHaveBeenCalled();

    model.set({autoStyle: false});
    expect(layerDefinitionModel.get('autoStyle')).toBe(false);
    expect(layerDefinitionModel.styleModel.resetPropertiesFromAutoStyle).toHaveBeenCalled();
  });

  it('should update layer definition model\'s previousCartoCSS only if not autoStyle applied', function () {
    layerDefinitionModel.attributes.cartocss = 'wadus';

    spyOn(layerDefinitionModel, 'set').and.callThrough();
    var categoryModel = dashBoard.getWidget(category.id);
    var histogramModel = dashBoard.getWidget(histogram.id);

    spyOn(categoryModel, 'getAutoStyle').and.returnValue({
      cartocss: '#dummy {}',
      definition: {
        point: {
          color: {
            range: {}
          }
        }
      }
    });

    spyOn(histogramModel, 'getAutoStyle').and.returnValue({
      cartocss: '#dummy {}',
      definition: {
        point: {
          color: {
            range: {}
          }
        }
      }
    });

    layerDefinitionModel.styleModel.setPropertiesFromAutoStyle = function () {};

    categoryModel.set({autoStyle: true});
    expect(layerDefinitionModel.get('autoStyle')).toBe(categoryModel.id);
    expect(layerDefinitionModel.get('cartocss')).toBe('#dummy {}');
    expect(layerDefinitionModel.set).toHaveBeenCalledWith(jasmine.objectContaining({
      previousCartoCSS: 'wadus'
    }));

    histogramModel.set({autoStyle: true});
    expect(layerDefinitionModel.get('autoStyle')).toBe(histogramModel.id);
    expect(categoryModel.get('autoStyle')).toBe(false);
    expect(layerDefinitionModel.set).not.toHaveBeenCalledWith(jasmine.objectContaining({
      previousCartoCSS: '#dummy {}'
    }));
  });

  it('should update layer definition model\'s style properly based on previous custom style', function () {
    var css = '#layer { marker-width: 5; marker-fill: red; marker-fill-opacity: 1; marker-line-width: 1; marker-line-color: #ff0e0e; marker-line-opacity: 1; }';
    var model = dashBoard.getWidget(category.id);

    model.set({ autoStyle: true });

    expect(layerDefinitionModel.get('cartocss_custom')).toBe(false);

    layerDefinitionModel.set({
      previousCartoCSSCustom: true,
      previousCartoCSS: css
    });

    model.set({ autoStyle: false });

    expect(layerDefinitionModel.get('cartocss_custom')).toBe(true);
    expect(layerDefinitionModel.get('cartocss')).toBe(css);
  });

  it('should update layer definition model\'s color properly', function () {
    var model = dashBoard.getWidget(category.id);
    model.set({autoStyle: true}, {silent: true});
    model.set({color: '#fabada'});
    expect(layerDefinitionModel.get('autoStyle')).toBe(model.id);
    expect(layerDefinitionModel.styleModel.setPropertiesFromAutoStyle).toHaveBeenCalled();

    layerDefinitionModel.styleModel.setPropertiesFromAutoStyle.calls.reset();

    model.set({autoStyle: false}, {silent: true});
    model.set({color: '#f4b4d4'});
    expect(layerDefinitionModel.get('autoStyle')).toBe(false);
    expect(layerDefinitionModel.styleModel.setPropertiesFromAutoStyle).not.toHaveBeenCalled();
  });

  it('should disable autoStyle if aggregation is not simple', function () {
    var model = dashBoard.getWidget(category.id);
    model.set({autoStyle: true});
    expect(layerDefinitionModel.get('autoStyle')).toBe(model.id);
    expect(layerDefinitionModel.styleModel.setPropertiesFromAutoStyle).toHaveBeenCalled();

    layerDefinitionModel.styleModel.set({type: 'squares'});
    layerDefinitionModel.save();

    expect(layerDefinitionModel.get('autoStyle')).toBe(false);
    expect(model.get('autoStyle')).toBe(false);
  });
});





*/
