var CoreView = require('backbone/core-view');
var moment = require('moment');
var DateFieldView = require('./edit-fields/edit-field-view');
var EditFieldModel = require('./edit-fields/edit-field-model');
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

  initialize: function () {
    this.dateModel = new EditFieldModel({
      value: this.model.get('date'),
      type: 'date'
    });
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        layerType: this.model.get('layerType'),
        initialDateStr: moment(this.dateModel.get('value')).format(this.options.dateFormat)
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
    // Date field
    var dateField = new DateFieldView({
      model: this.dateModel,
      showTime: false,
      showGMT: false
    });
    this.addView(dateField);
    this._$datePicker().append(dateField.render().el);

    // // Disabled tooltip
    // if (this.dateModel.get('readOnly')) {
    //   this.addView(
    //     new cdb.common.TipsyTooltip({
    //       el: this._$datePicker(),
    //       title: function(e) {
    //         return $(this).attr('data-title')
    //       }
    //     })
    //   );
    // }
  },

  _onChangeToNight: function () {
    this.model.set('layerType', 'night');
  },

  _onChangeToDay: function () {
    this.model.set('layerType', 'day');
  },

  _$datePicker: function () {
    return this.$('.js-datePicker');
  }

});
