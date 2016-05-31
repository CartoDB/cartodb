var _ = require('underscore');
var UndoManager = require('backbone-undo');
var MAXIMUM_STACK_LENGTH = 30;

module.exports = {
  init: function (model, opts) {
    if (!model) throw new Error('model is required to initialize undoManager');

    opts = opts || {};
    this.model = model;

    this.model._undoManager = this.undoManager = new UndoManager({
      maximumStackLength: opts.maximumStackLength || MAXIMUM_STACK_LENGTH,
      register: this.model,
      track: opts.track
    });

    this._trackEvents();
    this._addMethods();

    if (!_.isEmpty(opts.history)) {
      opts.track && this.undoManager.stopTracking();
      this._addHistory(opts.history);
      opts.track && this.undoManager.startTracking();
    }
  },

  _trackEvents: function () {
    _.each(['undo', 'redo'], function (eventType) {
      this.undoManager.bind(eventType, function () {
        this.trigger(eventType, this.changed, this);
      }, this.model);
    }, this);

    this.undoManager.stack.bind('add remove reset', function () {
      this.trigger('unredoChanged', this.changed, this);
    }, this.model);
  },

  _addHistory: function (history) {
    var stack = this.undoManager.stack;

    _.each(history, function (attrs, i) {
      if (history[i + 1]) {
        stack.add({
          after: history[i + 1],
          before: attrs,
          type: 'change',
          undoTypes: this.undoManager.undoTypes,
          object: this.model,
          magicFusionIndex: 0
        });
      }
    }, this);

    stack.pointer = stack.length - 1;
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
        },

        getUndoHistory: function () {
          var list = this._undoManager.stack.toJSON();
          var data = _.reduce(list, function (memo, attrs, i) {
            memo.push(attrs.before);
            return memo;
          }, [], this);
          data.push(this.attributes);
          return data;
        }
      }
    );
  }
};
