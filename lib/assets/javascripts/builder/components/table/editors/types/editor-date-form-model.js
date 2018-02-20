var Backbone = require('backbone');
var moment = require('moment');
var Utils = require('builder/helpers/utils');
var MONTHS = [
  {
    val: 0,
    label: _t('months.january')
  }, {
    val: 1,
    label: _t('months.february')
  }, {
    val: 2,
    label: _t('months.march')
  }, {
    val: 3,
    label: _t('months.april')
  }, {
    val: 4,
    label: _t('months.may')
  }, {
    val: 5,
    label: _t('months.june')
  }, {
    val: 6,
    label: _t('months.july')
  }, {
    val: 7,
    label: _t('months.august')
  }, {
    val: 8,
    label: _t('months.september')
  }, {
    val: 9,
    label: _t('months.october')
  }, {
    val: 10,
    label: _t('months.november')
  }, {
    val: 11,
    label: _t('months.december')
  }
];

module.exports = Backbone.Model.extend({

  parse: function (attrs) {
    var date;

    if (!attrs.date) {
      date = moment().utc();
    } else {
      date = moment(attrs.date).utc();
    }

    return {
      day: date.date(),
      month: date.month(),
      year: date.year(),
      time: date.format('HH:mm:ss'),
      utcOffset: date.utcOffset()
    };
  },

  initialize: function () {
    this.schema = {
      day: {
        title: '',
        type: 'Text',
        validators: [
          'required',
          /^([12]?\d{0,1}|3[01]{0,2})$/,
          function (value, formValues) {
            var date = moment(Utils.formatDate(formValues));
            if (!date.isValid()) {
              return {
                type: 'date',
                message: _t('components.datepicker.invalid-date')
              };
            }
          }
        ]
      },
      month: {
        type: 'Select',
        title: '',
        options: MONTHS
      },
      year: {
        title: '',
        type: 'Text',
        validators: ['required', /^([0-9]{0,4})$/]
      },
      time: {
        title: '',
        type: 'Text',
        validators: ['required', /^([01]{1}[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/]
      }
    };
  },

  getFormattedDate: function () {
    return Utils.formatDate(this.toJSON());
  }

});
