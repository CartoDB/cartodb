var cdb = require('cartodb.js');

/**
 * Data library loading view, since data library is loaded async.
 */
module.exports = cdb.core.View.extend({

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('new_common/templates/loading')({
        title: 'There are no datasets in the library just yet',
        quote: 'Your library is being stocked up as we speak, please come back in a few moments!'
      })
    );

    return this;
  },

  retrySoonAgainOrAbortIfLeavingLibrary: function(collection, routerModel) {
    var timeout;

    var abort = function() {
      clearTimeout(timeout);
      routerModel.unbind('all', abort);
      collection.unbind('reset', abort);
    };

    var retry = function() {
      timeout = setTimeout(function() {
        collection.bind('reset', abort);
        collection.fetch();
      }, 10000);
    };

    routerModel.bind('all', abort);
    retry();
  }
});
