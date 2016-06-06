var cdb = require('cartodb.js');
var Backbone = require('backbone');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    this._initViews();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(this._formView.render().$el);
    return this;
  },

  _initViews: function () {
    this._formModel = new Backbone.Model({
      value: this.model.get('fixed')
    });

    this._formModel.schema = {
      value: {
        type: 'Number',
        validators: ['required', {
          type: 'interval',
          min: this.options.min,
          max: this.options.max,
          step: this.options.step
        }]
      }
    };

    this._formModel.bind('change', function (input) {
      this.model.set('fixed', input.get('value'));
    }, this);

    this._formView = new Backbone.Form({
      className: 'CDB-ListDecoration-itemPadding',
      model: this._formModel
    });

    this._formView.bind('change', function () {
      this.commit();
    });
  },

  clean: function () {
    // Backbone.Form removes the view with the following method
    this._formView.remove();
    cdb.core.View.prototype.clean.call(this);
  }
});
