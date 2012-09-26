/**
 * base dialog for all dialogs in the application
 * it does a custom show/hide
 */

cdb.admin.BaseDialog = cdb.ui.common.Dialog.extend({

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
  },

  open: function() {
    var self = this;

    this.$el.find(".modal").css({
      "opacity": "0",
      "marginTop": "150px"
    });

    this.$el.find(".mamufas").fadeIn();
    this.$el.find(".modal").animate({
      marginTop: "100px",
      opacity: 1
    },300);
  },

  /**
   * call this method is the dialog has some 
   * selector
   */
  setWizard: function() {
    // Option selected by default
    this.option = 0;
    _.bindAll(this, '_changeOption');
    this.$el.delegate('ul > li > a.radiobutton', 'click', this._changeOption);
  },

  /** when wizard is enabled this function is used to switch 
   * between options */
  _changeOption: function(ev) {
    ev.preventDefault();

    var $el   = $(ev.target)
      , $list = $el.closest("ul")
      , $li   = $el.closest("li");

    // Stop if option is disabled
    if ($el.hasClass("disabled") || $el.hasClass("selected")) {
      return false;
    }

    // If not activate it and desactivate previous one
    $list
      .find("li.active")
      .removeClass("active")
      .find(" > a.radiobutton")
      .removeClass("selected");

    this.option = $li.attr("data-option");

    $el.addClass("selected");
    $li.addClass("active");

  }

});
