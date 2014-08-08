/**
 * base dialog for all dialogs in the application
 * it does a custom show/hide
 */

cdb.admin.BaseDialog = cdb.ui.common.Dialog.extend({

  hide: function(callback) {

    var self = this;

    var marginTop = parseInt(this.$el.find(".modal").css("marginTop"), 10);

    this.$el.find(".modal").animate({
      marginTop: marginTop - 50,
      opacity: 0
    }, 300, function() {

      if (self.options.clean_on_hide) {
        self.clean();
      }

      if (callback) callback();

    });

    this.$el.find(".mamufas").fadeOut(300);
    this.trigger("was_removed", this);

  },

  /*
  * You can pass { center: true } to center the dialog in the screen
  */
  open: function(options) {
    var self = this;

    this.trigger("will_open", this);

    this.$el.find(".modal").css({
      "opacity": "0",
      "marginTop": "170px"
    });

    this.$el.find(".mamufas").fadeIn();

    if (options && options.center) {
      var marginTop = (this.$(".modal").height())/2;

      this.$(".modal")
        .css({
          top:        "50%",
          opacity:    "0",
          marginTop:  -marginTop+50
        })
        .animate({
          marginTop: -marginTop,
          opacity: 1
        }, 300);

    } else {

      this.$el.find(".modal").animate({
        marginTop: "120px",
        opacity: 1
      }, 300);
    }
  },

  /**
   * call this method is the dialog has some
   * selector
   */
  setWizard: function(opt) {
    // Option selected by default
    this.option = opt || 0;
    _.bindAll(this, '_changeOption');
    this.$el.delegate('ul > li > a.radiobutton', 'click', this._changeOption);
  },

  activeWizardOption: function(opt) {
    var $li = this.$('li[data-option=' + opt + ']');
    $li.find(' > a.radiobutton').click();
  },

  render: function() {
    cdb.ui.common.Dialog.prototype.render.call(this);
    this.activeWizardOption(this.option);
    return this;
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
  },

  /*
  * Centers the .modal dialog in the middle of the screen.
  *
  * You can pass { animation: true } to center the current dialog in the screen
  * with animation or not
  */
  centerInScreen: function(animation) {
    var $modal = this.$el.find('.modal:visible:eq(0)')
      , modal_height = $modal.height()

    if (modal_height > 0) {
      $modal.animate({
        marginTop: -(modal_height/2)
      }, (animation) ? 300 : 0)
    }
  },

  enableOkButton: function() {
    this.$('a.ok').removeClass('disabled').removeAttr('disabled', 'disabled');
  },

  disableOkButton: function() {
      this.$('a.ok').addClass('disabled').attr('disabled', 'disabled');
  }


});
