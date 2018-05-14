var CoreView = require('backbone/core-view');
var FillTemplate = require('builder/components/form-components/editors/fill/fill-template.tpl');

module.exports = CoreView.extend({
  className: 'Form-InputFill CDB-OptionInput CDB-Text js-input',

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();

    return this;
  },

  _initView: function () {
    this.$el.append(FillTemplate());
  }
});
