module.exports = function (options) {
  var type = options.columnType;
  var collection = options.columnsCollection;

  var error = {
    type: options.type,
    message: _t('components.backbone-forms.column-type-error', { columnType: type })
  };

  return function columnType (value) {
    var column = collection.findWhere({ name: value });
    var matchesType = column && column.get('type') === type;

    if (!matchesType) return error;
  };
};
