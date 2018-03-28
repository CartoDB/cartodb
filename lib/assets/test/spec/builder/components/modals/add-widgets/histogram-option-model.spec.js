var _ = require('underscore');
var Backbone = require('backbone');
var HistogramOptionModel = require('builder/components/modals/add-widgets/histogram/histogram-option-model');

describe('components/modals/add-widgets/histogram/histogram-option-model', function () {
  var model;
  var defaultOptions;
  var widgetDefinitionsCollection;
  var layerDefinitionModel;
  var analysisDefinitionNodeModel;
  var defaultTuples;
  var columnModel;

  var createModelFn = function (options, optionsTuples) {
    widgetDefinitionsCollection = new Backbone.Collection({});

    widgetDefinitionsCollection.addWidget = function () {
      return true;
    };

    layerDefinitionModel = new Backbone.Model({
      id: 'layerDefinitionModel1',
      style: new Backbone.Model()
    });

    columnModel = new Backbone.Model({
      name: 'line'
    });

    analysisDefinitionNodeModel = new Backbone.Model({
      id: 'analysesDefinitionNodeModel1'
    });

    defaultTuples = [{
      columnModel: columnModel,
      layerDefinitionModel: layerDefinitionModel,
      analysisDefinitionNodeModel: analysisDefinitionNodeModel
    }];

    defaultOptions = {
      layer_index: '0',
      title: 'default-title',
      tuples: _.extend(defaultTuples, optionsTuples)
    };

    return new HistogramOptionModel(_.extend(defaultOptions, options));
  };

  beforeEach(function () {
    model = createModelFn();
  });

  it('should have a "histogram" type by default', function () {
    expect(model.get('type')).toEqual('histogram');
  });

  it('should return the result of the "addWidget" function from the given widgetDefinitionsCollection', function () {
    var addWidgetSpy = spyOn(widgetDefinitionsCollection, 'addWidget').and.returnValue(true);

    model.save(widgetDefinitionsCollection);

    expect(addWidgetSpy).toHaveBeenCalled();
  });
});
