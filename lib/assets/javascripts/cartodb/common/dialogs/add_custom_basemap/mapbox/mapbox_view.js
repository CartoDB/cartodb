var cdb = require('cartodb.js-v3');
var ViewFactory = require('../../../view_factory.js');
var randomQuote = require('../../../view_helpers/random_quote.js');


/**
 * Represents the Mapbox tab content.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-ok': '_onClickOK',
    'keydown': '_onKeyDown',
    'keyup': '_onKeyUp'
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
          url: this.model.get('url'),
          accessToken: this.model.get('accessToken'),
          lastErrorMsg: this.model.get('lastErrorMsg')
        });
    }
    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  _hasValues: function() {
    return this._urlVal() && this._accessToken();
  },

  _urlVal: function() {
    return this.$('.js-url').val();
  },

  _accessToken: function() {
    return this.$('.js-access-token').val();
  },

  _onClickOK: function(ev) {
    this.killEvent(ev);
    if (this._hasValues()) {
      var url = this._urlVal();
      var accessToken = this._accessToken();
      this.model.save(url, accessToken);
    }
  },

  _onKeyDown: function(ev) {
    ev.stopPropagation();
    this.$('.js-error').removeClass('is-visible');
  },

  _onKeyUp: function(ev) {
    ev.stopPropagation();
    this.$('.js-ok').toggleClass('is-disabled', !this._hasValues());
  }

});
