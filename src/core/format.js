cdb.core.format = {};

cdb.core.format._formatNumber = function(value) {
  return d3.format(",")(value);
}

cdb.core.format._formatDate = function(value) {
  return d3.time.format("%Y-%m-%d")(value);
}

cdb.core.format.formatValue = function(value) {
  if (_.isNumber(value)) {
    return cdb.core.format._formatNumber(value);
  }
  if (_.isDate(value)) {
    return cdb.core.format._formatDate(value);
  }
  return value;
}
