
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

    initialize: function() {
      this.template = cdb.templates.getTemplate(this.options.template || 'common/views/import/import_success');

      this._initBinds();
      this.render();
    },

    render: function() {

      var d = {
        service:    this.model.get("upload") && this.model.get('option') || "",
        tweets_cost:    this.model.get("upload") && this.model.get('upload').tweets_cost || 0,
        tweets_georeferenced: this.model.get("upload") && this.model.get('upload').tweets_georeferenced || 0
      };

      this.$el.html(this.template(d));

      return this;
    },

    _initBinds: function() {
      this.model.bind('change', this.render, this);
    }

  });
