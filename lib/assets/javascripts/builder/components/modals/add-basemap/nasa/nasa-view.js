var $ = require('jquery');
var moment = require('moment');
var CoreView = require('backbone/core-view');
var DatePickerView = require('builder/components/date-picker/date-picker-view');
var EditFieldModel = require('builder/components/date-picker/edit-field-model');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var template = require('./nasa.tpl');

/**
 * Represents the NASA tab content
 */

module.exports = CoreView.extend({

  options: {
    dateFormat: 'YYYY-MM-DD'
  },

  events: {
    'click .js-day': '_onChangeToDay',
    'click .js-night': '_onChangeToNight'
  },

  initialize: function (opts) {
    if (!opts.submitButton) throw new Error('submitButton is required');

    this._submitButton = opts.submitButton;
    this.dateModel = new EditFieldModel({
      value: this.model.get('date'),
      type: 'date'
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this._updateOkBtn();
    this._disableOkBtn(false);

    this.$el.html(
      template({
        layerType: this.model.get('layerType')
      })
    );

    this._renderDatePicker();

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:layerType', function () {
      this.dateModel.set('readOnly', this.model.get('layerType') === 'night');
      this.render();
    }, this);
    this.dateModel.bind('change:value', function () {
      var date = moment(this.dateModel.get('value')).format(this.options.dateFormat);
      this.model.set('date', date);
    }, this);
    this.add_related_model(this.dateModel);
  },

  _renderDatePicker: function () {
    // Date picker
    var datepicker = this.datepicker = new DatePickerView({
      className: 'DatePicker DatePicker--withBorder',
      model: this.dateModel
    });
    this._$datePicker().html(datepicker.render().el);
    this.addView(datepicker);

    // Disabled tooltip
    if (this.dateModel.get('readOnly')) {
      var tooltip = new TipsyTooltipView({
        el: this._$datePicker(),
        title: function (e) {
          return $(this).attr('data-title');
        }
      });
      this.addView(tooltip);
    }
  },

  _onChangeToNight: function () {
    this.model.set('layerType', 'night');
  },

  _onChangeToDay: function () {
    this.model.set('layerType', 'day');
  },

  _$datePicker: function () {
    return this.$('.js-datePicker');
  },

  _updateOkBtn: function () {
    this._submitButton.find('span').text(_t('components.modals.add-basemap.add-btn'));
  },

  _disableOkBtn: function (disable) {
    this._submitButton.toggleClass('is-disabled', disable);
  }

});
