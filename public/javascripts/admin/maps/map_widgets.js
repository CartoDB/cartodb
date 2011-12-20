
/*****************/
/*	MAP WIDGETS	 */
/*****************/	

/* COLOR INPUT */
(function($, window, undefined) {

	// constants
	var TRUE = true, FALSE = true, NULL = null
		, name = 'colorPicker'
 	// Plugin parts
 		, Core, API, Helper
 	// default options
	 	, defaultOptions = {
	  		globalEvents : [],
	  		colors: [
		    	 ['black','#000000'],['grey', '#E2DADA'],['red', '#E25B5B'],['orange', '#FF9900'],['yellow', '#FFCC00'],['green', '#99CC00']
		    	,['blue', '#0099FF'],['pink', '#FF3366'],['dark_black', '#000000'],['dark_red', '#AB4343'],['dark_orange', '#D78100'],['dark_yellow', '#B59100']
		    	,['dark_green', '#719700'],['dark_blue', '#006BB4'],['dark_pink', '#AA2143'],['dark_grey', '#B7B0B0']
		    ]
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
		   	Core._addElements($el);

		   	// Bind events
		   	Core._bind($el);
		 	});
		},
 

	  _bind: function($el) {
	    $el.find('a.control').bind({'click': Core._showPalette});
	    $el.find('input').bind({'change': Core._changeColor});
	    $el.find('span.palette ul li a').bind({'click': Core._chooseColor});
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

   	_showPalette: function (ev) {
  		ev.preventDefault();
  		var $el = $(this).closest('span.color');
      var palette = $el.find('span.palette');
      if (!palette.is(':visible')) {
      	 // Close all palettes - TODO Improve
        $('span.color span.palette').each(function(i,palette){
          $(palette).hide();
        });
        // Show this one
        palette.show();
      } else {
      	palette.hide();
      }
   	},


   	_changeColor: function (ev) {
   		ev.preventDefault();
   		var color = new RGBColor($(this).val());
   		var $el = $(this).closest('span.color');
			if (color.ok) {
			 	var new_color = color.toHex();
			 	var css_ = $el.attr('css');
			 	$el.find('a.control').removeClass('error').css({'background-color':new_color});
			 	$(this).removeClass('error');
			 	// CHANGE COLOR
			 	Core.options.change(new_color);
			} else {
				$(this).addClass('error');
			 	$el.find('a.control').removeAttr('style').addClass('error');
			}
   	},


   	_chooseColor: function (ev) {
      ev.preventDefault();
      // Get the value
      var new_color = $(this).attr('href')
      	,	$el 			= $(this).closest('span.color');
      
      // Hide the palette
      $(this).closest('span.palette').hide();
      
      // Save the new color
      $el.find('a.control').removeClass('error').css({'background-color':new_color});
      $el.find('input').val(new_color);
      $(this).removeClass('error');

      // CHANGE THE COLOR!
      Core.options.change(new_color);
   	},


   	_addElements: function($el) {
    	// 		- Create the color list
     	var colors_list = '<ul>';
      _.each(defaultOptions.colors,function(color,i){
      	colors_list += '<li><a href="' + color[1] + '" style="background-color:' + color[1] + '">' + color[0] + '</a></li>';
      });
      colors_list += '</ul>';
      $el.append(
      	'<span class="palette">' + colors_list + '</span>'+
      	'<a href="#change_color" class="control"></a>'+
      	'<input type="text" value="#FF6600"/>'
      );
	  }

 	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {
		// YOUR PLUGIN PUBLIC LOGIC HERE
	};


	/***************************************************************************
	 * Static methods
	**************************************************************************/
	 // var pluginPrototype = $.fn[name];
	 // pluginPrototype.methodName = Core.methodName;


	/***************************************************************************
	 * Helpers (general purpose private methods)
	**************************************************************************/
	Helper = {};


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


/* ALPHA SLIDER */
(function($, window, undefined) {

	// constants
 	var TRUE = true, FALSE = true, NULL = null
 		, name = 'customSlider'
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
		   	Core._addElements($el);

		   	// Bind events
		   	Core._bind($el);
		 	});
		},


	  _bind: function($el) {
	  	// Just the slider
	  	$el.find('div.slider').slider({
        max:100,
        min:0,
        range: "min",
        value: Core.options.value || 50,
        slide: Core._slide,
        stop: Core._stop
      });
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
   	_slide: function(ev,ui) {
   		$el = $(ui.handle).closest('span.alpha');
   		$el.find('span.tooltip')
      	.css({left:$(ui.handle).css('left')})
        .text(ui.value+'%')
        .show();
   	},

   	_stop: function(ev,ui) {
   		$el = $(ui.handle).closest('span.alpha');
   		$el.find('span.tooltip').hide();
      Core.options.change(ui.value);
   	}, 	

   	_addElements: function($el) {
   		// Add the slider
      $el.append(
      	'<div class="slider"></div>'+
        '<span class="tooltip">83%</span>'
      );
	  }

 	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {};


	 /***************************************************************************
	 * Static methods
	**************************************************************************/
	 // var pluginPrototype = $.fn[name];
	 // pluginPrototype.methodName = Core.methodName;


	/***************************************************************************
	 * Helpers (general purpose private methods)
	**************************************************************************/
	Helper = {};


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


/* RANGE INPUT */
(function($, window, undefined) {

	// constants
 	var TRUE = true, FALSE = true, NULL = null
 		, name = 'rangeInput'
	 // Plugin parts
	 	, Core, API, Helper
	 // default options
	 	, interval
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
		   	Core._addElements($el);

		   	// Bind events
		   	Core._bind($el);
		 	});
		},


	  _bind: function($el) {
      $el.find('a').click(Core._changeValue);
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

   	_changeValue: function(ev) {
   		ev.preventDefault();

	    var old_value = $(this).parent().find('input').val(),
	        add = ($(this).text()=="+")?true:false,
	        that = this;
	        
	    // TODO: Add logic of max and min 

	    if (add || old_value>0) {
				var new_value = parseInt(old_value) + ((add)?1:-1);
	      $(that).parent().find('input').val(new_value);
	      
	      clearInterval(interval);
	      interval = setTimeout(function(){
	        Core.options.change(new_value);
	      },400);
	    }
   	},


   	_addElements: function($el) {
   		// Add the range input
      $el.append(
      	'<input disabled="disabled" class="range_value" type="text" value="3"/>'+
        '<a href="#add_one_line_width" class="range_up" href="#range">+</a>'+
        '<a href="#deduct_one_line_width" class="range_down" href="#range">-</a>'
      );

      // Max?
      if (Core.options.type=="max") {
      	$el.append(
	      	'<p>Max</p>'
	      );
      }

      // Min?
      if (Core.options.type=="min") {
      	$el.append(
	      	'<p>Min</p>'
	      );
      }
	  }

 	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {};


	 /***************************************************************************
	 * Static methods
	**************************************************************************/
	 // var pluginPrototype = $.fn[name];
	 // pluginPrototype.methodName = Core.methodName;


	/***************************************************************************
	 * Helpers (general purpose private methods)
	**************************************************************************/
	Helper = {};


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


/* DROPDOWN */
(function($, window, undefined) {

	// constants
 	var TRUE = true, FALSE = true, NULL = null
 		, name = 'customDropdown'
	 // Plugin parts
	 	, Core, API, Helper
	 // default options
	 	, interval
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
		   	Core._addElements($el);

		   	// Bind events
		   	Core._bind($el);
		 	});
		},


	  _bind: function($el) {
      
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

   	_changeValue: function(ev) {
   		
   	},


   	_addElements: function($el) {
   		// Add the range input
      $el.append(
      	''
      );
	  }

 	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {};


	 /***************************************************************************
	 * Static methods
	**************************************************************************/
	 // var pluginPrototype = $.fn[name];
	 // pluginPrototype.methodName = Core.methodName;


	/***************************************************************************
	 * Helpers (general purpose private methods)
	**************************************************************************/
	Helper = {};


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