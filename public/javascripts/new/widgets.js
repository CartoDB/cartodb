/**************************************************************************
* SERVERS DROPDOWN
**************************************************************************/
(function($, window, undefined) {

  // constants
  var TRUE = true, FALSE = true, NULL = null
    , name = 'serversDropdown'
   // Plugin parts
    , Core, API, Helper
   // default options
    , defaultOptions = {
        globalEvents : []
      };


    /***************************************************************************
    * Private methods
    **************************************************************************/
    Core = {
      pluginName : name,
      options : null,

    _init : function (options) {
      // take user options in consideration
      Core.options = $.extend( true, defaultOptions, options );
      return this.each( function () {
        var $el = $(this);

        // Bind events
        Core._bind($el);
      });
    },


    _bind: function($el) {
      $el.find('a').bind({click: Core._changeServer});
    },

    _trigger : function ( eventName, data, $el ) {
      var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;
      if ( !isGlobal ) {
        $el.trigger( eventName, data );
      } else {
        $.event.trigger( eventName, data );
      }
    },

    // PRIVATE LOGIC
    _stopPropagation: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
    },

    _changeServer: function(ev) {
      Core._stopPropagation(ev);

      var $el = $(ev.target).closest('ul')
        , $li = $(ev.target).closest('li')
        , server = $(ev.target).attr('data-value')
        , $input = $el.find('input');


      // Add 'selected' class
      if ($li.hasClass('selected')) return;

      $el.find('li.selected').removeClass('selected');
      $li.addClass('selected');
      
      $input.val(server);

      Core._trigger('change',server,$el);
    }
  };


  /***************************************************************************
   * Plugin installation
  **************************************************************************/
  $.fn[name] = function (userInput) {

    // check if such method exists
    if ( $.type( userInput ) === "string" && API[ userInput ] ) {
      return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
    }
    // initialise otherwise
    else if ( $.type( userInput ) === "object" || !userInput ) {
      return Core._init.apply( this, arguments );
    } else {
      $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
    }
  };
})( jQuery, window );




/**************************************************************************
* PLACEHOLDER
**************************************************************************/
(function($, window, undefined) {

  // constants
  var TRUE = true, FALSE = true, NULL = null
  , name = 'placeholder'
  // Plugin parts
  , Core, API, Helper
  // default options
  , defaultOptions = {
    globalEvents : []
  };

  /***************************************************************************
  * Private methods
  **************************************************************************/
  Core = {
    pluginName : name,
    options : null,

    _init : function (options) {
      // take user options in consideration
      Core.options = $.extend( true, defaultOptions, options );
      return this.each( function () {
        var $el = $(this);

        // Add custom html
        Core._addCustom($el);

        // Check if input has value
        Core._check($el);

        // Bind events
        Core._bind($el);
      });
    },


    _bind: function($el) {
      $el.data('label').bind({'click':Core._onLabelClick});
      $el.bind({'keyup': Core._onChange});
    },


    _trigger : function ( eventName, data, $el ) {
      var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

      if (!isGlobal) {
        $el.trigger( eventName, data );
      } else {
        $.event.trigger( eventName, data );
      }
    },


    // PRIVATE LOGIC
    _stopPropagation: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
    },

    _addCustom: function($el) {
      // Create label
      var $label = $('<label>').text($el.attr('data-label'));

      // Add label
      $el.before($label);

      // Set label to the element
      $el.data('label',$label);

      // Set input for label
      $label.data('input',$el);
    },

    _check: function($el) {
      // Check if element has a previous value
      if ($el.val() != '') {
        $el.data('label').hide();
      }
    },

    _onChange: function(ev) {
      var value = $(ev.target).val()
        , $label = $(ev.target).data('label');

      if (value.length>0) {
        $label.fadeOut(10);
      } else {
        $label.fadeIn(300);
      }
    },

    _onLabelClick: function(ev) {
      // Focus on input when clicks in the label
      $(ev.target).data('input').focus();
    }
  };


  /***************************************************************************
  * Plugin installation
  **************************************************************************/
  $.fn[name] = function (userInput) {
    // check if such method exists
    if ( $.type( userInput ) === "string" && API[ userInput ] ) {
      return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
    }
    // initialise otherwise
    else if ( $.type( userInput ) === "object" || !userInput ) {
      return Core._init.apply( this, arguments );
    } else {
      $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
    }
  };
})( jQuery, window );



/**************************************************************************
* FORM ERRORS
**************************************************************************/
(function($, window, undefined) {

  // constants
  var TRUE = true, FALSE = true, NULL = null
  , name = 'showErrors'
  // Plugin parts
  , Core, API, Helper
  // default options
  , defaultOptions = {
    globalEvents : []
  };

  /***************************************************************************
  * Private methods
  **************************************************************************/
  Core = {
    pluginName : name,
    options : null,

    _init : function (options) {
      // take user options in consideration
      Core.options = $.extend( true, defaultOptions, options );
      return this.each( function () {
        var $el = $(this);

        // Append necessary html
        Core._addCustom($el);

        // Bind events
        Core._bind($el);
      });
    },


    _bind: function($el) {
      $el.find('a').bind({'click':Core._stopPropagation,'mouseover':Core._onMouseover,'mouseout':Core._onMouseout})
    },


    _trigger : function ( eventName, data, $el ) {
      var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

      if (!isGlobal) {
        $el.trigger( eventName, data );
      } else {
        $.event.trigger( eventName, data );
      }
    },


    // PRIVATE LOGIC
    _stopPropagation: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
    },

    _addCustom: function($el) {
      var text = $el.text();
      $el.html('<a class="error" tabindex="-1"></a>' + '<p>' + text + '<span class="tail"></span></p>');
      $el.show();
    },

    _onMouseover: function(ev) {
      var $p = $(ev.target).parent().find('p')
        , height_ = $p.outerHeight();

      $p.css({opacity:0,display:'inline-block',top: '-' + (height_ + 10 ) + 'px'}).show();

      if ($.browser.msie && $.browser.version<9) {
        $p.css({
          top: '-=5px',
          opacity: 1,
          display: 'block'
        });
      } else {
        $p.animate({
          top: '-=5px',
          opacity: 1
        },200);
      }
    },

    _onMouseout: function(ev) {
      var $p = $(ev.target).parent().find('p');

      if ($.browser.msie && $.browser.version<9) {
        $p.css({
          top: '+=5px',
          opacity: 0,
          display: 'none'
        });
      } else {
        $p.animate({
          top: '+=5px',
          opacity: 0
        },200,function(ev){
          $(this).hide();
        });
      }

    }
  };


  /***************************************************************************
  * Plugin installation
  **************************************************************************/
  $.fn[name] = function (userInput) {
    // check if such method exists
    if ( $.type( userInput ) === "string" && API[ userInput ] ) {
      return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
    }
    // initialise otherwise
    else if ( $.type( userInput ) === "object" || !userInput ) {
      return Core._init.apply( this, arguments );
    } else {
      $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
    }
  };
})( jQuery, window );



/**************************************************************************
* CHECKBOX PLUGIN
**************************************************************************/
(function($, window, undefined) {

  // constants
  var TRUE = true, FALSE = true, NULL = null
  , name = 'customCheckbox'
  // Plugin parts
  , Core, API, Helper
  // default options
  , defaultOptions = {
    globalEvents : []
  };


  /***************************************************************************
* Private methods
**************************************************************************/
  Core = {
    pluginName : name,
    options : null,


    _init : function (options) {
      // take user options in consideration
      Core.options = $.extend( true, defaultOptions, options );
      return this.each( function () {
        var $el = $(this);

        // Append necessary html
        Core._addCustom($el);

        // Bind events
        Core._bind($el);
      });
    },


    _bind: function($el) {
      $el.data('checkbox').bind({'click':Core._onClick,'focusin':Core._onFocusin,'focusout':Core._onFocusout});
      $el.data('label').bind({'click':Core._onLabelClick});
    },


    _trigger : function ( eventName, data, $el ) {
      var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' + Core.pluginName;

      if (!isGlobal) {
        $el.trigger( eventName, data );
      } else {
        $.event.trigger( eventName, data );
      }
    },


    // PRIVATE LOGIC
    _stopPropagation: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
    },

    _addCustom: function($el) {
      var error = $el.parent().hasClass('field_with_errors')
        , $custom_check = $(document.createElement('a')).attr({'class':'checkbox ' + ($el.attr('checked') || ''),'tabIndex':0})
        , $label = $el.closest('div.field').find('p');

      if (error) {
        $custom_check.addClass('error');
        $label.addClass('error');
      }

      $el.after($custom_check);
      $custom_check.data('checkbox',$el);
      $el.data('checkbox',$custom_check);
      $el.data('label',$label);
      $label.data('checkbox',$custom_check);
      $el.focusin(Core._onCheckboxFocus).hide();
    },

    _onLabelClick: function(ev) {
      Core._stopPropagation(ev);
      var $checkbox = $(ev.target).data('checkbox');
      $checkbox.click();
    },

    _onCheckboxFocus: function(ev) {
      var $el = $(ev.target);
      $el.data('checkbox').focus();
    },

    _onClick: function(ev) {
      Core._stopPropagation(ev);
      var $el = $(ev.target).data('checkbox')
      , checked;

      if ($(ev.target).hasClass('checked')) {
        $(ev.target).removeClass('checked');
        $el.removeAttr('checked');
      } else {
        $(ev.target).addClass('checked');
        $el.attr('checked','checked');
      }
    },

    _onFocusin: function(ev) {
      $(ev.target).keydown(function(ev){
        var keycode = ev.which;
        if (keycode == 13) {
          $(ev.target).click();
        }
      });
    },

    _onFocusout: function(ev) {
      $(ev.target).unbind('keydown');
    }
  };


  /***************************************************************************
* Plugin installation
**************************************************************************/
  $.fn[name] = function (userInput) {
    // check if such method exists
    if ( $.type( userInput ) === "string" && API[ userInput ] ) {
      return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
    }
    // initialise otherwise
    else if ( $.type( userInput ) === "object" || !userInput ) {
      return Core._init.apply( this, arguments );
    } else {
      $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
    }
  };
})( jQuery, window );




/**
 * Moves the scroll to the position of $el
 *
 * @param {jQuery} [$el] String to be checked
 * @param {Hash} [opt] Optional arguments (speed, delay)
 * @param {Function} [callback] Optional callback
*/

function goTo($el, opt, callback) {
  if ($el) {
    var speed  = (opt && opt.speed)  || 500;
    var delay  = (opt && opt.delay)  || 200;
    var margin = (opt && opt.margin) || 0;

    $('html, body').delay(delay).animate({scrollTop:$el.offset().top - margin}, speed);
    callback && callback();
  }
}