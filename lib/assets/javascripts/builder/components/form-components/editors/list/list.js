var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

var OPTIONS = [
  'userModel',
  'configModel',
  'modals',
  'layerDefinitionModel',
  'trackingClass'
];

Backbone.Form.editors.List = Backbone.Form.editors.Base.extend({

  events: {
    'click [data-action="add"]': function (event) {
      event.preventDefault();
      if (this._canAddNewItems()) {
        this.addItem(null, true);
      }
    }
  },

  initialize: function (options) {
    options = options || {};

    var editors = Backbone.Form.editors;

    editors.Base.prototype.initialize.call(this, options);
    EditorHelpers.setOptions(this, options);

    var schema = this.schema;
    if (!schema) throw new Error("Missing required option 'schema'");

    this.template = options.template || schema.listTemplate || this.constructor.template;

    // Determine the editor to use
    this.Editor = (function () {
      var type = schema.itemType;

      // Default to Text
      if (!type) return editors.Text;

      // Use List-specific version if available
      if (editors.List[type]) return editors.List[type];

      // Or whichever was passed
      return editors[type];
    })();

    _.each(OPTIONS, function (item) {
      if (this.options[item]) {
        this['_' + item] = this.options[item];
      }
    }, this);

    this.items = [];
    this.errors = [];

    this._initBinds();
  },

  render: function () {
    var self = this;
    var value = this.value || [];

    // Create main element
    var $el = $($.trim(this.template()));

    // Store a reference to the list (item container)
    this.$list = $el.is('[data-items]') ? $el : $el.find('[data-items]');

    this.setElement($el);
    this.$el.attr('id', this.id);
    this.$el.attr('name', this.key);

    // Add existing items
    if (value.length) {
      _.each(value, function (itemValue) {
        self.addItem(itemValue);
      });
    } else {
      // If no existing items create an empty one, unless the editor specifies otherwise
      if (!this.Editor.isAsync) this.addItem(null, true);
    }

    if (this.hasFocus) this.trigger('blur', this);

    this.validate();
    return this;
  },

  _initBinds: function () {
    if (this.options.maxItems) {
      this.listenTo(this, 'add remove', this._setAddButtonState);
    }
  },

  /**
   * Add a new item to the list
   * @param {Mixed} [value]           Value for the new item editor
   * @param {Boolean} [userInitiated] If the item was added by the user clicking 'add' or pressing `Enter`
   */
  addItem: function (value, userInitiated) {
    var self = this;
    var editors = Backbone.Form.editors;

    var defaultOptions = {
      list: this,
      form: this.form,
      schema: this.schema,
      value: value,
      Editor: this.Editor,
      key: this.key
    };

    var customOptions = _.reduce(OPTIONS, function (memo, item) {
      if (this.options[item]) {
        memo[item] = this['_' + item];
      }
      return memo;
    }, {}, this);

    var options = _.extend({}, defaultOptions, customOptions);

    // Create the item
    var item = new editors.List.Item(options).render();

    var _addItem = function () {
      self.items.push(item);
      self.$list.append(item.el);

      item.editor.on('all', function (event) {
        if (event === 'change') return;

        // args = ["key:change", itemEditor, fieldEditor]
        var args = _.toArray(arguments);
        args[0] = 'item:' + event;
        args.splice(1, 0, self);
        // args = ["item:key:change", this=listEditor, itemEditor, fieldEditor]

        editors.List.prototype.trigger.apply(this, args);
      }, self);

      item.editor.on('change', function () {
        if (!item.addEventTriggered) {
          item.addEventTriggered = true;
          this.trigger('add', this, item.editor);
        }
        this.trigger('item:change', this, item.editor);
        this.trigger('change', this);
      }, self);

      item.editor.on('focus', function () {
        if (this.hasFocus) return;
        this.trigger('focus', this);
      }, self);
      item.editor.on('blur', function () {
        if (!this.hasFocus) return;
        var self = this;
        setTimeout(function () {
          if (_.find(self.items, function (item) {
            return item.editor.hasFocus;
          })) return;
          self.trigger('blur', self);
        }, 0);
      }, self);

      if (userInitiated || value) {
        item.addEventTriggered = true;
      }

      if (userInitiated) {
        self.trigger('add', self, item.editor);
        self.trigger('change', self);
      }
    };

    // Check if we need to wait for the item to complete before adding to the list
    if (this.Editor.isAsync) {
      item.editor.on('readyToAdd', _addItem, this);
    } else {
      // Most editors can be added automatically
      _addItem();
      item.editor.focus();
    }

    return item;
  },

  /**
   * Remove an item from the list
   * @param {List.Item} item
   */
  removeItem: function (item) {
    // Confirm delete
    var confirmMsg = this.schema.confirmDelete;
    if (confirmMsg && !confirm(confirmMsg)) return; // eslint-disable-line

    var index = _.indexOf(this.items, item);

    this.items[index].remove();
    this.items.splice(index, 1);

    if (item.addEventTriggered) {
      this.trigger('remove', this, item.editor);
      this.trigger('change', this);
    }

    if (!this.items.length && !this.Editor.isAsync) this.addItem();
  },

  getValue: function () {
    var values = _.map(this.items, function (item) {
      return item.getValue();
    });

    // Filter empty items
    return _.without(values, undefined, '');
  },

  setValue: function (value) {
    this.value = value;
    this.render();
  },

  focus: function () {
    if (this.hasFocus) return;

    if (this.items[0]) this.items[0].editor.focus();
  },

  blur: function () {
    if (!this.hasFocus) return;

    var focusedItem = _.find(this.items, function (item) {
      return item.editor.hasFocus;
    });

    if (focusedItem) focusedItem.editor.blur();
  },

  /**
   * Override default remove function in order to remove item views
   */
  remove: function () {
    _.invoke(this.items, 'remove');

    Backbone.Form.editors.Base.prototype.remove.call(this);
  },

  /**
   * Run validation
   *
   * @return {Object|Null}
   */
  validate: function () {
    if (!this.validators) return null;

    // Collect errors
    var errors = _.map(this.items, function (item) {
      return item.validate();
    });

    // Max items Check
    if (this.options.maxItems && this.options.maxItems < this.items.length) {
      errors.push(_t('form-components.editors.list.max-items'));
    }

    this.errors = _.compact(errors);
    // Check if any item has errors
    var hasErrors = !!this.errors.length;
    this._setAddButtonState();

    if (!hasErrors) return null;
  },

  _errorPresenter: function (errors) {
    return _.unique(this.errors.map(function (error) {
      return error.message;
    })).join('\n');
  },

  _setAddButtonState: function () {
    var $button = this._getAddButtonElement();
    var hasErrors = !!this.errors.length;

    $button.toggleClass('is-disabled', hasErrors);

    if (hasErrors) {
      this._errorTooltip = new TipsyTooltipView({
        el: $button,
        gravity: 's',
        offset: 0,
        title: this._errorPresenter.bind(this)
      });
    } else {
      if (this._errorTooltip) {
        this._errorTooltip.clean();
        this._errorTooltip = null;
      }
    }

    if (this.options.maxItems) {
      $button.toggle(this.items.length < this.options.maxItems);
    }
  },

  _getAddButtonElement: function () {
    return this.$('[data-action="add"]');
  },

  _canAddNewItems: function () {
    var opts = this.options;
    var maxItemsReached = (opts.maxItems && opts.maxItems <= this.items.length) || false;
    return !this.errors.length && !maxItemsReached;
  }
}, {

  /* eslint-disable */
  template: _.template('\
      <div>\
        <div data-items></div>\
        <button type="button" data-action="add">Add</button>\
      </div>\
    ', null, Backbone.Form.templateSettings)
  /* eslint-enable */
});
