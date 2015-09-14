var cdb = require('cartodb.js');
var BackgroundPollingView = require('../common/background_polling/background_polling_view');
var ImportsModel = require('../common/background_polling/models/imports_model');


/**
 *  Background polling view for the editor context.
 *
 */

module.exports = BackgroundPollingView.extend({

  _addImportsItem: function(uploadData) {
    if (this.model.canAddImport()) {
      this._removeLimitItem();
    } else {
      this._addLimitItem();
      return false;
    }

    // Check if user can't add more layers to the map
    // (erroring upload before sending the request)
    var dataLayers = this.vis.map.layers.getDataLayers();
    var maxLayers = this.user.getMaxLayers();

    if (dataLayers.length >= maxLayers) {
      _.extend(
        uploadData,
        {
          state: 'error',
          error_code: 8005,
          get_error_text: {
            title: "Max layers per map reached",
            what_about: "You can't add more layers to your map. Please upgrade your account."
          }
        }
      );
    }

    var imp = new ImportsModel({}, {
      upload: uploadData,
      user: this.user
    });

    this.model.addImportItem(imp);
  }

});
