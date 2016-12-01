var Backbone = require('backbone');
var moment = require('moment');

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

  initialize: function () {
    this.schema = {
      day: {
        title: '',
        type: 'Text',
        validators: ['required', /^(([0]?[1-9])|([1-2][0-9])|(3[01]))$/]
      },
      month: {
        type: 'Select',
        title: '',
        position: {
          'left': 0,
          'min-width': '200px'
        },
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
    var month = parseInt(this.get('month') + 1, 10);
    var date = moment(this.get('year') + '-' + month + '-' + this.get('day') + ' ' + this.get('time') + 'Z');
    var momentObj = moment(date).utc();

    return '' +
      momentObj.format('YYYY') + '-' +
      momentObj.format('MM') + '-' +
      momentObj.format('DD') + 'T' +
      momentObj.format('HH:mm:ss') + 'Z';
      // Not adding any info about timezone
  }
});
