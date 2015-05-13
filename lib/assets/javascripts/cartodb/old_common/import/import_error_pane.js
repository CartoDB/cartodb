
  /**
   *  Import error pane
   *
   *  Displays error messages if import went bad :( 
   *
   *  - It needs a model to know what happened with the import.
   *    
   *  new cdb.admin.ImportErrorPane({ model: state_model });
   *
  */

  cdb.admin.ImportErrorPane = cdb.core.View.extend({

    className: 'create-error',

    _TEXTS: {
      what_about: _t('Sorry, something went wrong and we\'re not sure what. Contact us at \
                    <a href="mailto:support@cartodb.com">support@cartodb.com</a>.'),
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate(this.options.template || 'old_common/views/import/import_error');

      this._initBinds();
      this.render();
    },

    render: function() {
      var d = {
        item_queue_id:  this.model.get('upload') && this.model.get('upload').item_queue_id || '',
        what_about:     this.model.get('error') && this.model.get('error').what_about || this._TEXTS.what_about
      };

      this.$el.html(this.template(d));

      return this;
    },

    _initBinds: function() {
      this.model.bind('change', this.render, this);
    }

  });