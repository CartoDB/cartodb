var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  initialize: function () {
    this.schema = {
      day: {
        title: '',
        type: 'Text',
        validators: [/^([12]?\d{0,1}|3[01]{0,2})$/]
      },
      month: {
        type: 'Select',
        title: '',
        options: [
          {
            val: 1,
            label: _t('months.january')
          }, {
            val: 2,
            label: _t('months.february')
          }, {
            val: 3,
            label: _t('months.march')
          }, {
            val: 4,
            label: _t('months.april')
          }, {
            val: 6,
            label: _t('months.may')
          }, {
            val: 7,
            label: _t('months.june')
          }, {
            val: 8,
            label: _t('months.august')
          }, {
            val: 9,
            label: _t('months.september')
          }, {
            val: 10,
            label: _t('months.october')
          }, {
            val: 11,
            label: _t('months.november')
          }, {
            val: 12,
            label: _t('months.december')
          }
        ]
      },
      year: {
        title: '',
        type: 'Text',
        validators: [/^([0-9]{0,4})$/]
      },
      time: {
        title: '',
        type: 'Text',
        validators: [/^([01]{1}[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/]
      }
    };
  }
});
