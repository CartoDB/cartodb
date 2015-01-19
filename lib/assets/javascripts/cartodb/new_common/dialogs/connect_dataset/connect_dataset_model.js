var cdb = require('cartodb.js');

/**
 *  Connect dataset model
 *
 *  - Store the state of the dialog
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    tab: 'connect-dataset',
    option: 'file',
    // upload status
    upload: {
      valid: false,
      type: '',
      name: '',
      value: '',
      interval: 0
    }
  }

});