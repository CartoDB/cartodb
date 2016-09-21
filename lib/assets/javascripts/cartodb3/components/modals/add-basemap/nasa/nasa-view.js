var moment = require('moment');
var CoreView = require('backbone/core-view');
// var DateFieldView = require('../../../edit_fields/date_field/date_field_view');
var EditFieldModel = require('./edit-fields/edit-field-model');
var TipsyTooltipView = require('../../../../components/tipsy-tooltip-view');
var template = require('./enter-url.tpl');

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
        layerType: this.model.get('layerType'),
        initialDateStr: moment(this.dateModel.get('value')).format(this.options.dateFormat)
      })
    );

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
    // // Date field
    // var dateField = new DateFieldView({
    //   model: this.dateModel,
    //   showTime: false,
    //   showGMT: false
    // });
    // this.addView(dateField);
    // this._$datePicker().append(dateField.render().el);

    // Disabled tooltip
    if (this.dateModel.get('readOnly')) {
      var tooltip = new TipsyTooltipView({
        el: this._$datePicker(),
        title: function(e) {
          return $(this).attr('data-title')
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
