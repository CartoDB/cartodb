var Backbone = require('backbone');
var $ = require('jquery');
var getValue = require('./get-object-value');
var tileErrorImage = require('../../themes/img/tile-error.svg');

var TILE_ERROR_IMAGE = 'data:image/svg+xml;base64,' + window.btoa(tileErrorImage);

var TileErrorCollection = Backbone.Collection.extend({
  initialize: function () {
    this.running = false;
    this.queue = new Backbone.Collection();

    this.on('add', this._onAdd, this);
  },

  resetErrorTiles: function () {
    this.running = false;
    this.queue.reset();

    var models = this.filter(function (model) {
      return !this._deletedNode(model.get('tileDomNode'));
    }.bind(this));

    this.reset(models);
  },

  getError: function () {
    var model = this.find(function (model) {
      return model.has('error');
    });

    return model && model.get('error');
  },

  _onAdd: function (model) {
    var isInQueue = this.queue.findWhere({ url: model.get('url') });
    if (!isInQueue) this.queue.add(model);

    model.get('tileDomNode').src = TILE_ERROR_IMAGE;

    if (!this.running) {
      this.running = true;
      this._getTileErrors();
    }
  },

  _getTileErrors: function () {
    if (!this.running) return;

    var model = this.queue.find(function (model) {
      return !model.get('checked');
    });

    if (this.getError() || !model) {
      this.running = false;
      return;
    }

    $.ajax({
      url: model.get('url'),
      success: function () {
        model.get('tileDomNode').src = model.get('url');
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

  _deletedNode: function (tileDomNode) {
    return !document.body.contains(tileDomNode);
  }
});

module.exports = TileErrorCollection;
