cdb.admin.ImportFilePane = cdb.admin.ImportPane.extend({
  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/import_file');
    this.render();
  },

  render: function() {
    this.$holder = this.$el.find("div.holder");

    this.$el.append(this.template());
    return this;
  }
});
