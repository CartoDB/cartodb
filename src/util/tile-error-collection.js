var Backbone = require('backbone');
var $ = require('jquery');
var getValue = require('./get-object-value');
var tileErrorImage = require('../../themes/img/tile-error.svg');

var TILE_ERROR_IMAGE = 'data:image/svg+xml;base64,' + window.btoa(tileErrorImage);

var TileErrorCollection = Backbone.Collection.extend({
  initialize: function () {
    this.running = false;
    this.queue = new Backbone.Collection();

    this.on('add', function (model) {
      var isInQueue = this.queue.findWhere({ url: model.get('url') });
      if (!isInQueue) this.queue.add(model);

      model.get('node').src = TILE_ERROR_IMAGE;

      if (!this.running) this._getTileErrors();
    });
  },

  resetErrorTiles: function () {
    var models = this.filter(function (model) {
      this._deletedNode(model.get('node'));
    }.bind(this));

    this.reset(models);
  },

  getError: function () {
    var model = this.find(function (model) {
      return model.has('error');
    });

    return model && model.get('error');
  },

  _getTileErrors: function () {
    var model = this.queue.find(function (model) {
      return !model.get('checked');
    });

    if (!model) {
      this.running = false;
      return;
    }

    this.running = true;

    if (this._deletedNode(model.get('node'))) {
      this.queue.remove(model);
      return this._getTileErrors();
    }

    $.ajax({
      url: model.get('url'),
      success: function () {
        model.get('node').src = model.get('url');
      },
      error: function (jqXHR) {
        var errors = getValue(jqXHR, 'responseJSON.errors_with_context', []);
        model.set('error', errors[0]);
      },
      complete: function () {
        model.set('checked', true);
        this._getTileErrors();
      }.bind(this)
    });
  },

  _deletedNode: function (node) {
    return !document.body.contains(node);
  }
});

module.exports = TileErrorCollection;
