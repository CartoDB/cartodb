var BaseDialog = require('new_common/views/base_dialog/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var queue = require('queue-async');

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
    var totalCount = this.collection.where({ selected: true }).length;

    return this.template({
      totalCount:            totalCount,
      pluralizedContentType: pluralizeString(this.router.model.get('content_type') === 'datasets' ? 'dataset' : 'map', totalCount)
    })
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
