cdb.admin.ExportImageFormatsDropdown = cdb.admin.DropdownMenu.extend({
  className: 'dropdown border tiny',

  events: {
    'click .js-format': '_onClick'
  },

  initialize: function() {
    this.elder('initialize');
    if (!this.model) {
      throw new Error('model is required');
    }
    this.model.on('change:format', this._onChangeFormat, this);
    this.template_base = cdb.templates.getTemplate('table/views/export_image_formats');
  },

  render: function() {
    this.$el.html(this.template_base(this.model.attributes));

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);

    $('body').append(this.el);

    return this;
  },

  _onClick: function(e) {
    this.killEvent(e);
    this.model.set('format', $(e.target).data('format'));
    this.hide();
  },

  _onChangeFormat: function() {
    this.$('.js-format').removeClass('is-selected');
    this.$("[data-format=" + this.model.get('format') + "]").addClass('is-selected');
  
  },

  clean: function() {
    // Until https://github.com/CartoDB/cartodb.js/issues/238 is resolved:
    $(this.options.target).unbind('click', this._handleClick);
    this.constructor.__super__.clean.apply(this);
  }

});
