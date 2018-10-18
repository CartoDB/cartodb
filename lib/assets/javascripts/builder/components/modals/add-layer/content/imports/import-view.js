var CoreView = require('backbone/core-view');
var UploadModel = require('builder/data/upload-model');

/**
 *  Default view for an import item
 *
 *  - It is based in an upload model.
 *  - Will trigger a change when model changes.
 *  - It returns their data if it is requested with a method.
 */

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this.model = new UploadModel(null, {
      configModel: this._configModel,
      userModel: this._userModel
    });
    this._initBinds();
  },

  _initBinds: function () {
    this.model.bind('change', this._triggerChange, this);
  },

  _triggerChange: function () {
    this.trigger('change', this.model.toJSON(), this);
  },

  getModelData: function () {
    if (this.model) {
      return this.model.toJSON();
    }
    return {};
  }

});
