var cdb = require('cartodb.js-v3');

module.exports = cdb.core.Model.extend({

  initialize: function(router) {
    this.router = router;
  },

  breadcrumbTitle: function() {
    var contentType = this.router.model.get('content_type');
    var isLocked = this.router.model.get('locked');

    var title;
    if (contentType === 'datasets') {
      if (isLocked) {
        title = _t('cartodb.dashboard.header.breadcrumb.lck_data');
      } else {
        title = _t('cartodb.dashboard.header.breadcrumb.data');
      }
    } else {
      if (isLocked) {
        title = _t('cartodb.dashboard.header.breadcrumb.lck_maps');
      } else {
        title = _t('cartodb.dashboard.header.breadcrumb.maps');
      }
    }

    return title;
  },

  isOnDatasetsRoute: function() {
    return this.router.model.get('content_type') === 'datasets';
  },

  isOnMapsRoute: function() {
    return this.router.model.get('content_type') === 'maps';
  },

  isOnLockedRoute: function() {
    return !!this.router.model.get('locked');
  }
});
