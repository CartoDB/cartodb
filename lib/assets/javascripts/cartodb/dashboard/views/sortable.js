cdb.admin.Sortable = cdb.core.View.extend({

  className: "order",

  _DEFAULT_SORT_METHOD: "updated_at",

  events: {
    "click a": "_onClick"
  },

  initialize: function() {

    var self = this;

    this.items = this.options.items;

    this._setupStorage();

    this.model = new cdb.core.Model({
      order: self.storage.get("order")
    });

    this.model.bind('change:order', this._updateOrder, this);
  },

  _setupStorage: function() {

    this.storage = new cdb.admin.localStorage(this.options.what + '.sortable');
    if (!this.storage.get("order")) this.storage.set({ order: this._DEFAULT_SORT_METHOD });

  },

  _updateOrder: function() {

    this.storage.set({ order: this.model.get("order") });

    var order;

    if (this.model.get("order") == "updated_at") {
      order = { data: { o: { updated_at: "desc" }}}
    } else {
      order = { data: { o: { created_at: "desc" }}}
    }

    this.trigger("fetch", this.model.get("order"));
  },

  getSortMethod: function() {
    return this.model.get("order");
  },

  getSortHash: function() {

    if (this.model.get("order") == "updated_at") {
      return { data: { o: { updated_at: "desc" }}}
    } else {
      return { data: { o: { created_at: "desc" }}}
    }

  },

  orderByUpdatedAt: function() {
    this.model.set("order", "updated_at");
  },

  orderByCreatedAt: function() {
    this.model.set("order", "created_at");
  },

  _onClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var $link = $(e.target);
    this.$el.find("a").removeClass("selected");

    if ($link.hasClass("updated_at")) {
      this.orderByUpdatedAt();
      $link.addClass("selected");
    } else {
      this.orderByCreatedAt();
      $link.addClass("selected");
    }

  },

  render: function() {

    var template = 'Order by <a href="#" data-order="modified" class="updated_at">modified</a> / <a href="#" class="created_at" data-order="created">created</a>';

    this.$el.append(_.template(template));

    var sort = this.storage.get("order");

    if      (sort == 'updated_at') this.$el.find(".updated_at").addClass("selected");
    else if (sort == 'created_at') this.$el.find(".created_at").addClass("selected");

    return this;
  }

});
