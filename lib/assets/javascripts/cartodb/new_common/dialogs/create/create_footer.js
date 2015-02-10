var cdb = require('cartodb.js');

/**
 *  Create footer view
 *
 *  It will show possible choices depending the
 *  selected option and the state of the main model
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-templates': '_goToTemplates'
  },
  
  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_common/views/create/create_footer');
    this._initBinds();
  },

  render: function() {
    var upload = this.model.getUpload();
    var isUploadValid = false;

    if (upload && !_.isEmpty(upload)) {
      isUploadValid = upload.value && upload.state !== "error"
    }

    this.$el.html(
      this.template({
        type: this.model.get('type'),
        option: this.model.get('option'),
        importOption: this.model.get('importOption'),
        isUploadValid: isUploadValid,
        mapTemplate: this.model.get('mapTemplate')
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:upload', this.render, this);
    this.model.bind('change:option', this.render, this);
    this.model.bind('change:importOption', this.render, this);
  },

  _goToTemplates: function(e) {
    if (e) e.preventDefault();
    this.model.set('option', 'templates');
  }

});