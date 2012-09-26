
  /**
   * Show popular tables in a popup
   *
   * Those tables are based on a list created by us.
   *
   */

  cdb.admin.PopularTagsDialog = cdb.admin.BaseDialog.extend({

    events: function() {
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{
          'click ul li a' : '_onExampleClick'
      });
    },

    initialize: function() {
      // Extend options
      _.extend(this.options, {
        title: 'Do you need some sample data?',
        width: 580,
        clean_on_hide: true,
        template_name: 'common/views/dialog_base',
        include_footer: false,
        modal_class: "popular_tables"
      });
      this.constructor.__super__.initialize.apply(this);

    },


    /**
     * Render the content for the create dialog
     */
    render_content: function() {
      // Add correct html
      var $content = this.$content = $("<div>");
      this.temp_content = cdb.templates.getTemplate('dashboard/views/popular_tables_dialog');
      $content.append(this.temp_content());

      return this.$content;
    },


    /**
     * Trigger popular list click
     */
    _onExampleClick: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      this.trigger("importExample",ev,this);
    },


    /**
     * Simulate hide and then clean the dialog properly
     */
    simulateHide: function(ev) {
      this.$el.find(".mamufas").css("background","none");

      var self = this;

      this.$el.find("section.block.modal").animate({
        marginTop: "0px",
        opacity:0
      },300, function(){
        self.clean();
      });
    },


    /**
     * Cancel function overwritten
     */
    _cancel: function(ev) {
      this.trigger("closedDialog",this);

      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }

      if (this.cancel) {
        this.cancel();
      }

      this.hide();
    }

  });