var BaseDialog = require('new_common/views/base_dialog/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var queue = require('queue-async');
var _ = require('underscore');

var AFFECTED_USERS_SAMPLE_COUNT = 3;

/**
 * Delete items dialog
 */
module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-ok' : '_deleteSelected'
    });
  },

  initialize: function(args) {
    this.elder('initialize');
    this.collection = args.collection;
    this.router = args.router;
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/delete_items/template');
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    var selectedItems = this.collection.where({ selected: true }) || [];
    var totalCount = selectedItems.length;

    // Extract affected users count+sample list from selected items
    var affectedUsersCount = 0;
    var affectedUsersSample = [];
    _.each(selectedItems, function(item) {
      var acl = item.permission.acl || [];
      affectedUsersCount += acl.length;

      var remaining = AFFECTED_USERS_SAMPLE_COUNT - affectedUsersSample.length;
      if (remaining > 0 && acl.length > 0) {
        _.chain(acl.toArray())
          .take(remaining)
          .each(function(aclItem) {
            affectedUsersSample.push(aclItem.get('entity'));
          });
      }
    }, this);

    return this.template({
      totalCount:                totalCount,
      pluralizedContentType:     pluralizeString(this.router.model.get('content_type') === 'datasets' ? 'dataset' : 'map', totalCount),
      affectedUsersCount:        affectedUsersCount,
      affectedUsersSample:       affectedUsersSample,
      affectedUsersSampleCount:  AFFECTED_USERS_SAMPLE_COUNT
    });
  },

  _deleteSelected: function(e) {
    this.killEvent(e);

    var q = queue(5); // # items to destroy in parallel
    _.each(this.collection.where({ selected: true }), function(m) {
      q.defer(function(callback) {
        m.destroy({ wait: true })
          .done(function() {
            callback(null, arguments);
          })
          .fail(function() {
            callback(arguments)
          });
      });
    });

    var self = this;
    q.awaitAll(function(error, results) {
      // error and results contains outcome of the jqXHR requests above, see http://api.jquery.com/jQuery.ajax/#jqXHR
      if (error) {
        // From discussion https://github.com/CartoDB/cartodb/issues/1633#issuecomment-68454003 this should never really
        // happen, so do nothing for now. User won't get any feedback but can click delete again or close the dialog
      } else {
        self.hide();
      }
    })
  }
});
