var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

module.exports = CoreView.extend({
  render: function () {
    this.clearSubViews();
    this._removeForm();
    this.$el.empty();
    this._initForm();
    return this;
  },

  _initForm: function () {
    this._formModel = new Backbone.Model({
      value: this.model.get('fixed')
    });

    this._formModel.schema = {
      value: {
        type: 'Number',
        title: '',
        validators: [
          'required',
          {
            type: 'interval',
            min: this.options.min,
            max: this.options.max,
            step: this.options.step
          }
        ]
      }
    };

    this._formModel.bind(
      'change',
      function (input) {
        this.model.set('fixed', input.get('value'));
      },
      this
    );

    this._formView = new Backbone.Form({
      model: this._formModel
    });

    this._formView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._formView.render().$el);
  },

  _removeForm: function () {
    this._formView && this._formView.remove();
  },

  clean: function () {
    this._removeForm();
    CoreView.prototype.clean.call(this);
  }
});
