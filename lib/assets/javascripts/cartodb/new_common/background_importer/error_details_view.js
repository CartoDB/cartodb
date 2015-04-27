var BaseDialog = require('../views/base_dialog/view');
var ErrorDetailsView = require('../views/error_details_view');

/**
 *  When an import fails, this dialog displays
 *  all the error info.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog ErrorDetails is-opening',

  initialize: function() {
    this.elder('initialize');
    this.user = this.options.user;
  },

  render_content: function() {
    if (!this._errorDetails) {
      this._errorDetails = new ErrorDetailsView({
        user: this.user,
        err: this.model.getError()
      });
      this.addView(this._errorDetails);
    }

    return this._errorDetails.render().el;
  }
});
