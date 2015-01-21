var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var batchProcessItems = require('new_common/batch_process_items');
var _ = require('underscore');

/**
 * Lock/unlock datasets/maps dialog.
 */
var View = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-ok' : '_lockItems'
    });
  },

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/lock_items_template');
    this.items = this.options.items; // of model cdb.admin.Visualization
    this.contentType = this.options.contentType; // "datasets" or "maps"
    
    // Assert that items have the same locked state
    if (_.chain(this.items)
        .map(function(item) { return item.get('locked'); })
        .uniq().value().length > 1) {
      var errorMsg = 'It is assumed that all items have the same locked state, a user should never be able to ' +
        'select a mixed item with current UI. If you get an error with this message something is broken';
      if (window.trackJs && window.trackJs.track) {
        trackJs.track(errorMsg);
      } else {
        throw new Error(errorMsg);
      }
    }
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   * Note since the AsyncFetchOnFirstRender mixin this render method is delayed until all required data is fetched, 
   * see the mixin for further details on its behaviour in case of fail/timeout.
   */
  render_content: function() {
    // An entity can be an User or Organization
    var itemsCount = this.items.length;
    var singularOrPlural = itemsCount === 1;
    var areLocked = this._areLocked();

    return this.template({
      areLocked: areLocked,
      itemNames: _.map(this.items, function(item) { return item.get('name'); }),
      itemsCount: itemsCount,
      thisOrTheseStr: singularOrPlural ? 'this' : 'these',
      itOrTheyStr: singularOrPlural ? 'it' : 'they',
      contentTypePluralized: pluralizeString(this.contentType === 'datasets' ? 'dataset' : 'map', itemsCount),
      positiveOrNegativeStr: areLocked ? 'positive' : 'negative',
      lockOrUnlockStr: areLocked ? 'Unlock' : 'Lock'
    });
  },
  
  cancel: function() {
    this.clean();
  },
  
  _areLocked: function() {
    return this.items[0].get('locked');
  },

  _lockItems: function(e) {
    this.killEvent(e);
    this.undelegateEvents();

    var self = this;
    var inversedLockedValue = !this._areLocked();
    batchProcessItems({
      howManyInParallel: 5,
      items: this.items,
      processItem: function(item, callback) {
        item.save({
          locked: inversedLockedValue
        })
          .done(function() { callback(); })
          .fail(function() { callback('should not fail in the first place, see final fail handler below'); });
      },
      done: function() {
        self.trigger('done');
        self.close();
      },
      fail: function() {
        self.trigger('fail');
        // Re-enable events so the user can retry at least
        self.delegateEvents();
      }
    });
  }
});

module.exports = View;
