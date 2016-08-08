var _ = require('underscore');
var StyleFormDefaultModel = require('../style-form-default-model');

module.exports = StyleFormDefaultModel.extend({

  _FORM_NAME: 'animated',

  parse: function (r, opts) {
    var querySchema = opts.querySchemaModel;
    var columnAnimatable = querySchema.columnsCollection.findWhere(function (colModel) {
      return colModel.get('type') === 'number' || colModel.get('type') === 'date';
    });

    return _.extend(
      r,
      {
        attribute: columnAnimatable && columnAnimatable.get('name'),
        overlap: r.overlap && r.overlap.toString()
      }
    );
  },

  _onChange: function () {
    var animatedData = _.extend(
      {},
      this.attributes,
      {
        overlap: this.get('overlap') === 'true'
      }
    );

    // Don't update style model if there is no attribute selected
    if (!animatedData.attribute) {
      return false;
    }

    this._styleModel.set('animated', animatedData);
  }

});
