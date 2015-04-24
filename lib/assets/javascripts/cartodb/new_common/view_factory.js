var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * Convenient factory to create views without having to create new files.
 */
module.exports = {

  /**
   * @return {Object} instance of cdb.core.View, which takes two params of template and templateData
   */
   createByTemplate: function(templateOrStr, templateData) {
    var AnonymouseView = cdb.core.View.extend({
      render: function() {
        this.$el.html(
          this.options.template(this.options.templateData)
        );
        return this;
      }
    });

    return new AnonymouseView({
      template: _.isString(templateOrStr) ? cdb.templates.getTemplate(templateOrStr) : templateOrStr,
      templateData: templateData
    });
  }
};
