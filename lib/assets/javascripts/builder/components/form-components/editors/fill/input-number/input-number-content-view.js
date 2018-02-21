var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./input-number-value-content-view.tpl');

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-bins': '_onClickBins',
    'click .js-quantification': '_onClickQuantification'
  },

  render: function () {
    this.clearSubViews();
    this._removeForm();
    this.$el.empty();

    this.$el.append(template({
      bins: this.model.get('bins'),
      attribute: this.model.get('attribute'),
      quantification: this.model.get('quantification')
    }));

    this._initForm();

    return this;
  },

  _calculateRangeFromFixed: function (fixed, percent) {
    percent = percent || 30;

    var span = this.options.max - this.options.min;
    var delta = fixed / span;

    return [
      Math.floor(Math.max(this.options.min, fixed - percent * delta)),
      Math.floor(Math.min(this.options.max, fixed + percent * delta))
    ];
  },

  _initForm: function () {
    var self = this;

    if (this._formView) {
      this._formView.remove();
    }

    // when range min === max means we come from a fixed value, probably
    // calculate the range values based on this
    var range = this.model.get('range');
    var min, max;

    min = max = this.model.get('fixed');

    if (range) {
      min = +range[0];
      max = +range[1];
    }

    if (min === max) {
      var r = this._calculateRangeFromFixed(min);
      // set the range so changes are propagated
      min = r[0];
      max = r[1];
      this.model.set('range', r);
    }

    this._formModel = new Backbone.Model({
      min: min,
      max: max
    });

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
      this.model.set('range', [(+input.get('min')), (+input.get('max'))]);
    }, this);

    this._formView = new Backbone.Form({
      className: 'Editor-boxList',
      model: this._formModel
    });

    this._formView.bind('change', function () {
      this.commit();
    });

    this.$('.js-content').append(this._formView.render().$el);
  },

  _removeForm: function () {
    // Backbone.Form removes the view with the following method
    this._formView && this._formView.remove();
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onClickQuantification: function (e) {
    this.killEvent(e);
    this.trigger('selectQuantification', this);
  },

  _onClickBins: function (e) {
    this.killEvent(e);
    this.trigger('selectBins', this);
  },

  clean: function () {
    this._removeForm();
    CoreView.prototype.clean.call(this);
  }
});
