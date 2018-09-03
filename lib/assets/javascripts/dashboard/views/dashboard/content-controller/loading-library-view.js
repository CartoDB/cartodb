const CoreView = require('backbone/core-view');
const template = require('builder/components/loading/loading.tpl');

/**
 * Data library loading view, since data library is loaded async.
 */
module.exports = CoreView.extend({
  render: function () {
    this.$el.html(
      template({
        title: _t('dashboard.views.dashboard.content_controller.loading_library_view.title'),
        descHTML: _t('dashboard.views.dashboard.content_controller.loading_library_view.desc')
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
