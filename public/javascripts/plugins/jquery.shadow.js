/*!
 * Shadow animation jQuery-plugin 1.5
 * http://www.bitstorm.org/jquery/shadow-animation/
 * Copyright 2011 Edwin Martin <edwin@bitstorm.org>
 * Contributors: Mark Carver, Xavier Lepretre
 * Released under the MIT and GPL licenses.
 */
jQuery(function(e,i){function j(){var a=e("script:first"),b=a.css("color"),c=false;if(/^rgba/.test(b))c=true;else try{c=b!=a.css("color","rgba(0, 0, 0, 0.5)").css("color");a.css("color",b)}catch(d){}return c}function k(a,b,c){var d=[];a.c&&d.push("inset");typeof b.left!="undefined"&&d.push(parseInt(a.left+c*(b.left-a.left),10)+"px "+parseInt(a.top+c*(b.top-a.top),10)+"px");typeof b.blur!="undefined"&&d.push(parseInt(a.blur+c*(b.blur-a.blur),10)+"px");typeof b.a!="undefined"&&d.push(parseInt(a.a+c*
(b.a-a.a),10)+"px");if(typeof b.color!="undefined"){var g="rgb"+(e.support.rgba?"a":"")+"("+parseInt(a.color[0]+c*(b.color[0]-a.color[0]),10)+","+parseInt(a.color[1]+c*(b.color[1]-a.color[1]),10)+","+parseInt(a.color[2]+c*(b.color[2]-a.color[2]),10);if(e.support.rgba)g+=","+parseFloat(a.color[3]+c*(b.color[3]-a.color[3]));g+=")";d.push(g)}return d.join(" ")}function h(a){var b,c,d={};if(b=/#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/.exec(a))c=[parseInt(b[1],16),parseInt(b[2],16),parseInt(b[3],
16),1];else if(b=/#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/.exec(a))c=[parseInt(b[1],16)*17,parseInt(b[2],16)*17,parseInt(b[3],16)*17,1];else if(b=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(a))c=[parseInt(b[1],10),parseInt(b[2],10),parseInt(b[3],10),1];else if(b=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([01\.]*)\s*\)/.exec(a))c=[parseInt(b[1],10),parseInt(b[2],10),parseInt(b[3],10),parseFloat(b[4])];d=(b=/(-?[0-9]+)(?:px)?\s+(-?[0-9]+)(?:px)?(?:\s+(-?[0-9]+)(?:px)?)?(?:\s+(-?[0-9]+)(?:px)?)?/.exec(a))?
{left:parseInt(b[1],10),top:parseInt(b[2],10),blur:b[3]?parseInt(b[3],10):0,a:b[4]?parseInt(b[4],10):0}:{left:0,top:0,blur:0,a:0};d.c=/inset/.test(a);d.color=c;return d}e.extend(true,e,{support:{rgba:j()}});var f;e.each(["boxShadow","MozBoxShadow","WebkitBoxShadow"],function(a,b){a=e("html").css(b);if(typeof a=="string"&&a!=""){f=b;return false}});if(f)e.fx.step.boxShadow=function(a){if(!a.init){a.b=h(e(a.elem).css(f));a.end=e.extend({},a.b,h(a.options.curAnim.boxShadow));if(a.b.color==i)a.b.color=
a.end.color||[0,0,0];a.init=true}a.elem.style[f]=k(a.b,a.end,a.pos)}});
