var cdb = require('cartodb.js');
var _ = require('underscore');
var TableBodyCellView = require('./table-body-cell-view');

/*
 *  Table body row view
 */

module.exports = cdb.core.View.extend({

  className: 'Table-row',
  tagName: 'tr',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._columnsCollection = this._querySchemaModel.columnsCollection;

    this.el.setAttribute('data-model', this.model.cid);

    this._initBinds();
  },

  render: function () {
    this._generateRowsHTML();
    return this;
  },

  _initBinds: function () {
    this.model.bind('remove', this.remove, this);
  },

  _generateRowsHTML: function () {
    var geom = this._querySchemaModel.getGeometry();
    var simpleGeometry = geom.getSimpleType();
    var html = '';

    _.each(this.model.attributes, function (value, key) {
      var columnModel = _.first(this._columnsCollection.where({ name: key }));
      var columnType = columnModel.get('type');

      if (columnType !== 'geometry') {
        html += '<td>' + value + '</td>';
      } else {
        html += '<td>' + simpleGeometry + '</td>';
      }

      // var view = new TableBodyCellView({
      //   value: value,
      //   column: key,
      //   type: columnType,
      //   geometry: simpleGeometry
      // });
      // this.addView(view);
      // this.$el.append(view.render().el);
    }, this);

    this.el.innerHTML = html;
  }
});
