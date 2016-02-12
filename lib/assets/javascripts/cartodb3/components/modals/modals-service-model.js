var _ = require('underscore');
var cdb = require('cartodb.js');
var ModalView = require('./modal-view');
var ModalViewModel = require('./modal-view-model');

/**
 * Top-level API to handle modals
 * Is intended to be instantiated and registered in some top-level namespace to be accessibel within the lifecycle of
 * an client-side application.
 *
 * Example:
 * // In some entry-point:
 * cdb.modals = new ModalsServiceModel();
 *
 * // Later, in any view, calling create will create a new modal viewModel
 * var modalView = cdb.modals.create(fn)
 */
module.exports = cdb.core.Model.extend({

  /**
   * Creates a new modal view
   *
   * @param {Function} createContentView
   * @return {View} the new modal view
   */
  create: function (createContentView) {
    if (!_.isFunction(createContentView)) throw new Error('createContentView is required');

    this.trigger('willCreateModal', modalView);
    var modalView = this._createModalView(createContentView);
    this.trigger('didCreateModal', modalView);

    this._appendToBody(modalView);

    return modalView;
  },

  _createModalView: function (createContentView) {
    var viewModel = new ModalViewModel({
      createContentView: createContentView
    });
    return new ModalView({
      model: viewModel
    });
  },

  _appendToBody: function (modalView) {
    if (this._currentModalView) {
      this._currentModalView.destroy();
    }
    document.body.appendChild(modalView.el);
    modalView.render();
    this._currentModalView = modalView;
  }
});
