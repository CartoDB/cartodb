
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

      this.template = cdb.templates.getTemplate(this.options.template || 'old_common/views/import/import_success');

      this._initBinds();
      this.render();

    },

    render: function() {

      var service              = this.model.get("upload") && this.model.get('option') || "";
      var tweets_cost          = this.model.get("upload") && this.model.get('upload').tweets_cost || 0;
      var tweets_overquota     = this.model.get("upload") && this.model.get('upload').tweets_overquota || false;
      var tweets_georeferenced = this.model.get("upload") && cdb.Utils.formatNumber(this.model.get('upload').tweets_georeferenced) || 0;
      var table_name           = this.model.get("upload") && this.model.get('upload').table_name;
      var tweets_left          = this.model.get("upload") && cdb.Utils.formatNumber(this.model.get('upload').tweets_left) || 0;

      var d = {
        service: service,
        tweets_cost: tweets_cost,
        tweets_overquota: tweets_overquota,
        tweets_georeferenced: tweets_georeferenced,
        table_name: table_name,
        tweets_left: tweets_left
      };

      this.$el.html(this.template(d));

      return this;

    },

    _initBinds: function() {
      this.model.bind('change', this.render, this);
    }

  });
