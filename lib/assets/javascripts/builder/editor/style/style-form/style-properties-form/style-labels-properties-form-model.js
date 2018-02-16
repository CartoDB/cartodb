var _ = require('underscore');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');

module.exports = StyleFormDefaultModel.extend({

  _FORM_NAME: 'labels',

  _onChange: function () {
    var labelsData = _.extend(
      {},
      this.attributes
    );

    // Don't update style model if there is no attribute selected
    if (labelsData.enabled && !labelsData.attribute) {
      return false;
    }

    this._styleModel.set('labels', labelsData);
  }
});
