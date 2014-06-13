
  /**
   *  Show color picker when user clicks over
   *  a color in the Codemirror editor.
   *
   *  new cdb.admin.CodemirrorColorPicker({
   *    editor: codemirror-editor...
   *  })
   */

  cdb.admin.CodemirrorColorPicker = cdb.core.View.extend({

    initialize: function() {
      this.editor = this.options.editor;
      this._initBinds();
    },

    _initBinds: function() {
      _.bindAll(this, '_onClick', '_destroyPicker', '_onBlur', '_replaceColor');
      var self = this;

      this.editor.on('mousedown', function(ed, e){
        // Hack needed preventing cursor positioning bug
        setTimeout(function(){ self._onClick(e) }, 50);
      }, this);
      this.editor.on('blur',            this._onBlur,         this);
      this.editor.on('viewportChange',  this._destroyPicker,  this);
      this.editor.on('scroll',          this._destroyPicker,  this);
    },

    _disableBinds: function() {
      this.editor.off('mousedown');
      this.editor.off('blur',           this._onBlur,         this);
      this.editor.off('viewportChange', this._destroyPicker,  this);
      this.editor.off('scroll',         this._destroyPicker,  this);
      cdb.god.unbind('closeDialogs',    this._destroyPicker,  this);
    },

    _onClick: function(e) {
      e.preventDefault();

      var cursor = this.editor.getCursor(true);
      var token = this.editor.getTokenAt(cursor);

      if (token.type === "color" && e.target.nodeName.toLowerCase() === "span") {
        this._openColorPicker(e, cursor, token);
      } else if (this.color_picker) {
        this._destroyPicker();
      }
    },

    _openColorPicker: function(e, cursor, token) {
      this._destroyPicker();
      this._createPicker(e);
      $('body').append(this.color_picker.render().el);
      this.color_picker.init(token.string);
    },

    _createPicker: function(e) {
      this.color_picker = new cdb.admin.ColorPicker({
        target:       $(e.target),
        extra_colors: this._getCurrentUsedColors()
      }).bind("colorChosen", this._replaceColor, this);
      this._bindPickerEvents();
      this.addView(this.color_picker);
    },

    _getCurrentUsedColors: function() {
      if (!this.model) return [];
      
      // Tile style
      var style = this.model.get("tile_style");
      var cartoParser = new cdb.admin.CartoParser(style);
      return cartoParser.colorsUsed( { mode: "hex" });
    },

    // If user clicks over the color picker
    // we have to avoid blur event
    _bindPickerEvents: function() {
      if (this.color_picker) {
        var self = this;

        this.editor.on('blur', this._onBlur, this);

        this.color_picker.$el.on("mousedown", function() {
          self.editor.off('blur', self._onBlur, self);
        });

        this.color_picker.$el.on("mousemove", function() {
          self.editor.off('blur', self._onBlur, self);
        });

        this.color_picker.$el.on("mouseup", function() {
          self.editor.on('blur', self._onBlur, self);
        });

        setTimeout(function() {
          cdb.god.bind('closeDialogs', self._destroyPicker, self);
        },100)
      }
    },

    _unbindPickerEvents: function() {
      if (this.color_picker) {
        this.editor.on('blur', this._onBlur, this);
        this.color_picker.$el.off("mousedown mousemove mouseup");
        cdb.god.unbind('closeDialogs', this._destroyPicker, this);
      }
    },

    _destroyPicker: function() {
      if (this.color_picker) {
        this._unbindPickerEvents();
        this.removeView(this.color_picker);
        this.color_picker.hide();
        delete this.color_picker;
      }
    },

    _onBlur: function(ed) {
      this._destroyPicker();
    },

    _replaceColor: function(color, close) {
      var cursor = this.editor.getCursor();
      
      var nameMatch = this._getMatch(cursor, "name");
      var hexMatch = this._getMatch(cursor, "hex");
      var match = nameMatch ? nameMatch : hexMatch ;

      var start = {
        line: cursor.line,
        ch: match.start
      };
      var end = {
        line: cursor.line,
        ch: match.end
      };

      // Replace the color
      this.editor.replaceRange(color, start, end);

      // Focus the into the editor and set the cursor
      // It will let user to save style
      this.editor.focus();
      this.editor.setCursor(end);

      // Color chosen, let's trigger it!
      this.trigger('colorChosen', this);

      // Need to close picker?
      if (close) this._destroyPicker();
    },

    _getMatch: function(cursor, type) {
      if (!type) return;
      var re;

      switch (type.toLowerCase()) {
       case "name":
        re = new RegExp(color_keywords.join('|'),"g");
        break; 
       case "hsl":
        re = /hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3}\%)\s*,\s*(\d{1,3}\%)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)/g;
        break;
       case "rgb":
        re = /rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/;
        break;
       case "hex":
        re = /#[a-fA-F0-9]{3,6}/g;
        break;
       default:
        cdb.log.info("invalid color match selection");
        return;
      }

      var line = this.editor.getLine(cursor.line);
      var match = re.exec(line);

      while (match) {
        var val = match[0];
        var len = val.length;
        var start = match.index;
        var end = match.index + len;
        if (cursor.ch >= start && cursor.ch <= end) {
          match = null;
          return {
            start: start,
            end: end,
            string: val
          };
        }
        match = re.exec(line);
      }
      return;
    },

    clean: function() {
      this._disableBinds();
      cdb.core.View.prototype.clean.call(this);
    }

  });