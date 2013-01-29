/**
 * info window module, allow to edit the infowindow appearance
 * and the fields that will be shown
 */

cdb.admin.mod = cdb.admin.mod || {};

(function() {

var Field = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click .switch': 'toggle',
    'click .title': 'toggleTitle'
  },

  template: _.template(
    '<span class="ellipsis"><%- fieldName %></span>\
    <div class="switches">\
      <a href="#title" class="checkbox small light title">\
        <span class="check"></span>\
        title?\
      </a>\
      <a href="#switch" class="switch">\
        <span class="handle"></span>\
      </a>\
    </div>'),

  initialize: function() {
    this.fieldName = this.options.field;
    this.position  = this.options.position;

    this.model.bind('change:fields', this.fieldChange, this);
  },

  fieldChange: function() {

    if(this.model.containsField(this.fieldName)) {
      this.$('.switch').removeClass('disabled').addClass('enabled');
    } else {
      this.$('.switch').removeClass('enabled').addClass('disabled');
    }

    // title
    var t = this.model.getFieldProperty(this.fieldName, 'title');

    if(t) {
      this.$('.title').removeClass('disabled').addClass('enabled');
    } else {
      this.$('.title').removeClass('enabled').addClass('disabled');
    }

  },

  toggle: function(e) {
    e.preventDefault();

    if (!this.model.containsField(this.fieldName)) {
      this.model.addField(this.fieldName, this.position);
    } else {
      this.model.removeField(this.fieldName);
    }

    return false;
  },

  toggleTitle: function(e) {
    e.preventDefault();
    var t = this.model.getFieldProperty(this.fieldName, 'title');
    this.model.setFieldProperty(this.fieldName, 'title', !t);
    return false;
  },

  render: function() {
    this.$el.append(this.template(this));
    this.fieldChange();
    this.$el.attr('cid', this.cid);
    this.$el.addClass('drag_field');

    return this;
  }

});

cdb.admin.mod.InfoWindow = cdb.core.View.extend({

    buttonClass: 'infowindow_mod',
    className: 'infowindow_panel',
    type: 'tool',

    events: {
      'click .selectall': '_manageAll'
    },

    initialize: function() {
      var self = this;
      this.selectedAll = true;
      this.add_related_model(this.options.table);

      this.template = this.getTemplate('table/menu_modules/views/infowindow');
      this.model.bind('remove:fields', this.renderSelectAll, this);
      this.model.bind('add:fields', this.renderSelectAll, this);
      this.options.table.bind('change:schema', this.render, this);
      this.options.table.linkToInfowindow(this.model);
    },

    activated: function() {},

    disabled: function() {
      this.model.saveFields();
      this.model.clearFields();
      this.model.set('disabled', true);
    },

    enabled: function() {
      this.model.restoreFields();
      this.model.unset('disabled');
    },

    // column names to be rendered
    getColumnNames: function() {
      var self = this;
      var names = this.options.table.columnNames();
      return _(names).filter(function(c) {
        return !_.contains(self.model.SYSTEM_COLUMNS, c);
      });
    },

    renderFields: function() {
      var self = this;
      var $f = this.$('.fields');

      var names = this.getColumnNames();

      names.sort(function(a, b) {
        var pos_a = self.model.getFieldPos(a, 'position');
        var pos_b = self.model.getFieldPos(b, 'position');
        return pos_a - pos_b;
      });

      _(names).each(function(f) {
        var v = new Field({ model: self.model,  field: f , position: self.model.getFieldPos(f) });
        self.addView(v);
        $f.append(v.render().el);
      });

      // Sorteable list, except theme field!
      $f.sortable({
        items: 'li:gt(0)',
        stop: function(ev, ui) {
          self._reasignPositions();
        }
      });
    },

    // when fields are sorted in the iu we should recalculate all models positions
    _reasignPositions: function() {
      var self = this;
      this.$el.find('.drag_field').each(function(i, el) {
        var v = self._subviews[$(el).attr('cid')];
        v.model.setFieldProperty(v.fieldName, 'position', i);
        v.position = i;
      });

    },

    renderThemeCombo: function() {
      var themes = new cdb.forms.Combo({
        property: 'template_name',
        extra: [
          ['light',             'table/views/infowindow_light'],
          ['dark',              'table/views/infowindow_dark'],
          ['header blue',       'table/views/infowindow_light_header_blue'],
          ['header green',      'table/views/infowindow_light_header_green'],
          ['header yellow',     'table/views/infowindow_light_header_yellow'],
          ['header orange',     'table/views/infowindow_light_header_orange'],
          ['header with image', 'table/views/infowindow_header_with_image']
        ],
        model: this.model
      });

      var $f = this.$('.fields');
      var li = $('<li>');

      li
        .append(themes.render().el)
        .append('<span>Theme</span>');

      $f.append(li);

      this.addView(themes);
    },

    renderSelectAll: function() {
      var select_all = true
        , self = this;
      _(this.getColumnNames()).each(function(f) {
        if (!self.model.containsField(f)) {
          select_all = false;
        }
      });

      this.selectedAll = select_all;

      this._changeSelectAll();
    },

    render: function() {
      this.clearSubViews();
      this.$el.html(this.template({}));
      this.$el.find('.fields').sortable("destroy")
      this.renderThemeCombo();
      this.renderFields();
      this.$selectAll = this.$el.find(".selectall");
      this.renderSelectAll();

      // Custom scroll actions! :)
      this.custom_scroll = new cdb.admin.CustomScrolls({
        el: this.$el.find(".panel_content div.wrapper")
      });
      this.addView(this.custom_scroll);

      return this;
    },

    _manageAll: function(e) {

      var self = this;
      this.killEvent(e);

      if (this.working) return;

      self.model.clearFields();

      if (!self.selectedAll) self._selectAll();
      else self._unselectAll();

    },

    _selectAll: function() {
      var self = this;

      var
      names    = this.getColumnNames(),
      count    = _.size(names) - 1,
      promises = [];

      _(names).each(function(f) {
        self.working = true;
        promises.push(self.model._addField(f));
      });

      $.when.apply($, promises).then(function() {

        self.working = false;
        self.model.sortFields();
        self.model.trigger('change:fields');

        self._toggleSelectAll();

      });

    },

    _unselectAll: function() {

      this.model.trigger('change:fields');
      this._toggleSelectAll();
    },

    _toggleSelectAll: function() {
      this.selectedAll = !this.selectedAll;
      this._changeSelectAll();
    },

    _changeSelectAll: function() {

      if (!this.working) {

        this.$selectAll.removeClass("working");

        if (!this.selectedAll) {
          this.$selectAll.addClass("disabled").removeClass("enabled");
        } else {
          this.$selectAll.addClass("enabled").removeClass("disabled");
        }

      } else {
        this.$selectAll.addClass("enabled working");
      }
    }

});


})();
