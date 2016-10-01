var cdb = require('cartodb.js-v3');
var moment = require('moment-v3');
var DateFieldView = require('../../../edit_fields/date_field/date_field_view');
var EditFieldModel = require('../../../edit_fields/edit_field_model');

/**
 * Represents the XYZ tab content.
 */
module.exports = cdb.core.View.extend({

  options: {
    dateFormat: 'YYYY-MM-DD'
  },

  events: {
    'click .js-day': '_onChangeToDay',
    'click .js-night': '_onChangeToNight'
  },

  initialize: function() {
    this.elder('initialize');
    this.dateModel = new EditFieldModel({
      value: this.model.get('date'),
      type: 'date'
    });
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/nasa/nasa')({
        layerType: this.model.get('layerType'),
        initialDateStr: moment(this.dateModel.get('value')).format(this.options.dateFormat)
      })
    );

    this._renderDatePicker();

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:layerType', function() {
      this.dateModel.set('readOnly', this.model.get('layerType') === "night");
      this.render()
    }, this);
    this.dateModel.bind('change:value', function() {
      var date = moment(this.dateModel.get('value')).format(this.options.dateFormat);
      this.model.set('date', date);
    }, this);
    this.add_related_model(this.dateModel);
  },

  _renderDatePicker: function() {
    // Date field 
    var dateField = new DateFieldView({
      model: this.dateModel,
      showTime: false,
      showGMT: false
    });
    this.addView(dateField);
    this._$datePicker().append(dateField.render().el);

    // Disabled tooltip
    if (this.dateModel.get('readOnly')) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this._$datePicker(),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    }
  },

  _onChangeToNight: function(ev) {
    this.model.set('layerType', 'night');
  },

  _onChangeToDay: function() {
    this.model.set('layerType', 'day');
  },

  _$datePicker: function() {
    return this.$('.js-datePicker');
  }
});
