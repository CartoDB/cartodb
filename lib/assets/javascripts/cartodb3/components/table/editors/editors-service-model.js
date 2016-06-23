var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var EditorView = require('./editor-view');
var EditorViewModel = require('./editor-view-model');
var ESC_KEY_CODE = 27;
var DESTROYED_EDITOR_EVENT = 'destroyedEditor';
var CLICK_OUTSIDE_EDITOR_EVENT = 'clickOutsideEditor';

/**
 * Top-level API to handle editor views.
 *
 * Example:
 * // In some entry-point:
 * table.editors = new EditorsServiceModel();
 *
 * // Later, in any view, calling create will create a new editor viewModel
 * var editorView = table.editors.create(fn);
 *
 * Same concept @viddo introduced with Modals.
 */
module.exports = Backbone.Model.extend({

  /**
   * Creates a new editor view
   *
   * @param {Function} createContentView
   * @return {View} the new editor view
   */
  create: function (createContentView, position) {
    if (!_.isFunction(createContentView)) throw new Error('createContentView is required');
    position = position || {
      x: '50%',
      y: '50%'
    };

    if (!this._editorView) {
      this._editorView = this._newEditorView(position);
      document.body.appendChild(this._editorView.el);
    }

    this._editorView.model.set('createContentView', createContentView);
    this._editorView.render();

    return this._editorView;
  },

  /**
   * Convenience method to add a listener when current editor is destroyed
   *
   * This is the same as doing
   * editors.create(function (model) {
   *   model.once('destroy', callback, context); // <-- same as editors.onDestroyOnce(callback, context);
   *   return new MyView({ … });
   * });
   *
   * @param {Function} callback
   * @param {Object} [context = undefined]
   */
  onDestroyOnce: function (callback, context) {
    this.once(DESTROYED_EDITOR_EVENT, callback, context);
  },

  // onClickOutside: function (callback, context) {
  //   this.once(CLICK_OUTSIDE_EDITOR_EVENT, callback, context);
  // },

  destroy: function () {
    if (this._editorView) {
      this._editorView.model.destroy();
    }
  },

  _newEditorView: function (position) {
    var viewModel = new EditorViewModel();
    this._destroyOnEsc(viewModel);
    this.listenToOnce(viewModel, 'destroy', function () {
      this._editorView = null;
      this.trigger.apply(this, [DESTROYED_EDITOR_EVENT].concat(Array.prototype.slice.call(arguments)));
      this.stopListening(viewModel);
    });
    var view = new EditorView({
      model: viewModel,
      position: position
    });
    this._destroyOnClickOutside(view);
    return view;
  },

  _destroyOnClickOutside: function (view) {
    var destroyOnClickOutside = function (ev) {
      if ($(ev.target).closest(view.el).length === 0) {
        view.model.destroy();
      }
    };
    document.addEventListener('click', destroyOnClickOutside);
    this.listenToOnce(view.model, 'destroy', function () {
      document.removeEventListener('click', destroyOnClickOutside);
    });
  },

  _destroyOnEsc: function (viewModel) {
    var destroyOnEsc = function (ev) {
      if (ev.which === ESC_KEY_CODE) {
        viewModel.destroy();
      }
    };
    document.addEventListener('keydown', destroyOnEsc);
    this.listenToOnce(viewModel, 'destroy', function () {
      document.removeEventListener('keydown', destroyOnEsc);
    });
  }

});
