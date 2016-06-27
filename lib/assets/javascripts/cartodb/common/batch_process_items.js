var queue = require('queue-async');
var _ = require('underscore-cdb-v3');

/**
 * Convenient object to do async batch processing, and don't continue until all items have successfully finished.
 * In case of error it will fail immediately.
 *
 * Example usage:
 *   var batchProcess = require('../common/batch_process_items');
 *   batchProcess({
 *     items: [ ... ],
 *     done: function() {
 *       this.close();
 *     },
 *     fail: function(jqXHR, errorType, e) {
 *       this._errorMsg = 'Server response: '+ jqXHR.responseText;
 *       this.render();
 *     }
 *   });
 *
 * @param opts {Object}
 *   howManyInParallel: {Number}
 *   items: {Array} each item will be passed to processItem(item, ...
 *   processItem: {Function} given an item and a callback, should call callback() for success case, or callback(error) if something failed.
 *   fail: {Function}
 *   done: {Function} called if all items
 */
module.exports = function(opts) {
  var q = queue(opts.howManyInParallel);
  _.each(opts.items, function(item) {
    q.defer(function(callback) {
      opts.processItem(item, callback);
    });
  });

  q.awaitAll(function(error/*, result1, ..., resultN */) {
    // error and results contains outcome of the jqXHR requests above, see http://api.jquery.com/jQuery.ajax/#jqXHR
    if (error) {
      opts.fail(error);
    } else {
      opts.done();
    }
  });
};
