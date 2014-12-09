cdb.open.Like = cdb.core.Model.extend({

  url: function() {
    if (this.get("username")) {
      return '//' + this.get("username") + '.localhost.lan:3000/api/v1/viz/' + this.get("vis_id") + '/like';
    } else {
      return '/api/v1/viz/' + this.get("vis_id") + '/like';
    }
  },

  initialize: function() {

    this.on("destroy", function() {
      this.set({ id: null, liked: false, likes: this.get("likes") - 1 });
    }, this);

  },

  toggleLiked: function() {

    if (this.get("liked")) {
      this.destroy();
    } else {
      this.set({ id: null }, { silent: true });
      this.save();
    }

  }

});
