var _ = require('underscore');

var LEGEND_TYPES_PER_ATTRIBUTE = {
  color: ['category', 'choropleth', 'custom', 'custom_choropleth', 'torque'],
  size: ['bubble']
};

function LegendBuffer (opts) {
  this.queue = [];
  this.running = false;
  this._legendDefinitionsCollection = opts.legendDefinitionsCollection;
}

LegendBuffer.prototype.add = function (model, callback) {
  this._cleanQueue(model.get('layer_id'), model.get('type'));
  this.queue.push(model);

  if (!this.running) {
    this.running = true;
    this._run(callback);
  }
};

LegendBuffer.prototype._run = function (callback) {
  if (this.running === false || this.queue.length === 0) {
    this.running = false;
    return;
  }

  var model = this.queue.shift();

  this._removePrevious(model.layerDefinitionModel.get('id'), model.get('type'), function () {
    model.save(null, {
      success: function (model) {
        this._legendDefinitionsCollection.add(model);
        this._run();
      }.bind(this),
      complete: function () {
        callback && callback();
      }
    });
  }.bind(this));
};

LegendBuffer.prototype._removePrevious = function (layer_id, type, callback) {
  var types = this._findSameType(type);

  var removeLegends = this._legendDefinitionsCollection.filter(function (legend) {
    return legend.get('layer_id') === layer_id && _.includes(types, legend.get('type'));
  });
  var legendsLeft = removeLegends.length;

  if (this._legendDefinitionsCollection.size() === 0 || removeLegends.length === 0) {
    callback && callback();
    return;
  }

  _.each(removeLegends, function (legend) {
    legend.destroy({
      complete: function () {
        // In case there's more than one legend to be removed (shouldn't be possible), we should wait for all to be removed
        legendsLeft = legendsLeft - 1;
        if (legendsLeft === 0) {
          callback && callback();
        }
      }
    });
  });
};

LegendBuffer.prototype._cleanQueue = function (layer_id, type) {
  var types = this._findSameType(type);

  this.queue = _.reject(this.queue, function (legend) {
    return legend.get('layer_id') === layer_id && _.includes(types, legend.get('type'));
  });
};

LegendBuffer.prototype._findSameType = function (type) {
  return _.find(LEGEND_TYPES_PER_ATTRIBUTE, function (collection, name) {
    return _.include(collection, type);
  });
};

LegendBuffer.prototype.findLegend = function (layer_id, type) {
  return _.findWhere(this.queue, { layer_id: layer_id, type: type });
};

module.exports = LegendBuffer;
