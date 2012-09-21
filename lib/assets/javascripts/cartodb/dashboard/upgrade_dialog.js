  
  /**
   * Show upgrade window when reach account limits
   *
   * It goes to upgrade "central" when user selects a new plan :)
   *
   */

  cdb.admin.UpgradeDialog = cdb.admin.BaseDialog.extend({

    events: function() {
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{
          'click ul.instances li a' : '_onInstanceClick'
      });
    },

    initialize: function() {

      _.bindAll(this, "_setInstance");

      // Extend options
      _.extend(this.options, {
        title: 'You have reached your account limits',
        description: 'Why don’t you think in upgrading your account?',
        width: 719,
        clean_on_hide: true,
        template_name: 'common/views/dialog_base',
        ok_title: 'Upgrade your account',
        ok_button_classes: 'button blue',
        modal_class: "upgrade_account",
        modal_type: "notification"
      });
      this.constructor.__super__.initialize.apply(this);

      
    },


    /**
     * Render the content for the create dialog
     */
    render_content: function() {

      var $content = this.$content = $("<ul>").addClass("instances")
        , instances = cdb.admin.dashboard.instances
        , username = this.model.get("username")
        , template = cdb.templates.getTemplate('dashboard/views/upgrade_dialog_content');

      // Add intance types
      _.each(instances, function(ins,i){
        if (ins.title != "FREE")
          $content.append(template(ins));
      });

      // Add ghost form
      this.$content.append('<form class="hide" action="/account/' + username + '/upgrade" method="post"><input type="text" name="account_type" value="" /></form>');

      // Set instance
      this._setInstance($content);

      return this.$content;
    },


    /**
     *  Suggest a better instance
     */
    _setInstance: function($el) {
      var account_type = this.model.get("account_type")
        , instances = cdb.admin.dashboard.instances
        , new_one, index
        , self = this;

      _.each(instances, function(ins,i){
        if (ins.title == account_type) {
          index = i;
          self.instance = ins.title;
        }
      });

      // Set by default FREE -> JOHN SNOW and not magellan :)
      if (index == 0) {
        index++;
        this.instance = instances[index].title;
      }

      // Set selected type
      $el.find(" > li:eq(" + index + ")")
        .addClass("selected")
        .find("a.button")
          .addClass("selected")

      // Save this option in the form
      $el.find("form input").val(this.instance);
    },


    /**
     *  
     */
    _onInstanceClick: function(ev) {
      ev.preventDefault();

      var $li = $(ev.target).closest("li")
        , clicked_type = $li.attr("data-type");

      if (clicked_type == self.instance) {
        return false;
      }

      // Remove previous selected
      this.$el.find("li.selected, a.selected").removeClass("selected")

      // Set new selected
      $li.addClass("selected")
        .find("a.button")
          .addClass("selected")

      // Save this option in the form
      this.$el.find("form input").val(clicked_type);
    },


    /**
     *  Hide the dialog
     */
    ok: function() {
      this.$el.find("form").submit();
      this.hide();
    },


    /**
     *  Hide the dialog
     */
    hide: function() {
      var self = this;

      this.$el.find(".modal").animate({
        marginTop: "50px",
        opacity: 0
      },300, function() {
        if(self.options.clean_on_hide) {
          self.clean();
        }
      });
      this.$el.find(".mamufas").fadeOut(300);
      this.trigger("closedDialog", this , this);
    }
  });



