var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var VendorScriptsView = require('./vendor_scripts_view');

var REQUIRED_OPTIONS = [
  'data',
  'assetsVersion'
];

module.exports = cdb.core.View.extend({
  initialize: function (options) {
    _.each(REQUIRED_OPTIONS, function (item) {
      if (options[item] === undefined) throw new Error('forbidden view: ' + item + ' is required');
      this[item] = options[item];
    }, this);

    this.template = cdb.templates.getTemplate('common/views/forbidden');
    this._initVendorViews();
  },

  render: function () {
    this.$el.html(this.template());
    return this;
  },

  _initVendorViews: function () {
    var vendorScriptsView = new VendorScriptsView({
      config: this.data.config,
      assetsVersion: this.assetsVersion
    });
    document.body.appendChild(vendorScriptsView.render().el);
    this.addView(vendorScriptsView);
  }
});
