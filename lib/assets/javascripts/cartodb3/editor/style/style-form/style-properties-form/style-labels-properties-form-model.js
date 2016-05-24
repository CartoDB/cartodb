var _ = require('underscore');
var StyleFormDefaultModel = require('../style-form-default-model');

module.exports = StyleFormDefaultModel.extend({

  _FORM_NAME: 'labels',

  parse: function (r) {
    return _.extend(
      r,
      {
        overlap: r.overlap.toString()
      }
    );
  },

  _onChange: function () {
    var labelsData = _.extend(
      {},
      this.attributes,
      {
        overlap: this.get('overlap') === 'true'
      }
    );

    // Don't update style model if there is no attribute selected
    if (labelsData.enabled && !labelsData.attribute) {
      return false;
    }

    this._styleModel.set('labels', labelsData);
  }
});
