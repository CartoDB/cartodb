var _ = require('underscore');
var Backbone = require('backbone');
var ModalView = require('./modal-view');
var ModalViewModel = require('./modal-view-model');

var DESTROYED_MODAL_EVENT = 'destroyedModal';

/**
 * Top-level API to handle modals.
 * Is intended to be instantiated and registered in some top-level namespace to be accessible within the lifecycle of
 * an client-side application.
 *
 * Example:
 * // In some entry-point:
 * cdb.modals = new ModalsServiceModel();
 *
 * // Later, in any view, calling create will create a new modal viewModel
 * var modalView = cdb.modals.create(fn)
 *
 * You will probably see the name of "Dialog" here and there, it's the old nomenclature for the concept of Modal.
 */
module.exports = Backbone.Model.extend({

  /**
   * Creates a new modal view
   *
   * @param {Function} createContentView
   * @return {View} the new modal view
   */
  create: function (createContentView, options) {
    if (!_.isFunction(createContentView)) throw new Error('createContentView is required');

    if (!this._modalView) {
      this.trigger('willCreateModal');
      this._modalView = this._newModalView(options);
      this.trigger('didCreateModal', this._modalView);
      document.body.appendChild(this._modalView.el);
    }

    this._modalView.model.set('createContentView', createContentView);
    this._modalView.render();

    return this._modalView;
  },

  /**
   * Convenience method to add a listener when current modal is destroyed
   *
   * This is the same as doing
   * modals.create(function (model) {
   *   model.once('destroy', callback, context); // <-- same as modals.onDestroyOnce(callback, context);
   *   return new MyView({ … });
   * });
   *
   * @param {Function} callback
   * @param {Object} [context = undefined]
   */
  onDestroyOnce: function (callback, context) {
    this.once(DESTROYED_MODAL_EVENT, callback, context);
  },

  destroy: function () {
    if (this._modalView) {
      this._modalView.model.destroy();
    }
  },

  keepOpenOnRouteChange: function () {
    return this._modalView && this._modalView.keepOpenOnRouteChange();
  },

  _newModalView: function (options) {
    var viewModel = new ModalViewModel({
      keepOpenOnRouteChange: options && options.keepOpenOnRouteChange
    });

    this._handleBodyClass(viewModel);

    var escapeOptionsDisabled = options && options.escapeOptionsDisabled;
    var breadcrumbsEnabled = options && options.breadcrumbsEnabled;

    if (!escapeOptionsDisabled) {
      this._destroyOnEsc(viewModel);
    }

    this.listenToOnce(viewModel, 'destroy', function () {
      this._modalView = null;
      this.trigger.apply(this, [DESTROYED_MODAL_EVENT].concat(Array.prototype.slice.call(arguments)));
      this.stopListening(viewModel);
    });

    return new ModalView({
      model: viewModel,
      escapeOptionsDisabled: escapeOptionsDisabled,
      breadcrumbsEnabled: breadcrumbsEnabled
    });
  },

  _destroyOnEsc: function (viewModel) {
    var destroyOnEsc = function (ev) {
      if (ev.keyCode === 27) {
        ev.stopPropagation();
        viewModel.destroy();
      }
    };
    document.addEventListener('keydown', destroyOnEsc);
    this.listenToOnce(viewModel, 'destroy', function () {
      document.removeEventListener('keydown', destroyOnEsc);
    });
  },

  /**
   * TL;DR this method manages document.body class state, to enable scroll inside of an open modal.
   *
   * Some modal content have too much content that can be displayed in the viewport the scroll needs to be enabled.
   * Since the modal is implemented as a fixed positioned element the body needs to be fixated too, for the scroll to
   * be enabled inside the modal instead.
   */
  _handleBodyClass: function (viewModel) {
    var bodyClass = 'is-inDialog';
    document.body.classList.add(bodyClass);
    this.set('open', true);

    this.listenTo(viewModel, 'change:show', function (m, show) {
      document.body.classList[show ? 'add' : 'remove'](bodyClass);
      this.set('open', show);
    });

    this.listenToOnce(viewModel, 'destroy', function () {
      document.body.classList.remove(bodyClass);
      this.set('open', false);
    });
  },

  isOpen: function () {
    return this.get('open') === true;
  }

});
