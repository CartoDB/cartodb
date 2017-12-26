var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({

  className: 'Georeference-estimation',

  initialize: function() {
    if (!_.isBoolean(this.options.hasHardLimit)) throw new Error('hasHardLimit is required');
    if (!this.options.userGeocoding) throw new Error('userGeocoding is required');
    this._initBinds();
  },

  render: function() {
    var estimation = this.model.get('estimation');
    var rows = this.model.get('rows');

    this.$el.html(
      this.getTemplate('common/dialogs/georeference/street_addresses/estimation')({
        hasEstimation: estimation !== undefined && rows !== undefined,
        hasHardLimit: this.options.hasHardLimit,
        costInCredits: this.model.costInCredits(),
        costInDollars: this.model.costInDollars(),
        blockPriceInDollars: this.options.userGeocoding.blockPriceInDollars(),
        hasRows: rows !== 0
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change error', this.render, this);
  }

});
