var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');
var TableModel = require('./table-model');

/**
 * Special case of a node model representing a source node.
 */
module.exports = AnalysisDefinitionNodeModel.extend({

  /**
   * @override AnalysisDefinitionNodeModel.prototype.initialize
   */
  initialize: function (attrs, opts) {
    AnalysisDefinitionNodeModel.prototype.initialize.apply(this, arguments);

    var query = this.get('query');
    this.querySchemaModel.set({query: query});

    this.queryGeometryModel.set({
      query: query,
      ready: true
    }, { silent: true });

    this.tableModel = new TableModel({
      name: this.get('table_name')
    }, {
      configModel: opts.configModel
    });

    this.listenTo(this.queryGeometryModel, 'change:simple_geom', this._onGeometryTypeChanged);
  },

  fetchTable: function () {
    if (!this.tableModel.get('id')) {
      this.tableModel.fetch();
    }
  },

  _onGeometryTypeChanged: function (m, value) {
    this.set('simple_geom', value);
  }

});
