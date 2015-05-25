var cdb = require('cartodb.js');
var moment = require('moment');

/**
 * Represents the XYZ tab content.
 */
module.exports = cdb.core.View.extend({

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/nasa/nasa')({
        todayDateStr: moment().format('YYYY-MM-DD')
      })
    );

    return this;
  }
});
