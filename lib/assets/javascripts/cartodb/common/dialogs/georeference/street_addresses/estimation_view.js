var _ = require('underscore');
var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  className: 'Georeference-estimation',

  initialize: function() {
    if (!_.isBoolean(this.options.hasHardLimit)) throw new Error('hasHardLimit is required');
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
        hasRows: rows !== 0
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change error', this.render, this);
  }

});
