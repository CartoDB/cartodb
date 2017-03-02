/**
 * dropdown when user clicks on a column name
 */
cdb.admin.TitleDropdown = cdb.admin.DropdownMenu.extend({
  className: 'dropdown border',
  isPublic: false,

  events: {
    'click .add_title_alias': 'addTitleAlias',
    'click .save_column_alias': 'saveTitleAlias',
    'click .editAlias': 'editTitleAlias',
    'click .removeAlias': 'removeTitleAlias',
    'keydown #aliasInput': 'checkEditTitleAliasInput',
    'click #aliasInput': '_aliasInputClick'
  },

  initialize: function () {
    this.options.reserved_column = false;
    this.options.titleAlias = null;
    this.options.titleAliasEdit = false;
    this.options.read_only = false;
    this.options.isPublic = this.isPublic;
    this.elder('initialize');
  },

  initializeState: function (stateData) {
    this.options.titleAlias = stateData.alias;
  },

  addTitleAlias: function (e) {
    e.preventDefault();
    this.options.titleAliasEdit = true;
    this.render();
    return false;
  },

  editTitleAlias: function (e) {
    e.preventDefault();
    this.options.titleAliasEdit = true;
    this.render();
    return false;
  },

  removeTitleAlias: function (e) {
    e.preventDefault();
    this.options.titleAliasEdit = false;
    this.trigger('removeAlias');
    this.hide();
    return false;
  },

  _aliasInputClick: function (e) {
    e.preventDefault();
    e.stopPropagation();
  },

  saveTitleAlias: function (e) {
    if (e) e.preventDefault();
    this.options.titleAliasEdit = false;
    this.trigger('renameAlais', $('#aliasInput').val());
    this.hide();
    return false;
  },

  checkEditTitleAliasInput: function (e) {
    if (e.keyCode === 13) {
      this.saveTitleAlias();
    }
    if (e.keyCode === 27) {
      this.hide();
    }
  },

  render: function () {
    cdb.admin.DropdownMenu.prototype.render.call(this);
    // Add the class public if it is reserved column or query applied
    this.$el[this.options.isPublic !== true || this.options.read_only ? 'addClass' : 'removeClass']('public');

    if (this.options.titleAliasEdit) {
      this.$el.find('input').focus();
    }
    return this;
  },

  hide: function (done) {
    this.options.titleAliasEdit = false;
    this.elder('hide');
  }
});
