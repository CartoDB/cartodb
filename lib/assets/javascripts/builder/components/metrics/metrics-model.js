var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({

  defaults: {
    eventName: '',
    eventProperties: {}
  },

  url: function () {
    return this._configModel.get('base_url') + '/api/v3/metrics';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) { throw new Error('configModel is required'); }

    this._userId = opts.userId;
    this._visId = opts.visId;
    this._configModel = opts.configModel;
  },

  toJSON: function () {
    return {
      name: this.get('eventName'),
      properties: _.extend(
        {},
        this.get('eventProperties'),
        {
          visualization_id: this._visId,
          user_id: this._userId
        }
      )
    };
  }
});
