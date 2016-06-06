var template = require('./infowindow-description.tpl');
var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-toggle': '_toggle'
  },

  initialize: function (opts) {
    if (typeof opts.namesCount === 'undefined') throw new Error('namesCount has to be defined');

    this._namesCount = opts.namesCount;
  },

  render: function () {
    var totalFields = this._namesCount;
    var selectedFields = this.model.fieldCount();

    this.$el.html(
      template({
        allSelected: selectedFields && (selectedFields === totalFields),
        noneSelected: !selectedFields,
        selectedFields: selectedFields
      })
    );

    return this;
  },

  _toggle: function () {
    this.trigger('toggle');
  }
});
