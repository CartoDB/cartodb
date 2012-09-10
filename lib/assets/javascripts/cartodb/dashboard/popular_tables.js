

(function() {

  /**
   * Show popular tables in a popup
   *
   * Those tables are based on a list created by us.
   *
   * Usage example:
   *
      this.popularTables = new cdb.admin.dashboard.PopularTables({
        el: $('a.popular_tables')
      })

   *
   */



  cdb.admin.PopularTagsDialog = cdb.admin.BaseDialog.extend({

    initialize: function() {
      // Extend options
      _.extend(this.options, {
        title: 'Do you need some sample data?',
        width: 580,
        clean_on_hide: true,
        template_name: 'common/views/dialog_base',
        include_footer: false
      });
      this.constructor.__super__.initialize.apply(this);
    },


    /**
     * Render the content for the create dialog
     */
    render_content: function() {

      // Add correct html
      var $content = this.$content = $("<div>");
      this.temp_content = cdb.templates.getTemplate('dashboard/views/popular_tables');
      $content.append(this.temp_content());

      return this.$content;
    }

  });





  var PopularTables = cdb.core.View.extend({
    
    events: {
      'click a':  '_showPopularTables'
    },

    initialize: function() {},

    render: function() {},

    _showPopularTables: function(ev) {
      ev.preventDefault();

      var dialog = new cdb.admin.PopularTagsDialog();

      this.$el.append(dialog.render().el);
      dialog.open();
    }
  });

  cdb.admin.dashboard.PopularTables = PopularTables;
})();



