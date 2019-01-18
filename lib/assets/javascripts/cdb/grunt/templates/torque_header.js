if(cartodb){
	// Keep the global version of jQuery, if there is any
	if(window.$){
		window._prev = {jQuery: window.$, $: window.$} 
	}
	window.$ = window.jQuery = cartodb.$;
} 