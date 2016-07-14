/* global $:false, _:false */

cdb.admin.InsetMapPlacementDropdown = cdb.ui.common.Dropdown.extend({

  className: 'dropdown inset-map-dropdown border',

  defaults: {
    speedOut: 100,
    speedIn: 100
  },

  events: {
    'click': 'killEvent',
    'dblclick': 'killEvent',
    'click li': '_onOptionClicked'
  },

  initialize: function () {
    _.bindAll(this, 'open', 'hide', '_handleClick', '_onKeyDown');

    // Extend options
    _.defaults(this.options, this.defaults);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Bind to target
    $(this.options.target).bind({'click': this._handleClick});

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    // Is open flag
    this.isOpen = false;
  },

  _onOptionClicked: function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    var xpos = $(event.target).data('xpos');
    var ypos = $(event.target).data('ypos');
    this.model.set('xPosition', xpos);
    this.model.set('yPosition', ypos);
    this.hide();
  },

  /* Check if the dropdown is visible to hiding with the click on the target */
  _handleClick: function (ev) {
    if (ev) {
      ev.preventDefault();
    }

    // If visible
    if (this.isOpen) {
      this.hide();
    } else {
      this.open();
    }
  },

  _onKeyDown: function (e) {
    if (e.keyCode === 27) {
      this.hide();
    }
  },

  /*
   * Renders the dropdown
   */
  render: function () {
    this.clearSubViews();

    this.$el.html(this.template_base(this.options));

    return this;
  },

  clean: function () {
    $(document).unbind('keydown', this._keydown);
    cdb.ui.common.Dropdown.prototype.clean.call(this);
  }
});
