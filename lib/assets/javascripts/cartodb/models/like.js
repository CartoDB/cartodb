cdb.admin.Like = cdb.core.Model.extend({

  url: function() {
    return '/api/v1/viz/' + this.get("vis_id") + '/like';
  },

  initialize: function() {
    this.on("destroy", function() {
      this.set({ liked: false, likes: this.get("likes") - 1 });
    }, this);

    this.on("change:liked", this._onChangeLiked, this);
  },

  _onChangeLiked: function() {

    if (this.get("liked")) {
      this.set({ id: null }, { silent: true });
      this.save();
    } else {
      this.destroy();
    }

  },

  toggleLiked: function() {
    this.set("liked", !this.get("liked"));
  }

});
