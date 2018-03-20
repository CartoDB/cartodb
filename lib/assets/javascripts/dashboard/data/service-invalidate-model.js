const Backbone = require('backbone');

/**
 *  Invalidate service token
 *
 *  - It needs a datasource name or it won't work.
 */

module.exports = Backbone.Model.extend({
  idAttribute: 'datasource',

  url: function () {
    return `/api/v1/imports/service/${this.get(this.idAttribute)}/invalidate_token`;
  }
});
