var cdb = require('cartodb.js-v3');
var UploadModel = require('../../../../background_polling/models/upload_model');

/**
 *  Default view for an import item
 *
 *  - It is based in an upload model.
 *  - Will trigger a change when model changes.
 *  - It returns their data if it is requested with a method.
 */


module.exports = cdb.core.View.extend({

  initialize: function() {
    this.user = this.options.user;
    this.model = new UploadModel(null, { user: this.user });
    this._initBinds();
  },

  _initBinds: function() {
    this.model.bind('change', this._triggerChange, this);
  },

  _triggerChange: function() {
    this.trigger('change', this.model.toJSON(), this);
  },

  getModelData: function() {
    if (this.model) {
      return this.model.toJSON()
    }
    return {}
  }

});
