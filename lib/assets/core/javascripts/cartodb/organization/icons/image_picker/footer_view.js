var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var FooterView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/footer_view');

module.exports = FooterView.extend({

  initialize: function() {
    this.elder('initialize');
    this._template = cdb.templates.getTemplate('organization/icons/image_picker/footer_template');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(this._template({
      disclaimer: this.model.get('disclaimer')
    }));

    return this;
  }
});
