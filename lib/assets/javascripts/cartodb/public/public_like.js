cdb.open.LikeView = cdb.core.View.extend({

  events: {
    "click": "_onClick"
  },

  _onClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.model.toggleLiked();

    this.model.bind("error", function(response) {
      if (response.status === 403) {
        window.location = "https://cartodb.com/sessions/new";
      }
    });

  },

  initialize: function() {

    this.model.bind("change:likes, change:liked", function() {

      $(".js-like .counter").text(this.model.get("likes"));

      var $button  = $(".js-like");
      var $icon    = $(".js-like .icon");
      var $counter = $(".js-like .counter");

      if (this.model.get("liked")) {

        $button.addClass("is-highlighted");
        $icon.addClass("is-pulsating is-animated");
        $icon.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
          $(this).removeClass("is-pulsating is-animated");
        });

      } else {

        $icon.addClass("is-pulsating is-animated");
        $icon.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
          $(this).removeClass("is-pulsating is-animated");
          $button.removeClass("is-highlighted");
        });

      }

    }, this);

    this.model.fetch();

  }

});

cdb.open.Like = cdb.admin.Like.extend({
});
