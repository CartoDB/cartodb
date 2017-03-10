/**
 * Object to generate column options for a current state of a query schema model
 */
var F = function (querySchemaModel) {
  this._querySchemaModel = querySchemaModel;
};

F.prototype.areColumnsUnavailable = function () {
  var status = this._querySchemaModel.get('status');
  return status === 'fetching' || status === 'unavailable';
};

F.prototype.unavailableColumnsHelpMessage = function () {
  if (this._querySchemaModel.get('status') === 'unavailable') {
    return _t('editor.widgets.widgets-form.data.columns-unavailable');
  }
};

F.prototype.create = function (currentVal, columnFilter) {
  columnFilter = columnFilter || function () {
    return true;
  };

  switch (this._querySchemaModel.get('status')) {
    case 'fetching':
      return [{val: _t('editor.widgets.widgets-form.data.loading')}];
    case 'unavailable':
      return [{val: currentVal}];
    default:
      return this._querySchemaModel
        .columnsCollection
        .filter(columnFilter)
        .map(function (m) {
          var columnName = m.get('name');
          return {
            val: columnName,
            label: columnName,
            type: m.get('type')
          };
        });
  }
};

module.exports = F;
