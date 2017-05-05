var FormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/deprecated-sql-function-form-model');
var analyses = require('../../../../../../../../javascripts/cartodb3/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/deprecated-sql-function-form-model', function () {
  var cdbSQLBackup;

  beforeEach(function () {
    this.configModel = new Backbone.Model({});

    cdbSQLBackup = cdb.SQL;
    cdb.SQL = function () {
      return {
        execute: function () {}
      };
    };

    this.layerDefinitionModel = new Backbone.Model({});
    this.layerDefinitionModel.findAnalysisDefinitionNodeModel = function () {
      var node = {
        id: 808,
        letter: function () { return 'A'; },
        querySchemaModel: new Backbone.Model({
          query: 'SELECT * FROM somewhere;'
        })
      };
      return node;
    };
    this.layerDefinitionModel.getName = function () { return 'Metro Madrid'; };

    this.analysisSourceOptionsModel = new Backbone.Model({
      fetching: false
    });

    this.initializeOptions = {
      analyses: analyses,
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel
    };

    this.formModel = new FormModel(null, this.initializeOptions);
  });

  afterEach(function () {
    cdb.SQL = cdbSQLBackup;
  });

  it('should fail', function () {
    expect(false).toBe(true);
  });
});
