var cdb = require('cartodb.js');
var _ = require('underscore');
var BaseDialog = require('../../views/base_dialog/view');
var pluralizeString = require('../../view_helpers/pluralize_string');
var randomQuote = require('../../view_helpers/random_quote');

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
    if (!this.options.model) throw new TypeError('model is required');
    this.elder('initialize');

    this.model.bind('change', function() {
      if (this.model.get('state') === 'ProcessItemsDone') {
        this.close();
      } else {
        this.render();
      }
    }, this);
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return this['_render' + this.model.get('state')]();
  },

  _renderConfirmChangeLock: function() {
    // An entity can be an User or Organization
     var itemsCount = this.model.get('items').length;
     var singularOrPlural = itemsCount === 1;
     var areLocked = this.model.get('initialLockValue');

     return cdb.templates.getTemplate('common/dialogs/change_lock/change_lock_template')({
       areLocked: areLocked,
       itemsCount: itemsCount,
       thisOrTheseStr: singularOrPlural ? 'this' : 'these',
       itOrTheyStr: singularOrPlural ? 'it' : 'they',
       contentTypePluralized: pluralizeString(this.model.get('contentType') === 'datasets' ? 'dataset' : 'map', itemsCount),
       positiveOrNegativeStr: areLocked ? 'positive' : 'negative',
       lockOrUnlockStr: areLocked ? 'Unlock' : 'Lock'
     });
  },

  /**
   * @overrides BaseDialog.prototype._ok
   */
  _ok: function(e) {
    this.killEvent(e);
    this.model.inverseLock();
    this.render();
  },

  _renderProcessingItems: function() {
    var lockingOrUnlockingStr = this.model.get('initialLockValue') ? 'Unlocking' : 'Locking';
    return cdb.templates.getTemplate('common/templates/loading')({
      title: lockingOrUnlockingStr + ' ' + pluralizeString(this.model.get('contentType') === 'datasets' ? 'dataset' : 'map', this.model.get('items').length) + '…',
      quote: randomQuote()
    });
  },

  _renderProcessItemsFail: function() {
    var lockingOrUnlockingStr = this.model.get('initialLockValue') ? 'unlock' : 'lock';
    return cdb.templates.getTemplate('common/templates/fail')({
      msg: 'Failed to ' + lockingOrUnlockingStr + ' all items'
    });
  }
});
