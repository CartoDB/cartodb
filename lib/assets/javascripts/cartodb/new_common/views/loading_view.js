var cdb = require('cartodb.js');
var randomQuote = require('../view_helpers/random_quote');

/**
 * General view for a loading view, works well with tabpane.
 */
module.exports = cdb.core.View.extend({

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('new_common/templates/loading')({
        title: this.model.get('loadingTitle'),
        quote: randomQuote()
      })
    );

    return this;
  }
});
