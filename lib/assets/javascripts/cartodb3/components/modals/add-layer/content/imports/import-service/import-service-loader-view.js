var cdb = require('cartodb.js');
var template = require('./import-service-loader.tpl');

/**
 *  Service loader view
 *
 *  - It will be on charge to make token and oauth petitions
 *
 */

module.exports = cdb.core.View.extend({
  events: {
    'click .js-connect': '_checkToken'
  },

  initialize: function (opts) {
    if (!opts.serviceTokenModel) throw new Error('serviceTokenModel prodiver is required');
    if (!opts.serviceOauthModel) throw new Error('serviceOauthModel is required');

    this._serviceTokenModel = opts.serviceTokenModel;
    this._serviceOauthModel = opts.serviceOauthModel;
    this._initBinds();
    this._checkVisibility();
  },

  render: function () {
    this.$el.html(
      template({
        state: this.model.get('state')
      })
    );
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:state', function () {
      this.render();
      this._checkVisibility();
    }, this);
  },

  _checkToken: function () {
    var self = this;
    this.model.set('state', 'token');
    this._serviceTokenModel.fetch({
      success: function (r) {
        if (!r.get('oauth_valid')) {
          self._getOauthURL();
        }
      },
      error: function (e) {
        self._getOauthURL();
      }
    });
  },

  _checkVisibility: function () {
    var state = this.model.get('state');
    if (state !== 'list' && state !== 'selected') {
      this.show();
    } else {
      this.hide();
    }
  },

  _getOauthURL: function () {
    var self = this;
    this.model.set('state', 'oauth');
    this._serviceOauthModel.set({ url: '' }, { silent: true });
    this._serviceOauthModel.fetch({
      error: function () {
        self.model.set('state', 'error');
      }
    });
  }

});
