var cdb = require('cartodb.js');
var BaseDialog = require('./views/base_dialog/view');

/**
 * Convenient factory to create dialogs from various kind of input.
 */
module.exports = {

  /**
   * Create a new dialog just given a template.
   */
  byTemplate: function(template, opts) {
    var anonymousView = new (cdb.core.View.extend({
      render: function() {
        this.$el.html(
          template(opts.templateData)
        );

        return this;
      }
    }));

    return new (BaseDialog.extend({
      render_content: function() {
        return anonymousView.render().el;
      }
    }));
  }
};
