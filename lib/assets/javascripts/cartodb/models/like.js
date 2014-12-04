cdb.admin.Like = cdb.core.Model.extend({

  url: function() {
    // TODO: add org code
    //if (this.options.user.isInsideOrg()) {
    //url  = "/u/" + this.options.user.get("username") + "/api/v1/viz/" + this.model.get("id") + "/like";
    //}
    return '/api/v1/viz/' + this.get("vis_id") + '/like';
  },

  initialize: function() {

    this.on("destroy", function() {
      this.set({ id: null, liked: false, likes: this.get("likes") - 1 });
    }, this);
  }

});
