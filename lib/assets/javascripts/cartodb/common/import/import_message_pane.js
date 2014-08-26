
  /**
   *
   *
   *
   */

  cdb.admin.ImportMessagePane = cdb.admin.ImportPane.extend({

    className: 'import-message-pane',

    options: {
      message: _t('Import pane disabled')
    },

    initialize: function() {
      this.model = new cdb.core.Model({
        value: '',
        valid: false
      });

      this.template = cdb.templates.getTemplate(this.options.template);
      this.render();
    },

    render: function() {
      this.$el.append(this.template());
      return this;
    }

  });