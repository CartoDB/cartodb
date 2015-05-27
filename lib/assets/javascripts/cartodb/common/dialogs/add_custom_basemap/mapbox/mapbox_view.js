var cdb = require('cartodb.js');
var ViewFactory = require('../../../view_factory.js');
var randomQuote = require('../../../view_helpers/random_quote.js');


/**
 * Represents the Mapbox tab content.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-ok': '_onClickOK'
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var view;
    switch (this.model.get('currentView')) {
      case 'validatingInputs':
        view = ViewFactory.createByTemplate('common/templates/loading', {
          title: 'Validating…',
          quote: randomQuote()
        });
        break;
      case 'enterURL':
      default:
        view = ViewFactory.createByTemplate('common/dialogs/add_custom_basemap/mapbox/enter_url', {
        });
        break;
    }
    this.addView(view);
    this.$el.append(view.render().el);
    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  _onClickOK: function(ev) {
    this.killEvent(ev);
    var url = this.$('.js-url').val();
    var accessToken = this.$('.js-access-token').val();
    this.model.save(url, accessToken);
  }
});
