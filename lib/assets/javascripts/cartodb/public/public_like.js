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
        window.location = "http://www.cartodb.com/signup";
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

cdb.open.Like = cdb.core.Model.extend({

  url: function() {
    return '/api/v1/viz/' + this.get("vis_id") + '/like';
  },

  initialize: function() {

    _.bindAll(this, "_onSaveError");

    this.on("destroy", function() {
      this.set({ id: null, liked: false, likes: this.get("likes") - 1 });
    }, this);

  },

  _onSaveError: function(model, response) {
    this.trigger("error", { 
      status: response.status,
      statusText: response.statusText 
    });
  },

  toggleLiked: function() {

    if (this.get("liked")) {
      this.destroy();
    } else {
      this.set({ id: null }, { silent: true });
      this.save({}, { error: this._onSaveError });
    }
  }

});
