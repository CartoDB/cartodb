  
  /**
   *  CartoCSS help dialog
   */

  cdb.admin.CartoCSSInfo = cdb.admin.BaseDialog.extend({

    initialize: function() {

      // Extend options
      _.extend(this.options, {
        title: _t('Advanced map styling with CartoCSS'),
        width: 502,
        clean_on_hide: true,
        template_name: 'old_common/views/dialog_base',
        include_footer: false,
        modal_class: "docs_info_dialog"
      });
      this.elder('initialize');
    },

    /**
     * Render the content for CartoCSS info
     */
    render_content: function() {
      // Add correct html
      var $content = this.$content = $("<div>");
      this.temp_content = cdb.templates.getTemplate('table/views/cartocss_doc');
      $content.append(this.temp_content());

      return this.$content;
    }
  });


  /**
   *  Postgres help dialog
   */

  cdb.admin.PostgresInfo = cdb.admin.BaseDialog.extend({

    initialize: function() {

      // Extend options
      _.extend(this.options, {
        title: _t('Performing SQL queries on CartoDB'),
        width: 502,
        clean_on_hide: true,
        template_name: 'old_common/views/dialog_base',
        include_footer: false,
        modal_class: "docs_info_dialog"
      });
      this.elder('initialize');
    },

    /**
     * Render the content for Posgres and posgis info
     */
    render_content: function() {
      // Add correct html
      var $content = this.$content = $("<div>");
      this.temp_content = cdb.templates.getTemplate('table/views/postgres_doc');
      $content.append(this.temp_content());

      return this.$content;
    }
  });



  /**
   *  Mustache help dialog
   */

  cdb.admin.MustacheInfo = cdb.admin.BaseDialog.extend({

    initialize: function() {

      // Extend options
      _.extend(this.options, {
        title: _t('Templating infowindows in CartoDB'),
        width: 502,
        clean_on_hide: true,
        template_name: 'old_common/views/dialog_base',
        include_footer: false,
        modal_class: "docs_info_dialog"
      });
      this.elder('initialize');
    },

    /**
     * Render the content for Posgres and posgis info
     */
    render_content: function() {
      // Add correct html
      var $content = this.$content = $("<div>");
      this.temp_content = cdb.templates.getTemplate('table/views/mustache_doc');
      $content.append(this.temp_content());

      return this.$content;
    }
  });