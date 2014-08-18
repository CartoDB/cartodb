
  /**
   *  Import success pane
   *
   *  Displays success messages if import went fine :) 
   *
   *  - It needs a model to know what happened with the import.
   *    
   *  new cdb.admin.ImportSuccessPane({ model: state_model });
   *
  */

  cdb.admin.ImportSuccessPane = cdb.core.View.extend({

    className: 'create-success',

    _TEXTS: {
      what_about: _t('Sorry, something went wrong and we\'re not sure what. Contact us at \
                    <a href="mailto:contac@cartodb.com">contact@cartodb.com</a>.'),
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate(this.options.template || 'common/views/import/import_success');

      this._initBinds();
      this.render();
    },

    render: function() {
      var d = {
        service:    this.model.get('option') || "ok",
        what_about: this.model.get('success') && this.model.get('success').what_about || this._TEXTS.what_about
      };

      this.$el.html(this.template(d));

      return this;
    },

    _initBinds: function() {
      this.model.bind('change', this.render, this);
    }

  });
