
/**
* Single table item in dashboard list
*
* Usage example:
*
var li = new VisualizationView({
model: model*,
limitation: !this.options.user.get("private_tables")
});

* It needs a table model to run correctly.
*
*/
var VisualizationView = cdb.core.View.extend({

  tagName: 'li',

  events: {
    "click a.delete:not(.disabled)": "_confirmAndDelete"
  },

  initialize: function() {
    _.bindAll(this, "render", "deleting", "deleted", "_confirmAndDelete");

    _.defaults(this.options, this.default_options);

    this.template = cdb.templates.getTemplate('dashboard/views/visualization_list_item');

    this.retrigger('saving', this.model);
    this.retrigger('saved', this.model);

    this.model.bind('change', this.render);
    this.bind("clean", this._reClean, this);
  },


  render: function() {
    var self = this;
    this.cleanTooltips();
    this.$el.html(this.template(this.model.toJSON()));
    this.$el.addClass('tableRow border');
    return this;
  },

  clean: function() {
    this.trigger('clean');
    this.elder('clean');
  },

  /**
  * Show delete confirmation after decides delete a visualization
  */
  _confirmAndDelete: function(ev) {
    var self = this;
    ev && (ev.preventDefault());

    this.delete_dialog = new cdb.admin.DeleteDialog({
      model: this.model,
      title: "Delete this visualization",
      ok_title: "Delete this visualization",
      content: 'You are about to delete this visualization.',
      config: this.options.config
    });

    $("body").append(this.delete_dialog.render().el);
    this.delete_dialog.open();

    this.delete_dialog.wait()
    .done(this.deleteVisualization.bind(this))
    .fail(this.cleanDeleteDialog.bind(this));
  },

  /**
  * Hides the content and show a notification saying the visualization is being deleted
  * @triggers deleting
  * @return undefined
  */
  deleting: function() {
    this.cleanTooltips();
    this.$el.addClass('disabled');
    this.$('a').addClass('disabled');
  },

  /**
  * Close the "deleting" notification and warns the user that the visualization has been deleted
  * @triggers deleted
  * @return undefined
  */
  deleted: function() {
    this.cleanTooltips();
    this.$el.html('');

    var notificationTpl =
    '<p class="dark">Your visualization (' + this.model.get("name") + ') has been deleted</p>' +
      '<a class="smaller close" href="#close">x</a>';
    var $container = $('<li class="flash"></li>');
    this.$el.after($container);
    this.notification = new cdb.ui.common.Notification({
      el: $container,
      timeout:3000,
      template: notificationTpl,
      hideMethod: 'fadeOut',
      showMethod: 'fadeIn'
    });

    this.notification.open();
    this.$el.remove();
    this.clean();
  },

  cleanDeleteDialog: function() {
    this.delete_dialog.clean();
  },

  deleteVisualization: function() {
    var self = this;
    this.deleting();
    this.model.destroy({wait: true})
    .done(this.deleted);
  },


  /**
  * Destroy droppable funcionality when el is being cleaned
  */
  _reClean: function() {
    this.$el.droppable("destroy");
  }
});


