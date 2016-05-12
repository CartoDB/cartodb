var cdb = require('cartodb.js');
var Backbone = require('backbone');
var template = require('./input-number-value-content-view.tpl');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-quantification': '_onClickQuantification'
  },

  initialize: function (opts) {
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      attribute: this.model.get('attribute'),
      quantification: this.model.get('quantification')
    }));

    this._generateForms();

    return this;
  },

  _generateForms: function () {
    if (this._formView) {
      this._formView.remove();
    }

    this._formModel = new Backbone.Model({
      min: this.model.get('range') ? this.model.get('range')[0] : this.model.get('fixed'),
      max: this.model.get('range') ? this.model.get('range')[1] : this.model.get('fixed')
    });

    var self = this;

    this._formModel.schema = {
      min: {
        type: 'Number',
        validators: ['required', {
          type: 'interval',
          min: self.options.min,
          max: self.options.max
        }]
      },
      max: {
        type: 'Number',
        validators: ['required', {
          type: 'interval',
          min: self.options.min,
          max: self.options.max
        }]
      }
    };

    this._formModel.bind('change', function (input) {
      this.model.set('range', [input.get('min'), input.get('max')]);
    }, this);

    this._formView = new Backbone.Form({
      model: this._formModel
    });

    this._formView.bind('change', function () {
      this.commit();
    });

    this.$('.js-content').append(this._formView.render().$el);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onClickQuantification: function (e) {
    this.killEvent(e);
    this.trigger('selectQuantification', this);
  },

  clean: function () {
    // Backbone.Form removes the view with the following method
    this._formView.remove();
    cdb.core.View.prototype.clean.call(this);
  }
});
