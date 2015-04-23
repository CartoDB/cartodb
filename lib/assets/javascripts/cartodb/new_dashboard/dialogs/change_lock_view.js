var cdb = require('cartodb.js');
var BaseDialog = require('../../new_common/views/base_dialog/view');
var pluralizeString = require('../../new_common/view_helpers/pluralize_string');
var _ = require('underscore');
var randomQuote = require('../../new_common/view_helpers/random_quote');

/**
 * Lock/unlock datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-ok': '_ok'
    });
  },

  initialize: function() {
    this.elder('initialize');
    if (!this.options.contentType) {
      throw new TypeError('contentType is required');
    }
    if (!this.options.viewModel) {
      throw new TypeError('viewModel is required');
    }

    this._viewModel = this.options.viewModel;
    this._viewModel.bind('change', function() {
      if (this._viewModel.state() === 'ProcessItemsDone') {
        this.close();
      } else {
        this.render();
      }
    }, this);
    this.add_related_model(this._viewModel);
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return this['_render' + this._viewModel.state()]();
  },

  _renderConfirmChangeLock: function() {
    // An entity can be an User or Organization
    var itemsCount = this._viewModel.length;
    var singularOrPlural = itemsCount === 1;
    var areLocked = this._viewModel.initialLockValue();

    return cdb.templates.getTemplate('new_dashboard/dialogs/change_lock_template')({
      areLocked: areLocked,
      itemsCount: itemsCount,
      thisOrTheseStr: singularOrPlural ? 'this' : 'these',
      itOrTheyStr: singularOrPlural ? 'it' : 'they',
      contentTypePluralized: pluralizeString(this.options.contentType === 'datasets' ? 'dataset' : 'map', itemsCount),
      positiveOrNegativeStr: areLocked ? 'positive' : 'negative',
      lockOrUnlockStr: areLocked ? 'Unlock' : 'Lock'
    });
  },

  /**
   * @overrides BaseDialog.prototype._ok
   */
  _ok: function(e) {
    this.killEvent(e);
    this._viewModel.inverseLock();
    this.render();
  },

  _renderProcessingItems: function() {
    var lockingOrUnlockingStr = this._viewModel.initialLockValue() ? 'Unlocking' : 'Locking';
    return cdb.templates.getTemplate('new_common/templates/loading')({
      title: lockingOrUnlockingStr + ' ' + pluralizeString(this.options.contentType === 'datasets' ? 'dataset' : 'map', this._viewModel.length) + '...',
      quote: randomQuote()
    });
  },

  _renderProcessItemsFail: function() {
    var lockingOrUnlockingStr = this._viewModel.initialLockValue() ? 'unlock' : 'lock';
    return cdb.templates.getTemplate('new_common/templates/fail')({
      msg: 'Failed to ' + lockingOrUnlockingStr + ' all items'
    });
  }
});
