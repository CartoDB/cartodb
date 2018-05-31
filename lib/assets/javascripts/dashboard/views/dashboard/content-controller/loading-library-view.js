const CoreView = require('backbone/core-view');
const template = require('builder/components/loading/loading.tpl');

/**
 * Data library loading view, since data library is loaded async.
 */
module.exports = CoreView.extend({
  render: function () {
    this.$el.html(
      template({
        title: 'Your Data library is being stocked up',
        descHTML: 'Please wait while we load the list of Datasets in the Data library for you.'
      })
    );

    return this;
  },

  retrySoonAgainOrAbortIfLeavingLibrary: function (collection, routerModel) {
    let timeout;

    const abort = function () {
      clearTimeout(timeout);
      routerModel.unbind('all', abort);
      collection.unbind('reset', abort);
    };

    const retry = function () {
      timeout = setTimeout(function () {
        collection.bind('reset', abort);
        collection.fetch();
      }, 10000);
    };

    routerModel.bind('all', abort);
    retry();
  }
});
