var d3 = require('d3');
var _ = require('underscore');
var GeoJSONDataProviderBase = require('./geojson-data-provider-base');

var HistogramGeoJSONDataProvider = function (vectorLayerView, layerIndex) {
  GeoJSONDataProviderBase.apply(this, arguments);
};

_.extend(HistogramGeoJSONDataProvider.prototype, GeoJSONDataProviderBase.prototype);

HistogramGeoJSONDataProvider.prototype.getData = function () {
  var options = this._dataview.attributes;
  var filter = this._vectorLayerView.getFilter(this._layerIndex);
  var columnName = options.column;
  var end, start, bins, width, values;
  var numberOfBins = options.bins || options.data.length;
  if (options.own_filter === 1) {
    end = filter.getMax(columnName);
    start = filter.getMin(columnName);
    values = filter.getValues();
    bins = d3.layout.histogram().bins(numberOfBins)(values.map(function (f) {
      return f.properties[options.column];
    }));
    width = (end - start) / options.data.length;
  } else {
    end = options.end || filter.getMax(columnName);
    start = typeof options.start === 'number' ? options.start : filter.getMin(columnName);
    width = (end - start) / options.bins;
    values = filter.getValues(false, columnName);
    bins = d3.layout.histogram().range([start, end]).bins(numberOfBins)(values.map(function (f) {
      return f.properties[options.column];
    }));
  }
  bins = bins.map(function (bin, index) {
    return {
      bin: index,
      max: d3.max(bin),
      min: d3.min(bin),
      avg: d3.mean(bin),
      freq: bin.length
    };
  });
  var nulls = values.reduce(function (p, c) { return p + (c.properties[columnName] === null ? 1 : 0); }, 0);
  var average = bins.reduce(function (p, c) {
    return p + c.avg;
  }, 0) / bins.reduce(function (p, c) {
    return p + c.freq;
  }, 0);
  var histogram = {
    'bin_width': width,
    'bins_count': bins.length,
    'bins_start': start,
    'nulls': nulls,
    'avg': average,
    'bins': bins,
    'type': 'histogram'
  };
  return histogram;
};

HistogramGeoJSONDataProvider.prototype.applyFilter = function (filter) {
  var columnName = this._dataview.get('column');
  var filterOptions;
  if (filter.isEmpty()) {
    filterOptions = { column: columnName, min: 0, max: Infinity };
  } else {
    filterOptions = { column: columnName, min: filter.get('min'), max: filter.get('max') };
  }

  this._vectorLayerView.applyFilter(this._layerIndex, 'range', filterOptions);
};

module.exports = HistogramGeoJSONDataProvider;
