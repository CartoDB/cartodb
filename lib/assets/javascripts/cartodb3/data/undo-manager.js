var _ = require('underscore');
var UndoManager = require('backbone-undo');

module.exports = {
  init: function (model) {
    if (!model) throw new Error('model is required to initialize undoManager');

    this.model = model;

    this.model._undoManager = new UndoManager({
      register: this.model,
      track: true
    });

    this._trackEvents();
    this._addMethods();
  },

  _trackEvents: function () {
    _.each(['undo', 'redo'], function (eventType) {
      this.model._undoManager.bind(eventType, function () {
        this.trigger(eventType, this.changed, this);
      }, this.model);
    }, this);

    this.model._undoManager.stack.bind('add remove reset', function () {
      this.trigger('unredoChanged', this.changed, this);
    }, this.model);
  },

  _addMethods: function () {
    _.extend(
      this.model,
      {
        undo: function () {
          this._undoManager.undo();
        },

        redo: function () {
          this._undoManager.redo();
        },

        canUndo: function () {
          return this._undoManager.isAvailable('undo');
        },

        canRedo: function () {
          return this._undoManager.isAvailable('redo');
        }
      }
    );
  }
};
