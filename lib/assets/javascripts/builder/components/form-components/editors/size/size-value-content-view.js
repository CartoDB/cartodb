var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./size-value-content-view.tpl');

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

    this.$el.append(
      template({
        bins: this.model.get('bins'),
        attribute: this.model.get('attribute'),
        quantification: this.model.get('quantification')
      })
    );

    this._initForm();

    return this;
  },

  _initForm: function () {
    if (this._formView) this._formView.remove();

    var range = this._getRangeOrCalculateItIfNeeded();
    this._formView = this._createFormView(range);

    this._renderFormView();
  },

  _renderFormView: function () {
    this.$('.js-content').append(this._formView.render().$el);
  },

  _getRangeOrCalculateItIfNeeded: function () {
    var min, max;
    var fixed = this.model.get('fixed');
    if (fixed) {
      min = max = fixed;
    }

    var range = this.model.get('range');
    if (range) {
      min = +range[0];
      max = +range[1];
    }

    /* when range min === max means we come from a fixed value, and we
    want to calculate the range values based on this */
    if (min === max) {
      var r = this._calculateRangeFromFixed(min);
      min = r[0];
      max = r[1];
      this.model.set('range', r); // changes are propagated!
      this.model.unset('fixed'); // once we have a range, everything is ready to map by value
    }

    return [min, max];
  },

  _createFormView: function (range) {
    var min = range[0];
    var max = range[1];

    var formModel = new Backbone.Model({ min: min, max: max });

    var getNumberType = this._getNumberType.bind(this);
    formModel.schema = { min: getNumberType(), max: getNumberType() };
    formModel.bind(
      'change',
      function (input) {
        this.model.set('range', [+input.get('min'), +input.get('max')]);
      },
      this
    );

    var formView = new Backbone.Form({
      className: 'Editor-boxList',
      model: formModel
    });
    formView.bind('change', function () {
      this.commit();
    });

    return formView;
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

  _getNumberType: function () {
    return {
      type: 'Number',
      validators: [
        'required',
        {
          type: 'interval',
          min: this.options.min,
          max: this.options.max
        }
      ]
    };
  },

  _removeForm: function () {
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
