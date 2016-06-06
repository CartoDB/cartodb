var _ = require('underscore');
var StyleFormDefaultModel = require('../style-form-default-model');

module.exports = StyleFormDefaultModel.extend({

  _FORM_NAME: 'aggregation',

  _onChange: function () {
    this._styleModel.set('aggregation', _.clone(this.attributes));
  }

});
