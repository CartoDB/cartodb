!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;"undefined"!=typeof window?t=window:"undefined"!=typeof global?t=global:"undefined"!=typeof self&&(t=self),t.carto=e()}}(function(){var define,module,exports;return function e(t,n,r){function i(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(s)return s(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return i(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var s=typeof require=="function"&&require;for(var o=0;o<r.length;o++)i(r[o]);return i}({1:[function(e,t,n){(function(e){function i(t){return e.functions.hsla(t.h,t.s,t.l,t.a)}function s(t){return t instanceof e.Dimension?parseFloat(t.unit=="%"?t.value/100:t.value):typeof t=="number"?t:NaN}function o(e){return Math.min(1,Math.max(0,e))}e.functions={rgb:function(e,t,n){return this.rgba(e,t,n,1)},rgba:function(t,n,r,i){var o=[t,n,r].map(function(e){return s(e)});return i=s(i),o.some(isNaN)||isNaN(i)?null:new e.Color(o,i)},stop:function(e){var t,n;return arguments.length>1&&(t=arguments[1]),arguments.length>2&&(n=arguments[2]),{is:"tag",val:e,color:t,mode:n,toString:function(r){return'\n	<stop value="'+e.ev(r)+'"'+(t?' color="'+t.ev(r)+'" ':"")+(n?' mode="'+n.ev(r)+'" ':"")+"/>"}}},hsl:function(e,t,n){return this.hsla(e,t,n,1)},hsla:function(e,t,n,r){function u(e){return e=e<0?e+1:e>1?e-1:e,e*6<1?o+(i-o)*e*6:e*2<1?i:e*3<2?o+(i-o)*(2/3-e)*6:o}e=s(e)%360/360,t=s(t),n=s(n),r=s(r);if([e,t,n,r].some(isNaN))return null;var i=n<=.5?n*(t+1):n+t-n*t,o=n*2-i;return this.rgba(u(e+1/3)*255,u(e)*255,u(e-1/3)*255,r)},hue:function(t){return"toHSL"in t?new e.Dimension(Math.round(t.toHSL().h)):null},saturation:function(t){return"toHSL"in t?new e.Dimension(Math.round(t.toHSL().s*100),"%"):null},lightness:function(t){return"toHSL"in t?new e.Dimension(Math.round(t.toHSL().l*100),"%"):null},alpha:function(t){return"toHSL"in t?new e.Dimension(t.toHSL().a):null},saturate:function(e,t){if("toHSL"in e){var n=e.toHSL();return n.s+=t.value/100,n.s=o(n.s),i(n)}return null},desaturate:function(e,t){if("toHSL"in e){var n=e.toHSL();return n.s-=t.value/100,n.s=o(n.s),i(n)}return null},lighten:function(e,t){if("toHSL"in e){var n=e.toHSL();return n.l+=t.value/100,n.l=o(n.l),i(n)}return null},darken:function(e,t){if("toHSL"in e){var n=e.toHSL();return n.l-=t.value/100,n.l=o(n.l),i(n)}return null},fadein:function(e,t){if("toHSL"in e){var n=e.toHSL();return n.a+=t.value/100,n.a=o(n.a),i(n)}return null},fadeout:function(e,t){if("toHSL"in e){var n=e.toHSL();return n.a-=t.value/100,n.a=o(n.a),i(n)}return null},spin:function(e,t){if("toHSL"in e){var n=e.toHSL(),r=(n.h+t.value)%360;return n.h=r<0?360+r:r,i(n)}return null},replace:function(e,t,n){return e.is==="field"?e.toString+".replace("+t.toString()+", "+n.toString()+")":e.replace(t,n)},mix:function(t,n,r){var i=r.value/100,s=i*2-1,o=t.toHSL().a-n.toHSL().a,u=((s*o==-1?s:(s+o)/(1+s*o))+1)/2,a=1-u,f=[t.rgb[0]*u+n.rgb[0]*a,t.rgb[1]*u+n.rgb[1]*a,t.rgb[2]*u+n.rgb[2]*a],l=t.alpha*i+n.alpha*(1-i);return new e.Color(f,l)},greyscale:function(t){return this.desaturate(t,new e.Dimension(100))},"%":function(t){var n=Array.prototype.slice.call(arguments,1),r=t.value;for(var i=0;i<n.length;i++)r=r.replace(/%s/,n[i].value).replace(/%[da]/,n[i].toString());return r=r.replace(/%%/g,"%"),new e.Quoted(r)}};var t=["emboss","blur","gray","sobel","edge-detect","x-gradient","y-gradient","sharpen"];for(var n=0;n<t.length;n++){var r=t[n];e.functions[r]=function(t){return function(){return new e.ImageFilter(t)}}(r)}e.functions["agg-stack-blur"]=function(t,n){return new e.ImageFilter("agg-stack-blur",[t,n])},e.functions["scale-hsla"]=function(t,n,r,i,s,o,u,a){return new e.ImageFilter("scale-hsla",[t,n,r,i,s,o,u,a])}})(e("./tree"))},{"./tree":7}],2:[function(e,t,n){(function(t,r){function u(){if(t.browser)return e("../../package.json").version.split(".");if(parseInt(t.version.split(".")[1],10)>4)return e("../../package.json").version.split(".");var n=JSON.parse(s.readFileSync(o.join(r,"../../package.json")));return n.version.split(".")}function l(e,t){var n={bold:[1,22],inverse:[7,27],underline:[4,24],yellow:[33,39],green:[32,39],red:[31,39],grey:[90,39]};return"["+n[t][0]+"m"+e+"["+n[t][1]+"m"}var i=e("util"),s=e("fs"),o=e("path"),a={version:u(),Parser:e("./parser").Parser,Renderer:e("./renderer").Renderer,tree:e("./tree"),RendererJS:e("./renderer_js"),default_reference:e("./torque-reference"),writeError:function(e,t){var n="",r=e.extract,s=[];t=t||{};if(t.silent)return;t.indent=t.indent||"";if(!("index"in e)||!r)return i.error(t.indent+(e.stack||e.message));typeof r[0]=="string"&&s.push(l(e.line-1+" "+r[0],"grey")),r[1]===""&&typeof r[2]=="undefined"&&(r[1]="¶"),s.push(e.line+" "+r[1].slice(0,e.column)+l(l(r[1][e.column],"bold")+r[1].slice(e.column+1),"yellow")),typeof r[2]=="string"&&s.push(l(e.line+1+" "+r[2],"grey")),s=t.indent+s.join("\n"+t.indent)+"[0m\n",n=t.indent+n+l(e.message,"red"),e.filename&&(n+=l(" in ","red")+e.filename),i.error(n,s),e.callLine&&(i.error(l("from ","red")+(e.filename||"")),i.error(l(e.callLine,"grey")+" "+e.callExtract)),e.stack&&i.error(l(e.stack,"red"))}};e("./tree/call"),e("./tree/color"),e("./tree/comment"),e("./tree/definition"),e("./tree/dimension"),e("./tree/element"),e("./tree/expression"),e("./tree/filterset"),e("./tree/filter"),e("./tree/field"),e("./tree/keyword"),e("./tree/layer"),e("./tree/literal"),e("./tree/operation"),e("./tree/quoted"),e("./tree/imagefilter"),e("./tree/reference"),e("./tree/rule"),e("./tree/ruleset"),e("./tree/selector"),e("./tree/style"),e("./tree/url"),e("./tree/value"),e("./tree/variable"),e("./tree/zoom"),e("./tree/invalid"),e("./tree/fontset"),e("./tree/frame_offset"),e("./functions");for(var f in a)n[f]=a[f]}).call(this,e("_process"),"/lib/carto")},{"../../package.json":44,"./functions":1,"./parser":3,"./renderer":4,"./renderer_js":5,"./torque-reference":6,"./tree":7,"./tree/call":8,"./tree/color":9,"./tree/comment":10,"./tree/definition":11,"./tree/dimension":12,"./tree/element":13,"./tree/expression":14,"./tree/field":15,"./tree/filter":16,"./tree/filterset":17,"./tree/fontset":18,"./tree/frame_offset":19,"./tree/imagefilter":20,"./tree/invalid":21,"./tree/keyword":22,"./tree/layer":23,"./tree/literal":24,"./tree/operation":25,"./tree/quoted":26,"./tree/reference":27,"./tree/rule":28,"./tree/ruleset":29,"./tree/selector":30,"./tree/style":31,"./tree/url":32,"./tree/value":33,"./tree/variable":34,"./tree/zoom":35,_process:40,fs:36,path:39,util:42}],3:[function(e,t,n){(function(t){var r=n,i=e("./tree"),s=t._||e("underscore");r.Parser=function(t){function v(){u=l[o],a=r,c=r}function m(){l[o]=u,r=a,c=r}function g(){r>c&&(l[o]=l[o].slice(r-c),c=r)}function y(e){var t,i,s,u,a,f,p;if(e instanceof Function)return e.call(h.parsers);if(typeof e=="string")t=n.charAt(r)===e?e:null,s=1,g();else{g(),t=e.exec(l[o]);if(!t)return null;s=t[0].length}if(t){var d=r+=s;f=r+l[o].length-s;while(r<f){u=n.charCodeAt(r);if(u!==32&&u!==10&&u!==9)break;r++}return l[o]=l[o].slice(s+(r-d)),c=r,l[o].length===0&&o<l.length-1&&o++,typeof t=="string"?t:t.length===1?t[0]:t}}function b(e){return typeof e=="string"?n.charAt(r)===e:!!e.test(l[o])}function w(e,t){return(e.slice(0,t).match(/\n/g)||"").length+1}function E(e){var r;s(e).defaults({index:f,filename:t.filename,message:"Parse error.",line:0,column:-1}),e.filename&&p.env.inputs&&p.env.inputs[e.filename]?r=p.env.inputs[e.filename]:r=n,e.line=w(r,e.index);for(var i=e.index;i>=0&&r.charAt(i)!=="\n";i--)e.column++;return new Error(s("<%=filename%>:<%=line%>:<%=column%> <%=message%>").template(e))}var n,r,o,u,a,f,l,c,h,p=this,d=function(){};return this.env=t=t||{},this.env.filename=this.env.filename||null,this.env.inputs=this.env.inputs||{},h={extractErrorLine:w,parse:function(e){var s,u,a,h,d,v,m=[],g,b=null;r=o=c=f=0,l=[],n=e.replace(/\r\n/g,"\n"),t.filename&&(p.env.inputs[t.filename]=n);var w=!1;l=function(e){var t=0,r=/(?:@\{[\w-]+\}|[^"'`\{\}\/\(\)\\])+/g,i=/\/\*(?:[^*]|\*+[^\/*])*\*+\/|\/\/.*/g,s=/"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)'|`((?:[^`]|\\.)*)`/g,o=0,u,a=e[0],f;for(var l=0,c,h;l<n.length;){r.lastIndex=l,(u=r.exec(n))&&u.index===l&&(l+=u[0].length,a.push(u[0])),c=n.charAt(l),i.lastIndex=s.lastIndex=l;if(u=s.exec(n))if(u.index===l){l+=u[0].length,a.push(u[0]);continue}if(!f&&c==="/"){h=n.charAt(l+1);if(h==="/"||h==="*")if(u=i.exec(n))if(u.index===l){l+=u[0].length,a.push(u[0]);continue}}switch(c){case"{":if(!f){o++,a.push(c);break};case"}":if(!f){o--,a.push(c),e[++t]=a=[];break};case"(":if(!f){f=!0,a.push(c);break};case")":if(f){f=!1,a.push(c);break};default:a.push(c)}l++}return o!==0&&(b={index:l-1,type:"Parse",message:o>0?"missing closing `}`":"missing opening `{`"}),e.map(function(e){return e.join("")})}([[]]);if(b)throw E(b);s=new i.Ruleset([],y(this.parsers.primary)),s.root=!0,s.toList=function(){var e,t,n;return function(e){e.error=function(t){e.errors||(e.errors=new Error("")),e.errors.message?e.errors.message+="\n"+E(t).message:e.errors.message=E(t).message},e.frames=e.frames||[];var t=this.flatten([],[],e);return t.sort(S),t}}();var S=function(e,t){var n=e.specificity,r=t.specificity;return n[0]!=r[0]?r[0]-n[0]:n[1]!=r[1]?r[1]-n[1]:n[2]!=r[2]?r[2]-n[2]:r[3]-n[3]};return s},parsers:{primary:function(){var e,t=[];while((e=y(this.rule)||y(this.ruleset)||y(this.comment))||y(/^[\s\n]+/)||(e=y(this.invalid)))e&&t.push(e);return t},invalid:function(){var e=y(/^[^;\n]*[;\n]/);if(e)return new i.Invalid(e,a)},comment:function(){var e;if(n.charAt(r)!=="/")return;if(n.charAt(r+1)==="/")return new i.Comment(y(/^\/\/.*/),!0);if(e=y(/^\/\*(?:[^*]|\*+[^\/*])*\*+\/\n?/))return new i.Comment(e)},entities:{quoted:function(){if(n.charAt(r)!=='"'&&n.charAt(r)!=="'")return;var e=y(/^"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)'/);if(e)return new i.Quoted(e[1]||e[2])},field:function(){if(!y("["))return;var e=y(/(^[^\]]+)/);if(!y("]"))return;if(e)return new i.Field(e[1])},comparison:function(){var e=y(/^=~|=|!=|<=|>=|<|>/);if(e)return e},keyword:function(){var e=y(/^[A-Za-z-]+[A-Za-z-0-9_]*/);if(e)return new i.Keyword(e)},call:function(){var e,t;if(!(e=/^([\w\-]+|%)\(/.exec(l[o])))return;e=e[1];if(e==="url")return null;r+=e.length,y("("),t=y(this.entities.arguments);if(!y(")"))return;if(e)return new i.Call(e,t,r)},arguments:function(){var e=[],t;while(t=y(this.expression)){e.push(t);if(!y(","))break}return e},literal:function(){return y(this.entities.dimension)||y(this.entities.keywordcolor)||y(this.entities.hexcolor)||y(this.entities.quoted)},url:function(){var e;if(n.charAt(r)!=="u"||!y(/^url\(/))return;return e=y(this.entities.quoted)||y(this.entities.variable)||y(/^[\-\w%@$\/.&=:;#+?~]+/)||"",y(")")?new i.URL(typeof e.value!="undefined"||e instanceof i.Variable?e:new i.Quoted(e)):new i.Invalid(e,a,"Missing closing ) in URL.")},variable:function(){var e,s=r;if(n.charAt(r)==="@"&&(e=y(/^@[\w-]+/)))return new i.Variable(e,s,t.filename)},hexcolor:function(){var e;if(n.charAt(r)==="#"&&(e=y(/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/)))return new i.Color(e[1])},keywordcolor:function(){var e=l[o].match(/^[a-z]+/);if(e&&e[0]in i.Reference.data.colors)return new i.Color(i.Reference.data.colors[y(/^[a-z]+/)])},dimension:function(){var e=n.charCodeAt(r);if(e>57||e<45||e===47)return;var t=y(/^(-?\d*\.?\d+(?:[eE][-+]?\d+)?)(\%|\w+)?/);if(t)return new i.Dimension(t[1],t[2],a)}},variable:function(){var e;if(n.charAt(r)==="@"&&(e=y(/^(@[\w-]+)\s*:/)))return e[1]},entity:function(){return y(this.entities.call)||y(this.entities.literal)||y(this.entities.field)||y(this.entities.variable)||y(this.entities.url)||y(this.entities.keyword)},end:function(){return y(";")||b("}")},element:function(){var e=y(/^(?:[.#][\w\-]+|\*|Map)/);if(e)return new i.Element(e)},attachment:function(){var e=y(/^::([\w\-]+(?:\/[\w\-]+)*)/);if(e)return e[1]},selector:function(){var e,t,s,o=[],u,f=new i.Filterset,l,c=[],h=i.FrameOffset.none;segments=0,conditions=0;while((s=y(this.element))||(l=y(this.zoom))||(fo=y(this.frame_offset))||(u=y(this.filter))||(e=y(this.attachment))){segments++;if(s)o.push(s);else if(l)c.push(l),conditions++;else if(fo)h=fo,conditions++;else if(u){var p=f.add(u);if(p)throw E({message:p,index:r-1});conditions++}else{if(t)throw E({message:"Encountered second attachment name.",index:r-1});t=e}var d=n.charAt(r);if(d==="{"||d==="}"||d===";"||d===",")break}if(segments)return new i.Selector(f,c,h,o,t,conditions,a)},filter:function(){v();var e,n,r;if(!y("["))return;if(e=y(/^[a-zA-Z0-9\-_]+/)||y(this.entities.quoted)||y(this.entities.variable)||y(this.entities.keyword)||y(this.entities.field)){e instanceof i.Quoted&&(e=new i.Field(e.toString()));if((n=y(this.entities.comparison))&&(r=y(this.entities.quoted)||y(this.entities.variable)||y(this.entities.dimension)||y(this.entities.keyword)||y(this.entities.field))){if(!y("]"))throw E({message:"Missing closing ] of filter.",index:a-1});return e.is||(e=new i.Field(e)),new i.Filter(e,n,r,a,t.filename)}}},frame_offset:function(){v();var e,t;if(y(/^\[\s*frame-offset/g)&&(e=y(this.entities.comparison))&&(t=y(/^\d+/))&&y("]"))return i.FrameOffset(e,t,a)},zoom:function(){v();var e,t;if(y(/^\[\s*zoom/g)&&(e=y(this.entities.comparison))&&(t=y(this.entities.variable)||y(this.entities.dimension))&&y("]"))return new i.Zoom(e,t,a);m()},block:function(){var e;if(y("{")&&(e=y(this.primary))&&y("}"))return e},ruleset:function(){var e=[],t,n,r,s,o=[];v();while(t=y(this.selector)){e.push(t);while(y(this.comment));if(!y(","))break;while(y(this.comment));}if(t)while(y(this.comment));if(e.length>0&&(s=y(this.block))){if(e.length===1&&e[0].elements.length&&e[0].elements[0].value==="Map"){var u=new i.Ruleset(e,s);return u.isMap=!0,u}return new i.Ruleset(e,s)}m()},rule:function(){var e,s,o=n.charAt(r);v();if(o==="."||o==="#")return;if(e=y(this.variable)||y(this.property)){s=y(this.value);if(s&&y(this.end))return new i.Rule(e,s,a,t.filename);f=r,m()}},font:function(){var e=[],t=[],n,r,s;while(s=y(this.entity))t.push(s);e.push(new i.Expression(t));if(y(","))while(s=y(this.expression)){e.push(s);if(!y(","))break}return new i.Value(e)},value:function(){var e,t=[];while(e=y(this.expression)){t.push(e);if(!y(","))break}if(t.length>1)return new i.Value(t.map(function(e){return e.value[0]}));if(t.length===1)return new i.Value(t)},sub:function(){var e;if(y("(")&&(e=y(this.expression))&&y(")"))return e},multiplication:function(){var e,t,n,r;if(e=y(this.operand)){while((n=y("/")||y("*")||y("%"))&&(t=y(this.operand)))r=new i.Operation(n,[r||e,t],a);return r||e}},addition:function(){var e,t,s,o;if(e=y(this.multiplication)){while((s=y(/^[-+]\s+/)||n.charAt(r-1)!=" "&&(y("+")||y("-")))&&(t=y(this.multiplication)))o=new i.Operation(s,[o||e,t],a);return o||e}},operand:function(){return y(this.sub)||y(this.entity)},expression:function(){var e,t,n=[],r;while(e=y(this.addition)||y(this.entity))n.push(e);if(n.length>0)return new i.Expression(n)},property:function(){var e=y(/^(([a-z][-a-z_0-9]*\/)?\*?-?[-a-z_0-9]+)\s*:/);if(e)return e[1]}}},h}}).call(this,typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"./tree":7,underscore:undefined}],4:[function(e,t,n){(function(n){function s(e,t,n,r){var i=t.filters,s=t.rules,o,u,a;for(var f=0;f<e.length;f++)o=e[f].filters.cloneWith(i),o?(a=n[o],a?a.addRules(s):(u=e[f].clone(o),u.addRules(s)&&(n[o]=u,e.splice(f,0,u),f++))):o===null&&(e[f]=e[f].clone(),e[f].addRules(s));return e}function o(e,t){var n=+(new Date),r={},i={},o=[],u,a,f;e.forEach(function(e){e.filters.ev(t)});for(var l=0;l<e.length;l++){f=e[l].attachment,u=[e[l]],r[f]||(r[f]=[],r[f].attachment=f,i[f]={},o.push(r[f]));for(var c=l+1;c<e.length;c++)e[c].attachment===f&&(u=s(u,e[c],i[f],t));for(var h=0;h<u.length;h++)i[f][u[h].filters]=u[h],r[f].push(u[h])}return t.benchmark&&console.warn("Inheritance time: "+(new Date-n)+"ms"),o}function u(e,t){return t.index-e.index}function a(e,t){for(var n=0;n<e.length;n++){var r=e[n];r.index=Infinity;for(var i=0;i<r.length;i++){var s=r[i].rules;for(var o=0;o<s.length;o++){var a=s[o];a.index<r.index&&(r.index=a.index)}}}var f=e.slice();return f.sort(u),f}function f(e,t,n){var s={},o=i.tree.Reference.data.symbolizers.map;return r(e).each(function(e,t){t in o&&(s[t]=t+'="'+e+'"')}),t.filter(function(e){return e.elements.join("")==="Map"}).forEach(function(e){for(var t=0;t<e.rules.length;t++){var r=e.rules[t].name;r in o||n.error({message:"Rule "+r+" not allowed for Map.",index:e.rules[t].index}),s[r]=e.rules[t].ev(n).toXML(n)}}),s}var r=n._||e("underscore"),i=e("./index");i.Renderer=function(t,n){this.env=t||{},this.options=n||{},this.options.mapnik_version=this.options.mapnik_version||"3.0.0"},i.Renderer.prototype.renderMSS=function(t){var n=r(this.env).defaults({benchmark:!1,validation_data:!1,effects:[]});if(!i.tree.Reference.setVersion(this.options.mapnik_version))throw new Error("Could not set mapnik version to "+this.options.mapnik_version);var s=[],u=[];n.benchmark&&console.time("Parsing MSS");var f=i.Parser(n).parse(t);n.benchmark&&console.timeEnd("Parsing MSS"),n.benchmark&&console.time("Rule generation");var l=f.toList(n);n.benchmark&&console.timeEnd("Rule generation"),n.benchmark&&console.time("Rule inheritance");var c=o(l,n);n.benchmark&&console.timeEnd("Rule inheritance"),n.benchmark&&console.time("Style sort");var h=a(c,n);n.benchmark&&console.timeEnd("Style sort"),n.benchmark&&console.time("Total Style generation");for(var p=0,d,v;p<h.length;p++){d=h[p],v="style"+(d.attachment!=="__default__"?"-"+d.attachment:""),u.push(v);var m='	Style "'+v+'" (#'+p+") toXML";n.benchmark&&console.time(m),s.push(i.tree.StyleXML(v,d.attachment,d,n)),n.benchmark&&console.timeEnd(m)}n.benchmark&&console.timeEnd("Total Style generation");if(n.errors)throw n.errors;return s.join("\n")},i.Renderer.prototype.render=function(t){function l(e,t){return function(e){return e.appliesTo(h.name,t)}}var n=r(this.env).defaults({benchmark:!1,validation_data:!1,effects:[],ppi:90.714});if(!i.tree.Reference.setVersion(this.options.mapnik_version))throw new Error("Could not set mapnik version to "+this.options.mapnik_version);var s=[],u=r(t.Stylesheet).chain().map(function(e){if(typeof e=="string")throw new Error("Stylesheet object is expected not a string: '"+e+"'");n=r(n).extend({filename:e.id});var t=+(new Date),s=i.Parser(n).parse(e.data);return n.benchmark&&console.warn("Parsing time: "+(new Date-t)+"ms"),s.toList(n)}).flatten().value(),c,h,p,d,v,m;for(var g=0;g<t.Layer.length;g++){h=t.Layer[g],c=[],p={},n.benchmark&&console.warn("processing layer: "+h.id);var y=(h["class"]||"").split(/\s+/g);for(var b=0;b<y.length;b++)p[y[b]]=!0;m=u.filter(l(h.name,p)),d=o(m,n),v=a(d,n);for(var w=0,E,S;w<v.length;w++){E=v[w],S=h.name+(E.attachment!=="__default__"?"-"+E.attachment:"");var x=i.tree.StyleXML(S,E.attachment,E,n);x&&(s.push(x),c.push(S))}s.push(i.tree.LayerXML(h,c))}s.unshift(n.effects.map(function(e){return e.toXML(n)}).join("\n"));var T=f(t,u,n);if(n.errors)throw n.errors;var N=r(t).reduce(function(e,t,n){if(!t&&t!==0)return e;switch(n){case"srs":case"Layer":case"Stylesheet":break;case"bounds":case"center":case"minzoom":case"maxzoom":case"version":e.push('  <Parameter name="'+n+'">'+t+"</Parameter>");break;case"name":case"description":case"legend":case"attribution":case"template":e.push('  <Parameter name="'+n+'"><![CDATA['+t+"]]></Parameter>");break;case"format":e.push('  <Parameter name="'+n+'">'+t+"</Parameter>");break;case"interactivity":e.push('  <Parameter name="interactivity_layer">'+t.layer+"</Parameter>"),e.push('  <Parameter name="interactivity_fields">'+t.fields+"</Parameter>");break;default:"string"==typeof t?e.push('  <Parameter name="'+n+'"><![CDATA['+t+"]]></Parameter>"):"number"==typeof t?e.push('  <Parameter name="'+n+'">'+t+"</Parameter>"):"boolean"==typeof t&&e.push('  <Parameter name="'+n+'">'+t+"</Parameter>")}return e},[]);N.length&&s.unshift("<Parameters>\n"+N.join("\n")+"\n</Parameters>\n");var C=r(T).map(function(e){return" "+e}).join("");return s.unshift('<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE Map[]>\n<Map'+C+">\n"),s.push("</Map>"),s.join("\n")},t.exports=i,t.exports.addRules=s,t.exports.inheritDefinitions=o,t.exports.sortStyles=a}).call(this,typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"./index":2,underscore:undefined}],5:[function(require,module,exports){(function(global){(function(carto){function CartoCSS(e,t){this.options=t||{},this.imageURLs=[],e&&this.setStyle(e)}var tree=require("./tree"),_=global._||require("underscore");CartoCSS.Layer=function(e,t){this.options=t,this.shader=e},CartoCSS.Layer.prototype={fullName:function(){return this.shader.attachment},name:function(){return this.fullName().split("::")[0]},frames:function(){return this.shader.frames},attachment:function(){return this.fullName().split("::")[1]},eval:function(e){var t=this.shader[e];if(!t||!t.style)return;return t.style({},{zoom:0,"frame-offset":0})},getStyle:function(e,t){var n={};for(var r in this.shader)r!=="attachment"&&r!=="zoom"&&r!=="frames"&&r!=="symbolizers"&&(n[r]=this.shader[r].style(e,t));return n},getSymbolizers:function(){return this.shader.symbolizers},isVariable:function(){for(var e in this.shader)if(e!=="attachment"&&e!=="zoom"&&e!=="frames"&&e!=="symbolizers"&&!this.shader[e].constant)return!0;return!1},getShader:function(){return this.shader},filter:function(e,t,n){for(var r in this.shader){var i=this.shader[r](t,n);if(i)return!0}return!1},transformGeometry:function(e){return e},transformGeometries:function(e){return e}},CartoCSS.prototype={setStyle:function(e){var t=this.parse(e);if(!t)throw new Error(this.parse_env.errors);this.layers=t.map(function(e){return new CartoCSS.Layer(e)})},getLayers:function(){return this.layers},getDefault:function(){return this.findLayer({attachment:"__default__"})},findLayer:function(e){return _.find(this.layers,function(t){for(var n in e){var r=t[n];typeof r=="function"&&(r=r.call(t));if(e[n]!==r)return!1}return!0})},_createFn:function(e){var t=e.join("\n");return this.options.debug&&console.log(t),Function("data","ctx","var _value = null; "+t+"; return _value; ")},_compile:function(shader){typeof shader=="string"&&(shader=eval("(function() { return "+shader+"; })()")),this.shader_src=shader;for(var attr in shader){var c=mapper[attr];c&&(this.compiled[c]=eval("(function() { return shader[attr]; })();"))}},getImageURLs:function(){return this.imageURLs},parse:function(e){var t={frames:[],errors:[],error:function(e){this.errors.push(e)}};this.parse_env=t;var n=null;try{n=(new carto.Parser(t)).parse(e)}catch(r){t.errors.push(r.message);return}if(n){function i(e){return e.elements[0]+"::"+e.attachment}var s=n.toList(t);s.reverse();var o={};for(var u=0;u<s.length;++u){var a=s[u],f=i(a),l=o[f]=o[f]||{symbolizers:[]};for(var c=0;c<a.rules.length;c++)if(a.rules[c].name==="marker-file"||a.rules[c].name==="point-file"){var h=a.rules[c].value.value[0].value[0].value.value;this.imageURLs.push(h)}l.frames=[],l.zoom=tree.Zoom.all;var p=a.toJS(t);this.options.debug&&console.log("props",p);for(var d in p){var v=l[d]=l[d]||{constant:!1,symbolizer:null,js:[],index:0};v.js.push(p[d].map(function(e){return e.js}).join("\n")),v.symbolizer=_.first(p[d].map(function(e){return e.symbolizer})),v.index=_.max(p[d].map(function(e){return e.index}).concat(v.index)),v.constant=!_.any(p[d].map(function(e){return!e.constant}))}}var m=[];this.options.debug&&console.log(o);var g={};for(var u=0;u<s.length;++u){var a=s[u],y=i(a),l=o[y];if(!g[y]){this.options.debug&&console.log("**",y);for(var b in l)b!=="zoom"&&b!=="frames"&&b!=="symbolizers"&&(this.options.debug&&console.log("*",b),l[b].style=this._createFn(l[b].js),l.symbolizers.push(l[b].symbolizer),l.symbolizers=_.uniq(l.symbolizers));l.attachment=y,m.push(l),g[y]=!0}l.zoom|=a.zoom,l.frames.push(a.frame_offset)}for(u=0;u<m.length;++u)m[u].frames=_.uniq(m[u].frames);return m}return null}},carto.RendererJS=function(e){this.options=e||{},this.options.mapnik_version=this.options.mapnik_version||"latest"},carto.RendererJS.prototype.render=function(t,n){var r=require("./torque-reference");return tree.Reference.setData(r.version.latest),new CartoCSS(t,this.options)},typeof module!="undefined"&&(module.exports=carto.RendererJS)})(require("../carto"))}).call(this,typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"../carto":2,"./torque-reference":6,"./tree":7,underscore:undefined}],6:[function(e,t,n){var r={version:"2.1.1",style:{"filter-mode":{type:["all","first"],doc:"Control the processing behavior of Rule filters within a Style. If 'all' is used then all Rules are processed sequentially independent of whether any previous filters matched. If 'first' is used then it means processing ends after the first match (a positive filter evaluation) and no further Rules in the Style are processed ('first' is usually the default for CSS implementations on top of Mapnik to simplify translation from CSS to Mapnik XML)","default-value":"all","default-meaning":"All Rules in a Style are processed whether they have filters or not and whether or not the filter conditions evaluate to true."},"image-filters":{css:"image-filters","default-value":"none","default-meaning":"no filters",type:"functions",functions:[["agg-stack-blur",2],["emboss",0],["blur",0],["gray",0],["sobel",0],["edge-detect",0],["x-gradient",0],["y-gradient",0],["invert",0],["sharpen",0],["colorize-alpha",-1],["color-to-alpha",1],["scale-hsla",8]],doc:"A list of image filters."},"comp-op":{css:"comp-op","default-value":"src-over","default-meaning":"add the current layer on top of other layers",doc:"Composite operation. This defines how this layer should behave relative to layers atop or below it.",type:["clear","src","dst","src-over","source-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","lighter","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]},opacity:{css:"opacity",type:"float",doc:"An alpha value for the style (which means an alpha applied to all features in separate buffer and then composited back to main buffer)","default-value":1,"default-meaning":"no separate buffer will be used and no alpha will be applied to the style after rendering"}},layer:{name:{"default-value":"",type:"string",required:!0,"default-meaning":"No layer name has been provided",doc:"The name of a layer. Can be anything you wish and is not strictly validated, but ideally unique  in the map"},srs:{"default-value":"",type:"string","default-meaning":"No srs value is provided and the value will be inherited from the Map's srs",doc:"The spatial reference system definition for the layer, aka the projection. Can either be a proj4 literal string like '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs' or, if the proper proj4 epsg/nad/etc identifier files are installed, a string that uses an id like: '+init=epsg:4326'"},status:{"default-value":!0,type:"boolean","default-meaning":"This layer will be marked as active and available for processing",doc:"A property that can be set to false to disable this layer from being processed"},minzoom:{"default-value":"0",type:"float","default-meaning":"The layer will be visible at the minimum possible scale",doc:"The minimum scale denominator that this layer will be visible at. A layer's visibility is determined by whether its status is true and if the Map scale >= minzoom - 1e-6 and scale < maxzoom + 1e-6"},maxzoom:{"default-value":"1.79769e+308",type:"float","default-meaning":"The layer will be visible at the maximum possible scale",doc:"The maximum scale denominator that this layer will be visible at. The default is the numeric limit of the C++ double type, which may vary slightly by system, but is likely a massive number like 1.79769e+308 and ensures that this layer will always be visible unless the value is reduced. A layer's visibility is determined by whether its status is true and if the Map scale >= minzoom - 1e-6 and scale < maxzoom + 1e-6"},queryable:{"default-value":!1,type:"boolean","default-meaning":"The layer will not be available for the direct querying of data values",doc:"This property was added for GetFeatureInfo/WMS compatibility and is rarely used. It is off by default meaning that in a WMS context the layer will not be able to be queried unless the property is explicitly set to true"},"clear-label-cache":{"default-value":!1,type:"boolean","default-meaning":"The renderer's collision detector cache (used for avoiding duplicate labels and overlapping markers) will not be cleared immediately before processing this layer",doc:"This property, by default off, can be enabled to allow a user to clear the collision detector cache before a given layer is processed. This may be desirable to ensure that a given layers data shows up on the map even if it normally would not because of collisions with previously rendered labels or markers"},"group-by":{"default-value":"",type:"string","default-meaning":"No special layer grouping will be used during rendering",doc:"https://github.com/mapnik/mapnik/wiki/Grouped-rendering"},"buffer-size":{"default-value":"0",type:"float","default-meaning":"No buffer will be used",doc:"Extra tolerance around the Layer extent (in pixels) used to when querying and (potentially) clipping the layer data during rendering"},"maximum-extent":{"default-value":"none",type:"bbox","default-meaning":"No clipping extent will be used",doc:"An extent to be used to limit the bounds used to query this specific layer data during rendering. Should be minx, miny, maxx, maxy in the coordinates of the Layer."}},symbolizers:{"*":{"image-filters":{css:"image-filters","default-value":"none","default-meaning":"no filters",type:"functions",functions:[["agg-stack-blur",2],["emboss",0],["blur",0],["gray",0],["sobel",0],["edge-detect",0],["x-gradient",0],["y-gradient",0],["invert",0],["sharpen",0],["colorize-alpha",-1],["color-to-alpha",1],["scale-hsla",8]],doc:"A list of image filters."},"comp-op":{css:"comp-op","default-value":"src-over","default-meaning":"add the current layer on top of other layers",doc:"Composite operation. This defines how this layer should behave relative to layers atop or below it.",type:["clear","src","dst","src-over","source-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","lighter","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]},opacity:{css:"opacity",type:"float",doc:"An alpha value for the style (which means an alpha applied to all features in separate buffer and then composited back to main buffer)","default-value":1,"default-meaning":"no separate buffer will be used and no alpha will be applied to the style after rendering"}},map:{"background-color":{css:"background-color","default-value":"none","default-meaning":"transparent",type:"color",doc:"Map Background color"},"background-image":{css:"background-image",type:"uri","default-value":"","default-meaning":"transparent",doc:"An image that is repeated below all features on a map as a background.",description:"Map Background image"},srs:{css:"srs",type:"string","default-value":"+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs","default-meaning":"The proj4 literal of EPSG:4326 is assumed to be the Map's spatial reference and all data from layers within this map will be plotted using this coordinate system. If any layers do not declare an srs value then they will be assumed to be in the same srs as the Map and not transformations will be needed to plot them in the Map's coordinate space",doc:"Map spatial reference (proj4 string)"},"buffer-size":{css:"buffer-size","default-value":"0",type:"float","default-meaning":"No buffer will be used",doc:'Extra tolerance around the map (in pixels) used to ensure labels crossing tile boundaries are equally rendered in each tile (e.g. cut in each tile). Not intended to be used in combination with "avoid-edges".'},"maximum-extent":{css:"","default-value":"none",type:"bbox","default-meaning":"No clipping extent will be used",doc:"An extent to be used to limit the bounds used to query all layers during rendering. Should be minx, miny, maxx, maxy in the coordinates of the Map."},base:{css:"base","default-value":"","default-meaning":"This base path defaults to an empty string meaning that any relative paths to files referenced in styles or layers will be interpreted relative to the application process."
,type:"string",doc:"Any relative paths used to reference files will be understood as relative to this directory path if the map is loaded from an in memory object rather than from the filesystem. If the map is loaded from the filesystem and this option is not provided it will be set to the directory of the stylesheet."},"paths-from-xml":{css:"","default-value":!0,"default-meaning":"Paths read from XML will be interpreted from the location of the XML",type:"boolean",doc:"value to control whether paths in the XML will be interpreted from the location of the XML or from the working directory of the program that calls load_map()"},"minimum-version":{css:"","default-value":"none","default-meaning":"Mapnik version will not be detected and no error will be thrown about compatibility",type:"string",doc:"The minumum Mapnik version (e.g. 0.7.2) needed to use certain functionality in the stylesheet"},"font-directory":{css:"font-directory",type:"uri","default-value":"none","default-meaning":"No map-specific fonts will be registered",doc:"Path to a directory which holds fonts which should be registered when the Map is loaded (in addition to any fonts that may be automatically registered)."}},polygon:{fill:{css:"polygon-fill",type:"color","default-value":"rgba(128,128,128,1)","default-meaning":"gray and fully opaque (alpha = 1), same as rgb(128,128,128)",doc:"Fill color to assign to a polygon"},"fill-opacity":{css:"polygon-opacity",type:"float",doc:"The opacity of the polygon","default-value":1,"default-meaning":"opaque"},gamma:{css:"polygon-gamma",type:"float","default-value":1,"default-meaning":"fully antialiased",range:"0-1",doc:"Level of antialiasing of polygon edges"},"gamma-method":{css:"polygon-gamma-method",type:["power","linear","none","threshold","multiply"],"default-value":"power","default-meaning":"pow(x,gamma) is used to calculate pixel gamma, which produces slightly smoother line and polygon antialiasing than the 'linear' method, while other methods are usually only used to disable AA",doc:"An Antigrain Geometry specific rendering hint to control the quality of antialiasing. Under the hood in Mapnik this method is used in combination with the 'gamma' value (which defaults to 1). The methods are in the AGG source at https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h"},clip:{css:"polygon-clip",type:"boolean","default-value":!0,"default-meaning":"geometry will be clipped to map bounds before rendering",doc:"geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."},smooth:{css:"polygon-smooth",type:"float","default-value":0,"default-meaning":"no smoothing",range:"0-1",doc:"Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."},"geometry-transform":{css:"polygon-geometry-transform",type:"functions","default-value":"none","default-meaning":"geometry will not be transformed",doc:"Allows transformation functions to be applied to the geometry.",functions:[["matrix",6],["translate",2],["scale",2],["rotate",3],["skewX",1],["skewY",1]]},"comp-op":{css:"polygon-comp-op","default-value":"src-over","default-meaning":"add the current symbolizer on top of other symbolizer",doc:"Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",type:["clear","src","dst","src-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]}},line:{stroke:{css:"line-color","default-value":"rgba(0,0,0,1)",type:"color","default-meaning":"black and fully opaque (alpha = 1), same as rgb(0,0,0)",doc:"The color of a drawn line"},"stroke-width":{css:"line-width","default-value":1,type:"float",doc:"The width of a line in pixels"},"stroke-opacity":{css:"line-opacity","default-value":1,type:"float","default-meaning":"opaque",doc:"The opacity of a line"},"stroke-linejoin":{css:"line-join","default-value":"miter",type:["miter","round","bevel"],doc:"The behavior of lines when joining"},"stroke-linecap":{css:"line-cap","default-value":"butt",type:["butt","round","square"],doc:"The display of line endings"},"stroke-gamma":{css:"line-gamma",type:"float","default-value":1,"default-meaning":"fully antialiased",range:"0-1",doc:"Level of antialiasing of stroke line"},"stroke-gamma-method":{css:"line-gamma-method",type:["power","linear","none","threshold","multiply"],"default-value":"power","default-meaning":"pow(x,gamma) is used to calculate pixel gamma, which produces slightly smoother line and polygon antialiasing than the 'linear' method, while other methods are usually only used to disable AA",doc:"An Antigrain Geometry specific rendering hint to control the quality of antialiasing. Under the hood in Mapnik this method is used in combination with the 'gamma' value (which defaults to 1). The methods are in the AGG source at https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h"},"stroke-dasharray":{css:"line-dasharray",type:"numbers",doc:"A pair of length values [a,b], where (a) is the dash length and (b) is the gap length respectively. More than two values are supported for more complex patterns.","default-value":"none","default-meaning":"solid line"},"stroke-dashoffset":{css:"line-dash-offset",type:"numbers",doc:"valid parameter but not currently used in renderers (only exists for experimental svg support in Mapnik which is not yet enabled)","default-value":"none","default-meaning":"solid line"},"stroke-miterlimit":{css:"line-miterlimit",type:"float",doc:"The limit on the ratio of the miter length to the stroke-width. Used to automatically convert miter joins to bevel joins for sharp angles to avoid the miter extending beyond the thickness of the stroking path. Normally will not need to be set, but a larger value can sometimes help avoid jaggy artifacts.","default-value":4,"default-meaning":"Will auto-convert miters to bevel line joins when theta is less than 29 degrees as per the SVG spec: 'miterLength / stroke-width = 1 / sin ( theta / 2 )'"},clip:{css:"line-clip",type:"boolean","default-value":!0,"default-meaning":"geometry will be clipped to map bounds before rendering",doc:"geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."},smooth:{css:"line-smooth",type:"float","default-value":0,"default-meaning":"no smoothing",range:"0-1",doc:"Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."},offset:{css:"line-offset",type:"float","default-value":0,"default-meaning":"no offset",doc:"Offsets a line a number of pixels parallel to its actual path. Postive values move the line left, negative values move it right (relative to the directionality of the line)."},rasterizer:{css:"line-rasterizer",type:["full","fast"],"default-value":"full",doc:"Exposes an alternate AGG rendering method that sacrifices some accuracy for speed."},"geometry-transform":{css:"line-geometry-transform",type:"functions","default-value":"none","default-meaning":"geometry will not be transformed",doc:"Allows transformation functions to be applied to the geometry.",functions:[["matrix",6],["translate",2],["scale",2],["rotate",3],["skewX",1],["skewY",1]]},"comp-op":{css:"line-comp-op","default-value":"src-over","default-meaning":"add the current symbolizer on top of other symbolizer",doc:"Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",type:["clear","src","dst","src-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]}},markers:{file:{css:"marker-file",doc:"An SVG file that this marker shows at each placement. If no file is given, the marker will show an ellipse.","default-value":"","default-meaning":"An ellipse or circle, if width equals height",type:"uri"},opacity:{css:"marker-opacity",doc:"The overall opacity of the marker, if set, overrides both the opacity of both the fill and stroke","default-value":1,"default-meaning":"The stroke-opacity and fill-opacity will be used",type:"float"},"fill-opacity":{css:"marker-fill-opacity",doc:"The fill opacity of the marker","default-value":1,"default-meaning":"opaque",type:"float"},stroke:{css:"marker-line-color",doc:"The color of the stroke around a marker shape.","default-value":"black",type:"color"},"stroke-width":{css:"marker-line-width",doc:"The width of the stroke around a marker shape, in pixels. This is positioned on the boundary, so high values can cover the area itself.",type:"float"},"stroke-opacity":{css:"marker-line-opacity","default-value":1,"default-meaning":"opaque",doc:"The opacity of a line",type:"float"},placement:{css:"marker-placement",type:["point","line","interior"],"default-value":"point","default-meaning":"Place markers at the center point (centroid) of the geometry",doc:"Attempt to place markers on a point, in the center of a polygon, or if markers-placement:line, then multiple times along a line. 'interior' placement can be used to ensure that points placed on polygons are forced to be inside the polygon interior"},"multi-policy":{css:"marker-multi-policy",type:["each","whole","largest"],"default-value":"each","default-meaning":"If a feature contains multiple geometries and the placement type is either point or interior then a marker will be rendered for each",doc:"A special setting to allow the user to control rendering behavior for 'multi-geometries' (when a feature contains multiple geometries). This setting does not apply to markers placed along lines. The 'each' policy is default and means all geometries will get a marker. The 'whole' policy means that the aggregate centroid between all geometries will be used. The 'largest' policy means that only the largest (by bounding box areas) feature will get a rendered marker (this is how text labeling behaves by default)."},"marker-type":{css:"marker-type",type:["arrow","ellipse","rectangle"],"default-value":"ellipse",doc:"The default marker-type. If a SVG file is not given as the marker-file parameter, the renderer provides either an arrow or an ellipse (a circle if height is equal to width)"},width:{css:"marker-width","default-value":10,doc:"The width of the marker, if using one of the default types.",type:"float",expression:!0},height:{css:"marker-height","default-value":10,doc:"The height of the marker, if using one of the default types.",type:"float",expression:!0},fill:{css:"marker-fill","default-value":"blue",doc:"The color of the area of the marker.",type:"color"},"allow-overlap":{css:"marker-allow-overlap",type:"boolean","default-value":!1,doc:"Control whether overlapping markers are shown or hidden.","default-meaning":"Do not allow makers to overlap with each other - overlapping markers will not be shown."},"ignore-placement":{css:"marker-ignore-placement",type:"boolean","default-value":!1,"default-meaning":"do not store the bbox of this geometry in the collision detector cache",doc:"value to control whether the placement of the feature will prevent the placement of other features"},spacing:{css:"marker-spacing",doc:"Space between repeated labels","default-value":100,type:"float"},"max-error":{css:"marker-max-error",type:"float","default-value":.2,doc:"The maximum difference between actual marker placement and the marker-spacing parameter. Setting a high value can allow the renderer to try to resolve placement conflicts with other symbolizers."},transform:{css:"marker-transform",type:"functions",functions:[["matrix",6],["translate",2],["scale",2],["rotate",3],["skewX",1],["skewY",1]],"default-value":"","default-meaning":"No transformation",doc:"SVG transformation definition"},clip:{css:"marker-clip",type:"boolean","default-value":!0,"default-meaning":"geometry will be clipped to map bounds before rendering",doc:"geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."},smooth:{css:"marker-smooth",type:"float","default-value":0,"default-meaning":"no smoothing",range:"0-1",doc:"Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."},"geometry-transform":{css:"marker-geometry-transform",type:"functions","default-value":"none","default-meaning":"geometry will not be transformed",doc:"Allows transformation functions to be applied to the geometry.",functions:[["matrix",6],["translate",2],["scale",2],["rotate",3],["skewX",1],["skewY",1]]},"comp-op":{css:"marker-comp-op","default-value":"src-over","default-meaning":"add the current symbolizer on top of other symbolizer",doc:"Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",type:["clear","src","dst","src-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]}},shield:{name:{css:"shield-name",type:"string",expression:!0,serialization:"content",doc:'Value to use for a shield"s text label. Data columns are specified using brackets like [column_name]'},file:{css:"shield-file",required:!0,type:"uri","default-value":"none",doc:"Image file to render behind the shield text"},"face-name":{css:"shield-face-name",type:"string",validate:"font",doc:"Font name and style to use for the shield text","default-value":"",required:!0},"unlock-image":{css:"shield-unlock-image",type:"boolean",doc:"This parameter should be set to true if you are trying to position text beside rather than on top of the shield image","default-value":!1,"default-meaning":"text alignment relative to the shield image uses the center of the image as the anchor for text positioning."},size:{css:"shield-size",type:"float",doc:"The size of the shield text in pixels"},fill:{css:"shield-fill",type:"color",doc:"The color of the shield text"},placement:{css:"shield-placement",type:["point","line","vertex","interior"],"default-value":"point",doc:"How this shield should be placed. Point placement attempts to place it on top of points, line places along lines multiple times per feature, vertex places on the vertexes of polygons, and interior attempts to place inside of polygons."},"avoid-edges":{css:"shield-avoid-edges",doc:"Tell positioning algorithm to avoid labeling near intersection edges.",type:"boolean","default-value":!1},"allow-overlap":{css:"shield-allow-overlap",type:"boolean","default-value":!1,doc:"Control whether overlapping shields are shown or hidden.","default-meaning":"Do not allow shields to overlap with other map elements already placed."},"minimum-distance":{css:"shield-min-distance",type:"float","default-value":0,doc:"Minimum distance to the next shield symbol, not necessarily the same shield."},spacing:{css:"shield-spacing",type:"float","default-value":0,doc:"The spacing between repeated occurrences of the same shield on a line"},"minimum-padding":{css:"shield-min-padding","default-value":0,doc:"Determines the minimum amount of padding that a shield gets relative to other shields",type:"float"},"wrap-width":{css:"shield-wrap-width",type:"unsigned","default-value":0,doc:"Length of a chunk of text in characters before wrapping text"},"wrap-before":{css:"shield-wrap-before",type:"boolean","default-value":!1,doc:"Wrap text before wrap-width is reached. If false, wrapped lines will be a bit longer than wrap-width."},"wrap-character":{css:"shield-wrap-character",type:"string","default-value":" ",doc:"Use this character instead of a space to wrap long names."},"halo-fill":{css:"shield-halo-fill",type:"color","default-value":"#FFFFFF","default-meaning":"white",doc:"Specifies the color of the halo around the text."},"halo-radius":{css:"shield-halo-radius",doc:"Specify the radius of the halo in pixels","default-value":0,"default-meaning":"no halo",type:"float"},"character-spacing":{css:"shield-character-spacing",type:"unsigned","default-value":0,doc:"Horizontal spacing between characters (in pixels). Currently works for point placement only, not line placement."},"line-spacing":{css:"shield-line-spacing",doc:"Vertical spacing between lines of multiline labels (in pixels)",type:"unsigned"},dx:{css:"shield-text-dx",type:"float",doc:"Displace text within shield by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right","default-value":0},dy:{css:"shield-text-dy",type:"float",doc:"Displace text within shield by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down","default-value":0},"shield-dx":{css:"shield-dx",type:"float",doc:"Displace shield by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right","default-value":0},"shield-dy":{css:"shield-dy",type:"float",doc:"Displace shield by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down","default-value":0},opacity:{css:"shield-opacity",type:"float",doc:"(Default 1.0) - opacity of the image used for the shield","default-value":1},"text-opacity":{css:"shield-text-opacity",type:"float",doc:"(Default 1.0) - opacity of the text placed on top of the shield","default-value":1},"horizontal-alignment":{css:"shield-horizontal-alignment",type:["left","middle","right","auto"],doc:"The shield's horizontal alignment from its centerpoint","default-value":"auto"},"vertical-alignment":{css:"shield-vertical-alignment",type:["top","middle","bottom","auto"],doc:"The shield's vertical alignment from its centerpoint","default-value":"middle"},"text-transform":{css:"shield-text-transform",type:["none","uppercase","lowercase","capitalize"],doc:"Transform the case of the characters","default-value":"none"},"justify-alignment":{css:"shield-justify-alignment",type:["left","center","right","auto"],doc:"Define how text in a shield's label is justified","default-value":"auto"},clip:{css:"shield-clip",type:"boolean","default-value":!0,"default-meaning":"geometry will be clipped to map bounds before rendering",doc:"geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."},"comp-op":{css:"shield-comp-op","default-value":"src-over","default-meaning":"add the current symbolizer on top of other symbolizer",doc:"Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",type:["clear","src","dst","src-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]}},"line-pattern":{file:{css:"line-pattern-file",type:"uri","default-value":"none",required:!0,doc:"An image file to be repeated and warped along a line"},clip:{css:"line-pattern-clip",type:"boolean","default-value":!0,"default-meaning":"geometry will be clipped to map bounds before rendering",doc:"geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."},smooth:{css:"line-pattern-smooth",type:"float","default-value":0,"default-meaning":"no smoothing",range:"0-1",doc:"Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."},"geometry-transform":{css:"line-pattern-geometry-transform",type:"functions","default-value":"none","default-meaning":"geometry will not be transformed",doc:"Allows transformation functions to be applied to the geometry.",functions:[["matrix",6],["translate",2],["scale",2],["rotate",3],["skewX",1],["skewY",1]]},"comp-op":{css:"line-pattern-comp-op","default-value":"src-over","default-meaning":"add the current symbolizer on top of other symbolizer",doc:"Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",type:["clear","src","dst","src-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]}},"polygon-pattern":{file:{css:"polygon-pattern-file",type:"uri","default-value":"none",required:!0,doc:"Image to use as a repeated pattern fill within a polygon"},alignment:{css:"polygon-pattern-alignment",type:["local","global"],"default-value":"local",doc:"Specify whether to align pattern fills to the layer or to the map."},gamma:{css:"polygon-pattern-gamma",type:"float","default-value":1,"default-meaning":"fully antialiased",range:"0-1",doc:"Level of antialiasing of polygon pattern edges"},opacity:{css:"polygon-pattern-opacity",type:"float",doc:"(Default 1.0) - Apply an opacity level to the image used for the pattern","default-value":1,"default-meaning":"The image is rendered without modifications"},clip:{css:"polygon-pattern-clip",type:"boolean","default-value":!0,"default-meaning":"geometry will be clipped to map bounds before rendering",doc:"geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."},smooth:{css:"polygon-pattern-smooth",type:"float","default-value":0,"default-meaning":"no smoothing",range:"0-1",doc:"Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."},"geometry-transform":{css:"polygon-pattern-geometry-transform",type:"functions","default-value":"none","default-meaning":"geometry will not be transformed",doc:"Allows transformation functions to be applied to the geometry.",functions:[["matrix",6],["translate",2],["scale",2],["rotate",3],["skewX",1],["skewY",1]]},"comp-op":{css:"polygon-pattern-comp-op","default-value":"src-over","default-meaning":"add the current symbolizer on top of other symbolizer",doc:"Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",type:["clear","src","dst","src-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]}},raster:{opacity:{css:"raster-opacity","default-value":1,"default-meaning":"opaque",type:"float",doc:"The opacity of the raster symbolizer on top of other symbolizers."},"filter-factor":{css:"raster-filter-factor","default-value":-1,"default-meaning":"Allow the datasource to choose appropriate downscaling.",type:"float",doc:"This is used by the Raster or Gdal datasources to pre-downscale images using overviews. Higher numbers can sometimes cause much better scaled image output, at the cost of speed."},scaling:{css:"raster-scaling",type:["near","fast","bilinear","bilinear8","bicubic","spline16","spline36","hanning","hamming","hermite","kaiser","quadric","catrom","gaussian","bessel","mitchell","sinc","lanczos","blackman"],"default-value":"near",doc:"The scaling algorithm used to making different resolution versions of this raster layer. Bilinear is a good compromise between speed and accuracy, while lanczos gives the highest quality."},"mesh-size":{css:"raster-mesh-size","default-value":16,"default-meaning":"Reprojection mesh will be 1/16 of the resolution of the source image",type:"unsigned",doc:"A reduced resolution mesh is used for raster reprojection, and the total image size is divided by the mesh-size to determine the quality of that mesh. Values for mesh-size larger than the default will result in faster reprojection but might lead to distortion."},"comp-op":{css:"raster-comp-op","default-value":"src-over","default-meaning":"add the current symbolizer on top of other symbolizer",doc:"Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",type:["clear","src","dst","src-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]}},point:{file:{css:"point-file",type:"uri",required:!1,"default-value":"none",doc:"Image file to represent a point"},"allow-overlap":{css:"point-allow-overlap",type:"boolean","default-value":!1,doc:"Control whether overlapping points are shown or hidden.","default-meaning":"Do not allow points to overlap with each other - overlapping markers will not be shown."},"ignore-placement":{css:"point-ignore-placement",type:"boolean","default-value":!1,"default-meaning":"do not store the bbox of this geometry in the collision detector cache",doc:"value to control whether the placement of the feature will prevent the placement of other features"},opacity:{css:"point-opacity",type:"float","default-value":1,"default-meaning":"Fully opaque",doc:"A value from 0 to 1 to control the opacity of the point"},placement:{css:"point-placement",type:["centroid","interior"],doc:"How this point should be placed. Centroid calculates the geometric center of a polygon, which can be outside of it, while interior always places inside of a polygon.","default-value":"centroid"},transform:{css:"point-transform",type:"functions",functions:[["matrix",6],["translate",2],["scale",2],["rotate",3],["skewX",1],["skewY",1]],"default-value":"","default-meaning":"No transformation",doc:"SVG transformation definition"},"comp-op":{css:"point-comp-op","default-value":"src-over","default-meaning":"add the current symbolizer on top of other symbolizer",doc:"Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",type:["clear","src","dst","src-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]}},text:{name:{css:"text-name",type:"string",expression:!0,required:!0,"default-value":"",serialization:"content",doc:"Value to use for a text label. Data columns are specified using brackets like [column_name]"},"face-name":{css:"text-face-name",type:"string",validate:"font",doc:"Font name and style to render a label in",required:!0},size:{css:"text-size",type:"float","default-value":10,doc:"Text size in pixels"},"text-ratio":{css:"text-ratio",doc:"Define the amount of text (of the total) present on successive lines when wrapping occurs","default-value":0,type:"unsigned"},"wrap-width":{css:"text-wrap-width",doc:"Length of a chunk of text in characters before wrapping text","default-value":0,type:"unsigned"},"wrap-before":{css:"text-wrap-before",type:"boolean","default-value":!1,doc:"Wrap text before wrap-width is reached. If false, wrapped lines will be a bit longer than wrap-width."},"wrap-character":{css:"text-wrap-character",type:"string","default-value":" ",doc:"Use this character instead of a space to wrap long text."},spacing:{css:"text-spacing",type:"unsigned",doc:"Distance between repeated text labels on a line (aka. label-spacing)"},"character-spacing":{css:"text-character-spacing",type:"float","default-value":0,doc:"Horizontal spacing adjustment between characters in pixels"},"line-spacing":{css:"text-line-spacing","default-value":0,type:"unsigned",doc:"Vertical spacing adjustment between lines in pixels"},"label-position-tolerance":{css:"text-label-position-tolerance","default-value":0,type:"unsigned",doc:"Allows the label to be displaced from its ideal position by a number of pixels (only works with placement:line)"},"max-char-angle-delta":{css:"text-max-char-angle-delta",type:"float","default-value":"22.5",doc:"The maximum angle change, in degrees, allowed between adjacent characters in a label. This value internally is converted to radians to the default is 22.5*math.pi/180.0. The higher the value the fewer labels will be placed around around sharp corners."},fill:{css:"text-fill",doc:"Specifies the color for the text","default-value":"#000000",type:"color"},opacity:{css:"text-opacity",doc:"A number from 0 to 1 specifying the opacity for the text","default-value":1,"default-meaning":"Fully opaque",type:"float"},"halo-fill":{css:"text-halo-fill",type:"color","default-value":"#FFFFFF","default-meaning":"white",doc:"Specifies the color of the halo around the text."},"halo-radius":{css:"text-halo-radius",doc:"Specify the radius of the halo in pixels","default-value":0,"default-meaning":"no halo",type:"float"},dx:{css:"text-dx",type:"float",doc:"Displace text by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right","default-value":0},dy:{css:"text-dy",type:"float",doc:"Displace text by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down","default-value":0},"vertical-alignment":{css:"text-vertical-alignment",type:["top","middle","bottom","auto"],doc:"Position of label relative to point position.","default-value":"auto","default-meaning":'Default affected by value of dy; "bottom" for dy>0, "top" for dy<0.'},"avoid-edges":{css:"text-avoid-edges",doc:"Tell positioning algorithm to avoid labeling near intersection edges.","default-value":!1,type:"boolean"},"minimum-distance":{css:"text-min-distance",doc:"Minimum permitted distance to the next text symbolizer.",type:"float"},"minimum-padding":{css:"text-min-padding",doc:"Determines the minimum amount of padding that a text symbolizer gets relative to other text",type:"float"},"minimum-path-length":{css:"text-min-path-length",type:"float","default-value":0,"default-meaning":"place labels on all paths",doc:"Place labels only on paths longer than this value."},"allow-overlap":{css:"text-allow-overlap",type:"boolean","default-value":!1,doc:"Control whether overlapping text is shown or hidden.","default-meaning":"Do not allow text to overlap with other text - overlapping markers will not be shown."},orientation:{css:"text-orientation",type:"float",expression:!0,doc:"Rotate the text."},placement:{css:"text-placement",type:["point","line","vertex","interior"],"default-value":"point",doc:"Control the style of placement of a point versus the geometry it is attached to."},"placement-type":{css:"text-placement-type",doc:'Re-position and/or re-size text to avoid overlaps. "simple" for basic algorithm (using text-placements string,) "dummy" to turn this feature off.',type:["dummy","simple"],"default-value":"dummy"},placements:{css:"text-placements",type:"string","default-value":"",doc:'If "placement-type" is set to "simple", use this "POSITIONS,[SIZES]" string. An example is `text-placements: "E,NE,SE,W,NW,SW";` '},"text-transform":{css:"text-transform",type:["none","uppercase","lowercase","capitalize"],doc:"Transform the case of the characters","default-value":"none"},"horizontal-alignment":{css:"text-horizontal-alignment",type:["left","middle","right","auto"],doc:"The text's horizontal alignment from its centerpoint","default-value":"auto"},"justify-alignment":{css:"text-align",type:["left","right","center","auto"],doc:"Define how text is justified","default-value":"auto","default-meaning":"Auto alignment means that text will be centered by default except when using the `placement-type` parameter - in that case either right or left justification will be used automatically depending on where the text could be fit given the `text-placements` directives"},clip:{css:"text-clip"
,type:"boolean","default-value":!0,"default-meaning":"geometry will be clipped to map bounds before rendering",doc:"geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."},"comp-op":{css:"text-comp-op","default-value":"src-over","default-meaning":"add the current symbolizer on top of other symbolizer",doc:"Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",type:["clear","src","dst","src-over","dst-over","src-in","dst-in","src-out","dst-out","src-atop","dst-atop","xor","plus","minus","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","contrast","invert","invert-rgb","grain-merge","grain-extract","hue","saturation","color","value"]}},building:{fill:{css:"building-fill","default-value":"#FFFFFF",doc:"The color of the buildings walls.",type:"color"},"fill-opacity":{css:"building-fill-opacity",type:"float",doc:"The opacity of the building as a whole, including all walls.","default-value":1},height:{css:"building-height",doc:"The height of the building in pixels.",type:"float",expression:!0,"default-value":"0"}},torque:{"-torque-clear-color":{css:"-torque-clear-color",type:"color","default-value":"rgba(255, 255, 255, 0)","default-meaning":"full clear",doc:"color used to clear canvas on each frame"},"-torque-frame-count":{css:"-torque-frame-count","default-value":"128",type:"float","default-meaning":"the data is broken into 128 time frames",doc:"Number of animation steps/frames used in the animation. If the data contains a fewere number of total frames, the lesser value will be used."},"-torque-resolution":{css:"-torque-resolution","default-value":"2",type:"float","default-meaning":"",doc:"Spatial resolution in pixels. A resolution of 1 means no spatial aggregation of the data. Any other resolution of N results in spatial aggregation into cells of NxN pixels. The value N must be power of 2"},"-torque-animation-duration":{css:"-torque-animation-duration","default-value":"30",type:"float","default-meaning":"the animation lasts 30 seconds",doc:"Animation duration in seconds"},"-torque-aggregation-function":{css:"-torque-aggregation-function","default-value":"count(cartodb_id)",type:"string","default-meaning":"the value for each cell is the count of points in that cell",doc:"A function used to calculate a value from the aggregate data for each cell. See -torque-resolution"},"-torque-time-attribute":{css:"-torque-time-attribute","default-value":"time",type:"string","default-meaning":"the data column in your table that is of a time based type",doc:"The table column that contains the time information used create the animation"},"-torque-data-aggregation":{css:"-torque-data-aggregation","default-value":"linear",type:["linear","cumulative"],"default-meaning":"previous values are discarded",doc:"A linear animation will discard previous values while a cumulative animation will accumulate them until it restarts"}}},colors:{aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],grey:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50],transparent:[0,0,0,0]},filter:{value:["true","false","null","point","linestring","polygon","collection"]}};t.exports={version:{latest:r,"2.1.1":r}}},{}],7:[function(e,t,n){typeof t!="undefined"&&(t.exports.find=function(e,t){for(var n=0,r;n<e.length;n++)if(r=t.call(e,e[n]))return r;return null})},{}],8:[function(e,t,n){(function(t){(function(n){var r=t._||e("underscore");n.Call=function(t,n,r){this.name=t,this.args=n,this.index=r},n.Call.prototype={is:"call",ev:function(e){var t=this.args.map(function(t){return t.ev(e)});for(var i=0;i<t.length;i++)if(t[i].is==="undefined")return{is:"undefined",value:"undefined"};if(this.name in n.functions){if(n.functions[this.name].length<=t.length){var s=n.functions[this.name].apply(n.functions,t);return s===null?(e.error({message:"incorrect arguments given to "+this.name+"()",index:this.index,type:"runtime",filename:this.filename}),{is:"undefined",value:"undefined"}):s}return e.error({message:"incorrect number of arguments for "+this.name+"(). "+n.functions[this.name].length+" expected.",index:this.index,type:"runtime",filename:this.filename}),{is:"undefined",value:"undefined"}}var o=n.Reference.mapnikFunctions[this.name];if(o===undefined){var u=r.pairs(n.Reference.mapnikFunctions),a=this.name,f=u.map(function(e){return[e[0],n.Reference.editDistance(a,e[0]),e[1]]}).sort(function(e,t){return e[1]-t[1]});return e.error({message:"unknown function "+this.name+"(), did you mean "+f[0][0]+"("+f[0][2]+")",index:this.index,type:"runtime",filename:this.filename}),{is:"undefined",value:"undefined"}}return o!==t.length&&(!Array.isArray(o)||!r.include(o,t.length))&&o!==-1?(e.error({message:"function "+this.name+"() takes "+o+" arguments and was given "+t.length,index:this.index,type:"runtime",filename:this.filename}),{is:"undefined",value:"undefined"}):(this.args=t,this)},toString:function(e,t){return this.args.length?this.name+"("+this.args.join(",")+")":this.name}}})(e("../tree"))}).call(this,typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"../tree":7,underscore:undefined}],9:[function(e,t,n){(function(e){e.Color=function(t,n){Array.isArray(t)?this.rgb=t.slice(0,3):t.length==6?this.rgb=t.match(/.{2}/g).map(function(e){return parseInt(e,16)}):this.rgb=t.split("").map(function(e){return parseInt(e+e,16)}),typeof n=="number"?this.alpha=n:t.length===4?this.alpha=t[3]:this.alpha=1},e.Color.prototype={is:"color",ev:function(){return this},toString:function(){return this.alpha<1?"rgba("+this.rgb.map(function(e){return Math.round(e)}).concat(this.alpha).join(", ")+")":"#"+this.rgb.map(function(e){return e=Math.round(e),e=(e>255?255:e<0?0:e).toString(16),e.length===1?"0"+e:e}).join("")},operate:function(t,n,r){var i=[];r instanceof e.Color||(r=r.toColor());for(var s=0;s<3;s++)i[s]=e.operate(n,this.rgb[s],r.rgb[s]);return new e.Color(i)},toHSL:function(){var e=this.rgb[0]/255,t=this.rgb[1]/255,n=this.rgb[2]/255,r=this.alpha,i=Math.max(e,t,n),s=Math.min(e,t,n),o,u,a=(i+s)/2,f=i-s;if(i===s)o=u=0;else{u=a>.5?f/(2-i-s):f/(i+s);switch(i){case e:o=(t-n)/f+(t<n?6:0);break;case t:o=(n-e)/f+2;break;case n:o=(e-t)/f+4}o/=6}return{h:o*360,s:u,l:a,a:r}}}})(e("../tree"))},{"../tree":7}],10:[function(e,t,n){(function(e){e.Comment=function(t,n){this.value=t,this.silent=!!n},e.Comment.prototype={toString:function(e){return"<!--"+this.value+"-->"},ev:function(){return this}}})(e("../tree"))},{"../tree":7}],11:[function(e,t,n){(function(t){(function(n){function s(e){function t(e){return e[1].toUpperCase()}return e.charAt(0).toUpperCase()+e.slice(1).replace(/\-./,t)+"Symbolizer"}function o(e){return e.sort(function(e,t){return e[1]-t[1]}).map(function(e){return e[0]})}var r=e("assert"),i=t._||e("underscore");n.Definition=function(t,i){this.elements=t.elements,r.ok(t.filters instanceof n.Filterset),this.rules=i,this.ruleIndex={};for(var s=0;s<this.rules.length;s++)"zoom"in this.rules[s]&&(this.rules[s]=this.rules[s].clone()),this.rules[s].zoom=t.zoom,this.ruleIndex[this.rules[s].updateID()]=!0;this.filters=t.filters,this.zoom=t.zoom,this.frame_offset=t.frame_offset,this.attachment=t.attachment||"__default__",this.specificity=t.specificity()},n.Definition.prototype.toString=function(){var e=this.filters.toString();for(var t=0;t<this.rules.length;t++)e+="\n    "+this.rules[t];return e},n.Definition.prototype.clone=function(e){e&&r.ok(e instanceof n.Filterset);var t=Object.create(n.Definition.prototype);return t.rules=this.rules.slice(),t.ruleIndex=i.clone(this.ruleIndex),t.filters=e?e:this.filters.clone(),t.attachment=this.attachment,t},n.Definition.prototype.addRules=function(e){var t=0;for(var n=0;n<e.length;n++)this.ruleIndex[e[n].id]||(this.rules.push(e[n]),this.ruleIndex[e[n].id]=!0,t++);return t},n.Definition.prototype.appliesTo=function(e,t){for(var n=0,r=this.elements.length;n<r;n++){var i=this.elements[n];if(!(i.wildcard||i.type==="class"&&t[i.clean]||i.type==="id"&&e===i.clean))return!1}return!0},n.Definition.prototype.symbolizersToXML=function(e,t,r){var i=r.toXML(e).join("")+this.filters.toXML(e),u=[],a=[];for(var f in t){a=[];for(var l in t[f])a.push(t[f][l].index);var c=Math.min.apply(Math,a);u.push([f,c])}u=o(u);var h=0;for(var p=0;p<u.length;p++){var d=t[u[p]],v=u[p].split("/").pop();if(v==="*")continue;h++;var m=n.Reference.requiredProperties(v,d);if(m){var g=d[Object.keys(d).shift()];e.error({message:m,index:g.index,filename:g.filename})}var y=s(v),b=!0,w;i+="    <"+y+" ";for(var E in d){v==="map"&&e.error({message:"Map properties are not permitted in other rules",index:d[E].index,filename:d[E].filename});var S=n.Reference.selector(d[E].name);S&&S.serialization&&S.serialization==="content"?(b=!1,w=d[E].ev(e).toXML(e,!0)):S&&S.serialization&&S.serialization==="tag"?(b=!1,w=d[E].ev(e).toXML(e,!0)):i+=d[E].ev(e).toXML(e)+" "}b?i+="/>\n":typeof w!="undefined"&&(w.indexOf("<")!=-1?i+=">"+w+"</"+y+">\n":i+="><![CDATA["+w+"]]></"+y+">\n")}return!h||!i?"":"  <Rule>\n"+i+"  </Rule>\n"},n.Definition.prototype.collectSymbolizers=function(e,t){var n={},r;for(var i=t;i<this.rules.length;i++){r=this.rules[i];var s=r.instance+"/"+r.symbolizer;e.current&r.zoom&&(!(s in n)||!(r.name in n[s]))&&(e.current&=r.zoom,s in n||(n[s]={}),n[s][r.name]=r)}if(Object.keys(n).length)return e.rule&=e.available&=~e.current,n},n.Definition.prototype.toXML=function(e,t){var r=this.filters.toString();r in t||(t[r]=n.Zoom.all);var i=n.Zoom.all,s="",o,u,a={available:n.Zoom.all};for(var f=0;f<this.rules.length&&i;f++){a.rule=this.rules[f].zoom;if(!(t[r]&a.rule))continue;while(a.current=a.rule&i)if(u=this.collectSymbolizers(a,f)){if(!(t[r]&a.current))continue;s+=this.symbolizersToXML(e,u,(new n.Zoom).setZoom(t[r]&a.current)),t[r]&=~a.current}}return s},n.Definition.prototype.toJS=function(e){var t={},r="("+this.zoom+" & (1 << ctx.zoom))",s=this.frame_offset,o=this.filters.toJS(e),u=[r];return o&&u.push(o),s&&u.push('ctx["frame-offset"] === '+s),o=u.join(" && "),i.each(this.rules,function(r){if(!(r instanceof n.Rule))throw new Error("Ruleset not supported");t[r.name]=t[r.name]||[];var i={index:r.index,symbolizer:r.symbolizer};o?i.js="if("+o+"){"+r.value.toJS(e)+"}":i.js=r.value.toJS(e),i.constant=r.value.ev(e).is!=="field",i.filtered=!!o,t[r.name].push(i)}),t}})(e("../tree"))}).call(this,typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"../tree":7,assert:37,underscore:undefined}],12:[function(e,t,n){(function(t){(function(n){var r=t._||e("underscore");n.Dimension=function(t,n,r){this.value=parseFloat(t),this.unit=n||null,this.index=r},n.Dimension.prototype={is:"float",physical_units:["m","cm","in","mm","pt","pc"],screen_units:["px","%"],all_units:["m","cm","in","mm","pt","pc","px","%"],densities:{m:.0254,mm:25.4,cm:2.54,pt:72,pc:6},ev:function(e){if(this.unit&&!r.contains(this.all_units,this.unit))return e.error({message:"Invalid unit: '"+this.unit+"'",index:this.index}),{is:"undefined",value:"undefined"};if(this.unit&&r.contains(this.physical_units,this.unit)){if(!e.ppi)return e.error({message:"ppi is not set, so metric units can't be used",index:this.index}),{is:"undefined",value:"undefined"};this.value=this.value/this.densities[this.unit]*e.ppi,this.unit="px"}return this},round:function(){return this.value=Math.round(this.value),this},toColor:function(){return new n.Color([this.value,this.value,this.value])},round:function(){return this.value=Math.round(this.value),this},toString:function(){return this.value.toString()},operate:function(e,t,r){return this.unit==="%"&&r.unit!=="%"?(e.error({message:"If two operands differ, the first must not be %",index:this.index}),{is:"undefined",value:"undefined"}):this.unit!=="%"&&r.unit==="%"?t==="*"||t==="/"||t==="%"?(e.error({message:"Percent values can only be added or subtracted from other values",index:this.index}),{is:"undefined",value:"undefined"}):new n.Dimension(n.operate(t,this.value,this.value*r.value*.01),this.unit):new n.Dimension(n.operate(t,this.value,r.value),this.unit||r.unit)}}})(e("../tree"))}).call(this,typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"../tree":7,underscore:undefined}],13:[function(e,t,n){(function(e){e.Element=function(t){this.value=t.trim(),this.value[0]==="#"&&(this.type="id",this.clean=this.value.replace(/^#/,"")),this.value[0]==="."&&(this.type="class",this.clean=this.value.replace(/^\./,"")),this.value.indexOf("*")!==-1&&(this.type="wildcard")},e.Element.prototype.specificity=function(){return[this.type==="id"?1:0,this.type==="class"?1:0]},e.Element.prototype.toString=function(){return this.value}})(e("../tree"))},{"../tree":7}],14:[function(e,t,n){(function(e){e.Expression=function(t){this.value=t},e.Expression.prototype={is:"expression",ev:function(t){return this.value.length>1?new e.Expression(this.value.map(function(e){return e.ev(t)})):this.value[0].ev(t)},toString:function(e){return this.value.map(function(t){return t.toString(e)}).join(" ")}}})(e("../tree"))},{"../tree":7}],15:[function(e,t,n){(function(e){e.Field=function(t){this.value=t||""},e.Field.prototype={is:"field",toString:function(){return"["+this.value+"]"},ev:function(){return this}}})(e("../tree"))},{"../tree":7}],16:[function(e,t,n){(function(e){e.Filter=function(t,n,r,i,s){this.key=t,this.op=n,this.val=r,this.index=i,this.filename=s,this.id=this.key+this.op+this.val};var t={"<":[" &lt; ","numeric"],">":[" &gt; ","numeric"],"=":[" = ","both"],"!=":[" != ","both"],"<=":[" &lt;= ","numeric"],">=":[" &gt;= ","numeric"],"=~":[".match(","string",")"]};e.Filter.prototype.ev=function(e){return this.key=this.key.ev(e),this.val=this.val.ev(e),this},e.Filter.prototype.toXML=function(n){e.Reference.data.filter&&(this.key.is==="keyword"&&-1===e.Reference.data.filter.value.indexOf(this.key.toString())&&n.error({message:this.key.toString()+" is not a valid keyword in a filter expression",index:this.index,filename:this.filename}),this.val.is==="keyword"&&-1===e.Reference.data.filter.value.indexOf(this.val.toString())&&n.error({message:this.val.toString()+" is not a valid keyword in a filter expression",index:this.index,filename:this.filename}));var r=this.key.toString(!1),i=this.val.toString(this.val.is=="string");return(t[this.op][1]=="numeric"&&isNaN(i)&&this.val.is!=="field"||t[this.op][1]=="string"&&i[0]!="'")&&n.error({message:'Cannot use operator "'+this.op+'" with value '+this.val,index:this.index,filename:this.filename}),r+t[this.op][0]+i+(t[this.op][2]||"")},e.Filter.prototype.toString=function(){return"["+this.id+"]"}})(e("../tree"))},{"../tree":7}],17:[function(e,t,n){(function(t){var n=e("../tree"),r=t._||e("underscore");n.Filterset=function(){this.filters={}},n.Filterset.prototype.toXML=function(e){var t=[];for(var n in this.filters)t.push("("+this.filters[n].toXML(e).trim()+")");return t.length?"    <Filter>"+t.join(" and ")+"</Filter>\n":""},n.Filterset.prototype.toString=function(){var e=[];for(var t in this.filters)e.push(this.filters[t].id);return e.sort().join("	")},n.Filterset.prototype.ev=function(e){for(var t in this.filters)this.filters[t].ev(e);return this},n.Filterset.prototype.clone=function(){var e=new n.Filterset;for(var t in this.filters)e.filters[t]=this.filters[t];return e},n.Filterset.prototype.cloneWith=function(e){var t=[];for(var r in e.filters){var i=this.addable(e.filters[r]);if(i===!1)return!1;i===!0&&t.push(e.filters[r])}if(!t.length)return null;var s=new n.Filterset;for(r in this.filters)s.filters[r]=this.filters[r];while(r=t.shift())s.add(r);return s},n.Filterset.prototype.toJS=function(e){var t={"=":"==="};return r.map(this.filters,function(e){var n=e.op;n in t&&(n=t[n]);var r=e.val;e._val!==undefined&&(r=e._val.toString(!0));var i="data";return i+"."+e.key.value+" "+n+" "+(r.is==="string"?"'"+r+"'":r)}).join(" && ")},n.Filterset.prototype.addable=function(e){var t=e.key.toString(),n=e.val.toString();n.match(/^[0-9]+(\.[0-9]*)?$/)&&(n=parseFloat(n));switch(e.op){case"=":if(this.filters[t+"="]!==undefined)return this.filters[t+"="].val.toString()!=n?!1:null;if(this.filters[t+"!="+n]!==undefined)return!1;if(this.filters[t+">"]!==undefined&&this.filters[t+">"].val>=n)return!1;if(this.filters[t+"<"]!==undefined&&this.filters[t+"<"].val<=n)return!1;if(this.filters[t+">="]!==undefined&&this.filters[t+">="].val>n)return!1;if(this.filters[t+"<="]!==undefined&&this.filters[t+"<="].val<n)return!1;return!0;case"=~":return!0;case"!=":if(this.filters[t+"="]!==undefined)return this.filters[t+"="].val==n?!1:null;if(this.filters[t+"!="+n]!==undefined)return null;if(this.filters[t+">"]!==undefined&&this.filters[t+">"].val>=n)return null;if(this.filters[t+"<"]!==undefined&&this.filters[t+"<"].val<=n)return null;if(this.filters[t+">="]!==undefined&&this.filters[t+">="].val>n)return null;if(this.filters[t+"<="]!==undefined&&this.filters[t+"<="].val<n)return null;return!0;case">":if(t+"="in this.filters)return this.filters[t+"="].val<=n?!1:null;if(this.filters[t+"<"]!==undefined&&this.filters[t+"<"].val<=n)return!1;if(this.filters[t+"<="]!==undefined&&this.filters[t+"<="].val<=n)return!1;if(this.filters[t+">"]!==undefined&&this.filters[t+">"].val>=n)return null;if(this.filters[t+">="]!==undefined&&this.filters[t+">="].val>n)return null;return!0;case">=":if(this.filters[t+"="]!==undefined)return this.filters[t+"="].val<n?!1:null;if(this.filters[t+"<"]!==undefined&&this.filters[t+"<"].val<=n)return!1;if(this.filters[t+"<="]!==undefined&&this.filters[t+"<="].val<n)return!1;if(this.filters[t+">"]!==undefined&&this.filters[t+">"].val>=n)return null;if(this.filters[t+">="]!==undefined&&this.filters[t+">="].val>=n)return null;return!0;case"<":if(this.filters[t+"="]!==undefined)return this.filters[t+"="].val>=n?!1:null;if(this.filters[t+">"]!==undefined&&this.filters[t+">"].val>=n)return!1;if(this.filters[t+">="]!==undefined&&this.filters[t+">="].val>=n)return!1;if(this.filters[t+"<"]!==undefined&&this.filters[t+"<"].val<=n)return null;if(this.filters[t+"<="]!==undefined&&this.filters[t+"<="].val<n)return null;return!0;case"<=":if(this.filters[t+"="]!==undefined)return this.filters[t+"="].val>n?!1:null;if(this.filters[t+">"]!==undefined&&this.filters[t+">"].val>=n)return!1;if(this.filters[t+">="]!==undefined&&this.filters[t+">="].val>n)return!1;if(this.filters[t+"<"]!==undefined&&this.filters[t+"<"].val<=n)return null;if(this.filters[t+"<="]!==undefined&&this.filters[t+"<="].val<=n)return null;return!0}},n.Filterset.prototype.conflict=function(e){var t=e.key.toString(),n=e.val.toString();return isNaN(parseFloat(n))||(n=parseFloat(n)),e.op==="="&&this.filters[t+"="]!==undefined&&n!=this.filters[t+"="].val.toString()||e.op==="!="&&this.filters[t+"="]!==undefined&&n==this.filters[t+"="].val.toString()||e.op==="="&&this.filters[t+"!="]!==undefined&&n==this.filters[t+"!="].val.toString()?e.toString()+" added to "+this.toString()+" produces an invalid filter":!1},n.Filterset.prototype.add=function(e,t){var n=e.key.toString(),r,i=e.op,s=this.conflict(e),o;if(s)return s;if(i==="="){for(var u in this.filters)this.filters[u].key==n&&delete this.filters[u];this.filters[n+"="]=e}else if(i==="!=")this.filters[n+"!="+e.val]=e;else if(i==="=~")this.filters[n+"=~"+e.val]=e;else if(i===">"){for(var a in this.filters)this.filters[a].key==n&&this.filters[a].val<=e.val&&delete this.filters[a];this.filters[n+">"]=e}else if(i===">="){for(var f in this.filters)o=+this.filters[f].val.toString(),this.filters[f].key==n&&o<e.val&&delete this.filters[f];this.filters[n+"!="+e.val]!==undefined?(delete this.filters[n+"!="+e.val],e.op=">",this.filters[n+">"]=e):this.filters[n+">="]=e}else if(i==="<"){for(var l in this.filters)o=+this.filters[l].val.toString(),this.filters[l].key==n&&o>=e.val&&delete this.filters[l];this.filters[n+"<"]=e}else if(i==="<="){for(var c in this.filters)o=+this.filters[c].val.toString(),this.filters[c].key==n&&o>e.val&&delete this.filters[c];this.filters[n+"!="+e.val]!==undefined?(delete this.filters[n+"!="+e.val],e.op="<",this.filters[n+"<"]=e):this.filters[n+"<="]=e}}}).call(this,typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"../tree":7,underscore:undefined}],18:[function(e,t,n){(function(e){e._getFontSet=function(t,n){var r=n.join("");if(t._fontMap&&t._fontMap[r])return t._fontMap[r];var i=new e.FontSet(t,n);return t.effects.push(i),t._fontMap||(t._fontMap={}),t._fontMap[r]=i,i},e.FontSet=function(t,n){this.fonts=n,this.name="fontset-"+t.effects.length},e.FontSet.prototype.toXML=function(e){return'<FontSet name="'+this.name+'">\n'+this.fonts.map(function(e){return'  <Font face-name="'+e+'"/>'}).join("\n")+"\n</FontSet>"}})(e("../tree"))},{"../tree":7}],19:[function(e,t,n){var r=e("../tree");r.FrameOffset=function(e,t,n){t=parseInt(t,10);if(t>r.FrameOffset.max||t<=0)throw{message:"Only frame-offset levels between 1 and "+r.FrameOffset.max+" supported.",index:n};if(e!=="=")throw{message:"only = operator is supported for frame-offset",index:n};return t},r.FrameOffset.max=32,r.FrameOffset.none=0},{"../tree":7}],20:[function(e,t,n){(function(e){e.ImageFilter=function(t,n){this.filter=t,this.args=n||null},e.ImageFilter.prototype={is:"imagefilter",ev:function(){return this},toString:function(){return this.args?this.filter+"("+this.args.join(",")+")":this.filter}}})(e("../tree"))},{"../tree":7}],21:[function(e,t,n){(function(e){e.Invalid=function(t,n,r){this.chunk=t,this.index=n,this.type="syntax",this.message=r||"Invalid code: "+this.chunk},e.Invalid.prototype.is="invalid",e.Invalid.prototype.ev=function(e){return e.error({chunk:this.chunk,index:this.index,type:"syntax",message:this.message||"Invalid code: "+this.chunk}),{is:"undefined"}}})(e("../tree"))},{"../tree":7}],22:[function(e,t,n){(function(e){e.Keyword=function(t){this.value=t;var n={transparent:"color","true":"boolean","false":"boolean"};this.is=n[t]?n[t]:"keyword"},e.Keyword.prototype={ev:function(){return this},toString:function(){return this.value}}})(e("../tree"))},{"../tree":7}],23:[function(e,t,n){(function(e){e.LayerXML=function(t,n){var r=[];for(var i in t.Datasource)r.push('<Parameter name="'+i+'"><![CDATA['+t.Datasource[i]+"]]></Parameter>");var s="";for(var o in t.properties)o==="minzoom"?s+='  maxzoom="'+e.Zoom.ranges[t.properties[o]]+'"\n':o==="maxzoom"?s+='  minzoom="'+e.Zoom.ranges[t.properties[o]+1]+'"\n':s+="  "+o+'="'+t.properties[o]+'"\n';return'<Layer name="'+t.name+'"\n'+s+(typeof t.status=="undefined"?"":'  status="'+t.status+'"\n')+(typeof t.srs=="undefined"?"":'  srs="'+t.srs+'"')+">\n    "+n.reverse().map(function(e){return"<StyleName>"+e+"</StyleName>"}).join("\n    ")+(r.length?"\n    <Datasource>\n       "+r.join("\n       ")+"\n    </Datasource>\n":"")+"  </Layer>\n"}})(e("../tree"))},{"../tree":7}],24:[function(e,t,n){(function(e){e.Literal=function(t){this.value=t||"",this.is="field"},e.Literal.prototype={toString:function(){return this.value},ev:function(){return this}}})(e("../tree"))},{"../tree":7}],25:[function(e,t,n){(function(e){e.Operation=function(t,n,r){this.op=t.trim(),this.operands=n,this.index=r},e.Operation.prototype.is="operation",e.Operation.prototype.ev=function(t){var n=this.operands[0].ev(t),r=this.operands[1].ev(t),i;return n.is==="undefined"||r.is==="undefined"?{is:"undefined",value:"undefined"}:(n instanceof e.Dimension&&r instanceof e.Color&&(this.op==="*"||this.op==="+"?(i=r,r=n,n=i):t.error({name:"OperationError",message:"Can't substract or divide a color from a number",index:this.index})),n instanceof e.Quoted&&r instanceof e.Quoted&&this.op!=="+"?(t.error({message:"Can't subtract, divide, or multiply strings.",index:this.index,type:"runtime",filename:this.filename}),{is:"undefined",value:"undefined"}):n instanceof e.Field||r instanceof e.Field||n instanceof e.Literal||r instanceof e.Literal?n.is==="color"||r.is==="color"?(t.error({message:"Can't subtract, divide, or multiply colors in expressions.",index:this.index,type:"runtime",filename:this.filename}),{is:"undefined",value:"undefined"}):new e.Literal(n.ev(t).toString(!0)+this.op+r.ev(t).toString(!0)):n.operate===undefined?(t.error({message:"Cannot do math with type "+n.is+".",index:this.index,type:"runtime",filename:this.filename}),{is:"undefined",value:"undefined"}):n.operate(t,this.op,r))},e.operate=function(e,t,n){switch(e){case"+":return t+n;case"-":return t-n;case"*":return t*n;case"%":return t%n;case"/":return t/n}}})(e("../tree"))},{"../tree":7}],26:[function(e,t,n){(function(e){e.Quoted=function(t){this.value=t||""},e.Quoted.prototype={is:"string",toString:function(e){var t=this.value.replace(/&/g,"&amp;"),n=t.replace(/\'/g,"\\'").replace(/\"/g,"&quot;").replace(/</g,"&lt;").replace(/\>/g,"&gt;");return e===!0?"'"+n+"'":t},ev:function(){return this},operate:function(t,n,r){return new e.Quoted(e.operate(n,this.toString(),r.toString(this.contains_field)))}}})(e("../tree"))},{"../tree":7}],27:[function(e,t,n){(function(t){(function(n){function s(e){var t={};for(var n in e.symbolizers)for(var r in e.symbolizers[n])e.symbolizers[n][r].hasOwnProperty("css")&&(t[e.symbolizers[n][r].css]=[e.symbolizers[n][r],n,r]);return t}function o(e){var t={};for(var n in e.symbolizers)for(var r in e.symbolizers[n])if(e.symbolizers[n][r].type==="functions")for(var i=0;i<e.symbolizers[n][r].functions.length;i++){var s=e.symbolizers[n][r].functions[i];t[s[0]]=s[1]}return t}function u(e){var t={};for(var n in e.symbolizers){t[n]=[];for(var r in e.symbolizers[n])e.symbolizers[n][r].required&&t[n].push(e.symbolizers[n][r].css)}return t}function a(e,t){if(e.value[0].is==="string")return!0;for(var n in e.value)for(var s in e.value[n].value){if(e.value[n].value[s].is!=="call")return!1;var o=r.find(i.selector(t).functions,function(t){return t[0]==e.value[n].value[s].name});if(!o||o[1]!=-1)if(!o||o[1]!==e.value[n].value[s].args.length)return!1}return!0}function f(e,t){return typeof i.selector(t).type=="object"?i.selector(t).type.indexOf(e.value[0].value)!==-1:i.selector(t).type==="string"}var r=t._||e("underscore"),i={};i.setData=function(e){i.data=e,i.selector_cache=s(e),i.mapnikFunctions=o(e),i.mapnikFunctions.matrix=[6],i.mapnikFunctions.translate=[1,2],i.mapnikFunctions.scale=[1,2],i.mapnikFunctions.rotate=[1,3],i.mapnikFunctions.skewX=[1],i.mapnikFunctions.skewY=[1],i.required_cache=u(e)},i.setVersion=function(t){var n=e("mapnik-reference");return n.version.hasOwnProperty(t)?(i.setData(n.version[t]),!0):!1},i.selectorData=function(e,t){if(i.selector_cache[e])return i.selector_cache[e][t]},i.validSelector=function(e){return!!i.selector_cache[e]},i.selectorName=function(e){return i.selectorData(e,2)},i.selector=function(e){return i.selectorData(e,0)},i.symbolizer=function(e){return i.selectorData(e,1)},i.requiredProperties=function(e,t){var n=i.required_cache[e];for(var r in n)if(!(n[r]in t))return"Property "+n[r]+" required for defining "+e+" styles."},i._validateValue={font:function(e,t){return e.validation_data&&e.validation_data.fonts?e.validation_data.fonts.indexOf(t)!=-1:!0}},i.isFont=function(e){return i.selector(e).validate=="font"},i.editDistance=function(e,t){if(e.length===0)return t.length;if(t.length===0)return e.length;var n=[];for(var r=0;r<=t.length;r++)n[r]=[r];for(var i=0;i<=e.length;i++)n[0][i]=i;for(r=1;r<=t.length;r++)for(i=1;i<=e.length;i++)t.charAt(r-1)==e.charAt(i-1)?n[r][i]=n[r-1][i-1]:n[r][i]=Math.min(n[r-1][i-1]+1,Math.min(n[r][i-1]+1,n[r-1][i]+1));return n[t.length][e.length]},i.validValue=function(e,t,n){var r,s;if(!i.selector(t))return!1;if(n.value[0].is=="keyword")return f(n,t);if(n.value[0].is=="undefined")return!0;if(i.selector(t).type=="numbers"){for(r in n.value)if(n.value[r].is!=="float")return!1;return!0}if(i.selector(t).type=="tags"){if(!n.value)return!1;if(!n.value[0].value)return n.value[0].is==="tag";for(r=0;r<n.value[0].value.length;r++)if(n.value[0].value[r].is!=="tag")return!1;return!0}if(i.selector(t).type=="functions")return a(n,t);if(i.selector(t).type==="unsigned")return n.value[0].is==="float"?(n.value[0].round(),!0):!1;if(i.selector(t).expression)return!0;if(i.selector(t).validate){var o=!1;for(r=0;r<n.value.length;r++)if(i.selector(t).type==n.value[r].is&&i._validateValue[i.selector(t).validate](e,n.value[r].value))return!0;return o}return i.selector(t).type==n.value[0].is},n.Reference=i})(e("../tree"))}).call(this,typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"../tree":7,"mapnik-reference":43,underscore:undefined}],28:[function(e,t,n){(function(e){function t(t){return Object.keys(e.Reference.selector_cache).map(function(n){return[n,e.Reference.editDistance(t,n)]}).sort(function(e,t){return e[1]-t[1]})}e.Rule=function(n,r,i,s){var o=n.split("/");this.name=o.pop(),this.instance=o.length?o[0]:"__default__",this.value=r instanceof e.Value?r:new e.Value([r]),this.index=i,this.symbolizer=e.Reference.symbolizer(this.name),this.filename=s,this.variable=n.charAt(0)==="@"},e.Rule.prototype.is="rule",e.Rule.prototype.clone=function(){var t=Object.create(e.Rule.prototype);return t.name=this.name,t.value=this.value,t.index=this.index,t.instance=this.instance,t.symbolizer=this.symbolizer,t.filename=this.filename,t.variable=this.variable,t},e.Rule.prototype.updateID=function(){return this.id=this.zoom+"#"+this.instance+"#"+this.name},e.Rule.prototype.toString=function(){return"["+e.Zoom.toString(this.zoom)+"] "+this.name+": "+this.value},e.Rule.prototype
.toXML=function(n,r,i,s){if(!e.Reference.validSelector(this.name)){var o=t(this.name),u="";return o[0][1]<3&&(u=". Did you mean "+o[0][0]+"?"),n.error({message:"Unrecognized rule: "+this.name+u,index:this.index,type:"syntax",filename:this.filename})}if(this.value instanceof e.Value&&!e.Reference.validValue(n,this.name,this.value)){if(!e.Reference.selector(this.name))return n.error({message:"Unrecognized property: "+this.name,index:this.index,type:"syntax",filename:this.filename});var a;return e.Reference.selector(this.name).validate?a=e.Reference.selector(this.name).validate:typeof e.Reference.selector(this.name).type=="object"?a="keyword (options: "+e.Reference.selector(this.name).type.join(", ")+")":a=e.Reference.selector(this.name).type,n.error({message:"Invalid value for "+this.name+", the type "+a+" is expected. "+this.value+" (of type "+this.value.value[0].is+") "+" was given.",index:this.index,type:"syntax",filename:this.filename})}if(this.variable)return"";if(e.Reference.isFont(this.name)&&this.value.value.length>1){var f=e._getFontSet(n,this.value.value);return'fontset-name="'+f.name+'"'}return r?this.value.toString(n,this.name,i):e.Reference.selectorName(this.name)+'="'+this.value.toString(n,this.name)+'"'},e.Rule.prototype.ev=function(t){return new e.Rule(this.name,this.value.ev(t),this.index,this.filename)}})(e("../tree"))},{"../tree":7}],29:[function(e,t,n){(function(e){e.Ruleset=function(t,n){this.selectors=t,this.rules=n,this._lookups={}},e.Ruleset.prototype={is:"ruleset",ev:function(t){var n,r=new e.Ruleset(this.selectors,this.rules.slice(0));r.root=this.root,t.frames.unshift(r);for(n=0,rule;n<r.rules.length;n++)rule=r.rules[n],r.rules[n]=rule.ev?rule.ev(t):rule;return t.frames.shift(),r},match:function(e){return!e||e.length===0},variables:function(){return this._variables?this._variables:this._variables=this.rules.reduce(function(t,n){return n instanceof e.Rule&&n.variable===!0&&(t[n.name]=n),t},{})},variable:function(e){return this.variables()[e]},rulesets:function(){return this._rulesets?this._rulesets:this._rulesets=this.rules.filter(function(t){return t instanceof e.Ruleset})},find:function(t,n){n=n||this;var r=[],i,s,o=t.toString();return o in this._lookups?this._lookups[o]:(this.rulesets().forEach(function(i){if(i!==n)for(var o=0;o<i.selectors.length;o++){s=t.match(i.selectors[o]);if(s){t.elements.length>1?Array.prototype.push.apply(r,i.find(new e.Selector(null,null,null,t.elements.slice(1)),n)):r.push(i);break}}}),this._lookups[o]=r)},evZooms:function(t){for(var n=0;n<this.selectors.length;n++){var r=e.Zoom.all;for(var i=0;i<this.selectors[n].zoom.length;i++)r&=this.selectors[n].zoom[i].ev(t).zoom;this.selectors[n].zoom=r}},flatten:function(t,n,r){var i=[],s,o;this.selectors.length===0&&(r.frames=r.frames.concat(this.rules)),this.evZooms(r);for(s=0;s<this.selectors.length;s++){var u=this.selectors[s];if(!u.filters)continue;if(n.length)for(o=0;o<n.length;o++){var a=n[o],f=a.filters.cloneWith(u.filters);if(f===null){if(a.zoom===(a.zoom&u.zoom)&&a.frame_offset===u.frame_offset&&a.attachment===u.attachment&&a.elements.join()===u.elements.join()){i.push(a);continue}f=a.filters}else if(!f)continue;var l=Object.create(e.Selector.prototype);l.filters=f,l.zoom=a.zoom&u.zoom,l.frame_offset=u.frame_offset,l.elements=a.elements.concat(u.elements),a.attachment&&u.attachment?l.attachment=a.attachment+"/"+u.attachment:l.attachment=u.attachment||a.attachment,l.conditions=a.conditions+u.conditions,l.index=u.index,i.push(l)}else i.push(u)}var c=[];for(s=0;s<this.rules.length;s++){var h=this.rules[s];h instanceof e.Ruleset?h.flatten(t,i,r):h instanceof e.Rule?c.push(h):h instanceof e.Invalid&&r.error(h)}var p=c.length?c[0].index:!1;for(s=0;s<i.length;s++)p!==!1&&(i[s].index=p),t.push(new e.Definition(i[s],c.slice()));return t}}})(e("../tree"))},{"../tree":7}],30:[function(e,t,n){(function(e){e.Selector=function(n,r,i,s,o,u,a){this.elements=s||[],this.attachment=o,this.filters=n||{},this.frame_offset=i,this.zoom=typeof r!="undefined"?r:e.Zoom.all,this.conditions=u,this.index=a},e.Selector.prototype.specificity=function(){return this.elements.reduce(function(e,t){var n=t.specificity();return e[0]+=n[0],e[1]+=n[1],e},[0,0,this.conditions,this.index])}})(e("../tree"))},{"../tree":7}],31:[function(e,t,n){(function(t){(function(n){var r=t._||e("underscore");n.StyleXML=function(e,t,n,i){var s={},o=[],u=[],a=[],f=[],l=[];for(var c=0;c<n.length;c++)for(var h=0;h<n[c].rules.length;h++)n[c].rules[h].name==="image-filters"&&o.push(n[c].rules[h]),n[c].rules[h].name==="image-filters-inflate"&&u.push(n[c].rules[h]),n[c].rules[h].name==="direct-image-filters"&&a.push(n[c].rules[h]),n[c].rules[h].name==="comp-op"&&f.push(n[c].rules[h]),n[c].rules[h].name==="opacity"&&l.push(n[c].rules[h]);var p=n.map(function(e){return e.toXML(i,s)}),d="";o.length&&(d+=' image-filters="'+r.chain(o).uniq(function(e){return e.id}).map(function(e){return e.ev(i).toXML(i,!0,",","image-filter")}).value().join(",")+'"'),u.length&&(d+=' image-filters-inflate="'+u[0].value.ev(i).toString()+'"'),a.length&&(d+=' direct-image-filters="'+r.chain(a).uniq(function(e){return e.id}).map(function(e){return e.ev(i).toXML(i,!0,",","direct-image-filter")}).value().join(",")+'"'),f.length&&f[0].value.ev(i).value!="src-over"&&(d+=' comp-op="'+f[0].value.ev(i).toString()+'"'),l.length&&l[0].value.ev(i).value!=1&&(d+=' opacity="'+l[0].value.ev(i).toString()+'"');var v=p.join("");return!d&&!v?"":'<Style name="'+e+'" filter-mode="first"'+d+">\n"+v+"</Style>"}})(e("../tree"))}).call(this,typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"../tree":7,underscore:undefined}],32:[function(e,t,n){(function(e){e.URL=function(t,n){this.value=t,this.paths=n},e.URL.prototype={is:"uri",toString:function(){return this.value.toString()},ev:function(t){return new e.URL(this.value.ev(t),this.paths)}}})(e("../tree"))},{"../tree":7}],33:[function(e,t,n){(function(e){e.Value=function(t){this.value=t},e.Value.prototype={is:"value",ev:function(t){return this.value.length===1?this.value[0].ev(t):new e.Value(this.value.map(function(e){return e.ev(t)}))},toString:function(e,t,n,r){return this.value.map(function(t){return t.toString(e,r)}).join(n||", ")},clone:function(){var t=Object.create(e.Value.prototype);return Array.isArray(t)?t.value=this.value.slice():t.value=this.value,t.is=this.is,t},toJS:function(e){var t=this.ev(e),n=t.toString();return t.is==="color"||t.is==="uri"||t.is==="string"||t.is==="keyword"?n="'"+n+"'":t.is==="field"?n=n.replace(/\[(.*)\]/g,"data['$1']"):t.is==="call"&&(n=JSON.stringify({name:t.name,args:t.args})),"_value = "+n+";"}}})(e("../tree"))},{"../tree":7}],34:[function(e,t,n){(function(e){e.Variable=function(t,n,r){this.name=t,this.index=n,this.filename=r},e.Variable.prototype={is:"variable",toString:function(){return this.name},ev:function(e){var t,n,r=this.name;if(this._css)return this._css;var i=e.frames.filter(function(e){return e.name==this.name}.bind(this));return i.length?i[0].value.ev(e):(e.error({message:"variable "+this.name+" is undefined",index:this.index,type:"runtime",filename:this.filename}),{is:"undefined",value:"undefined"})}}})(e("../tree"))},{"../tree":7}],35:[function(e,t,n){var r=e("../tree");r.Zoom=function(e,t,n){this.op=e,this.value=t,this.index=n},r.Zoom.prototype.setZoom=function(e){return this.zoom=e,this},r.Zoom.prototype.ev=function(e){var t=0,n=Infinity,i=parseInt(this.value.ev(e).toString(),10),s=0;(i>r.Zoom.maxZoom||i<0)&&e.error({message:"Only zoom levels between 0 and "+r.Zoom.maxZoom+" supported.",index:this.index});switch(this.op){case"=":return this.zoom=1<<i,this;case">":t=i+1;break;case">=":t=i;break;case"<":n=i-1;break;case"<=":n=i}for(var o=0;o<=r.Zoom.maxZoom;o++)o>=t&&o<=n&&(s|=1<<o);return this.zoom=s,this},r.Zoom.prototype.toString=function(){return this.zoom},r.Zoom.all=8388607,r.Zoom.maxZoom=22,r.Zoom.ranges={0:1e9,1:5e8,2:2e8,3:1e8,4:5e7,5:25e6,6:125e5,7:65e5,8:3e6,9:15e5,10:75e4,11:4e5,12:2e5,13:1e5,14:5e4,15:25e3,16:12500,17:5e3,18:2500,19:1500,20:750,21:500,22:250,23:100},r.Zoom.prototype.toXML=function(){var e=[];if(this.zoom!=r.Zoom.all){var t=null,n=null;for(var i=0;i<=r.Zoom.maxZoom;i++)this.zoom&1<<i&&(t===null&&(t=i),n=i);t>0&&e.push("    <MaxScaleDenominator>"+r.Zoom.ranges[t]+"</MaxScaleDenominator>\n"),n<22&&e.push("    <MinScaleDenominator>"+r.Zoom.ranges[n+1]+"</MinScaleDenominator>\n")}return e},r.Zoom.prototype.toString=function(){var e="";for(var t=0;t<=r.Zoom.maxZoom;t++)e+=this.zoom&1<<t?"X":".";return e}},{"../tree":7}],36:[function(e,t,n){},{}],37:[function(e,t,n){function u(e,t){return r.isUndefined(t)?""+t:r.isNumber(t)&&(isNaN(t)||!isFinite(t))?t.toString():r.isFunction(t)||r.isRegExp(t)?t.toString():t}function a(e,t){return r.isString(e)?e.length<t?e:e.slice(0,t):e}function f(e){return a(JSON.stringify(e.actual,u),128)+" "+e.operator+" "+a(JSON.stringify(e.expected,u),128)}function l(e,t,n,r,i){throw new o.AssertionError({message:n,actual:e,expected:t,operator:r,stackStartFunction:i})}function c(e,t){e||l(e,!0,t,"==",o.ok)}function h(e,t){if(e===t)return!0;if(r.isBuffer(e)&&r.isBuffer(t)){if(e.length!=t.length)return!1;for(var n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}return r.isDate(e)&&r.isDate(t)?e.getTime()===t.getTime():r.isRegExp(e)&&r.isRegExp(t)?e.source===t.source&&e.global===t.global&&e.multiline===t.multiline&&e.lastIndex===t.lastIndex&&e.ignoreCase===t.ignoreCase:!r.isObject(e)&&!r.isObject(t)?e==t:d(e,t)}function p(e){return Object.prototype.toString.call(e)=="[object Arguments]"}function d(e,t){if(r.isNullOrUndefined(e)||r.isNullOrUndefined(t))return!1;if(e.prototype!==t.prototype)return!1;if(p(e))return p(t)?(e=i.call(e),t=i.call(t),h(e,t)):!1;try{var n=g(e),s=g(t),o,u}catch(a){return!1}if(n.length!=s.length)return!1;n.sort(),s.sort();for(u=n.length-1;u>=0;u--)if(n[u]!=s[u])return!1;for(u=n.length-1;u>=0;u--){o=n[u];if(!h(e[o],t[o]))return!1}return!0}function v(e,t){return!e||!t?!1:Object.prototype.toString.call(t)=="[object RegExp]"?t.test(e):e instanceof t?!0:t.call({},e)===!0?!0:!1}function m(e,t,n,i){var s;r.isString(n)&&(i=n,n=null);try{t()}catch(o){s=o}i=(n&&n.name?" ("+n.name+").":".")+(i?" "+i:"."),e&&!s&&l(s,n,"Missing expected exception"+i),!e&&v(s,n)&&l(s,n,"Got unwanted exception"+i);if(e&&s&&n&&!v(s,n)||!e&&s)throw s}var r=e("util/"),i=Array.prototype.slice,s=Object.prototype.hasOwnProperty,o=t.exports=c;o.AssertionError=function(t){this.name="AssertionError",this.actual=t.actual,this.expected=t.expected,this.operator=t.operator,t.message?(this.message=t.message,this.generatedMessage=!1):(this.message=f(this),this.generatedMessage=!0);var n=t.stackStartFunction||l;if(Error.captureStackTrace)Error.captureStackTrace(this,n);else{var r=new Error;if(r.stack){var i=r.stack,s=n.name,o=i.indexOf("\n"+s);if(o>=0){var u=i.indexOf("\n",o+1);i=i.substring(u+1)}this.stack=i}}},r.inherits(o.AssertionError,Error),o.fail=l,o.ok=c,o.equal=function(t,n,r){t!=n&&l(t,n,r,"==",o.equal)},o.notEqual=function(t,n,r){t==n&&l(t,n,r,"!=",o.notEqual)},o.deepEqual=function(t,n,r){h(t,n)||l(t,n,r,"deepEqual",o.deepEqual)},o.notDeepEqual=function(t,n,r){h(t,n)&&l(t,n,r,"notDeepEqual",o.notDeepEqual)},o.strictEqual=function(t,n,r){t!==n&&l(t,n,r,"===",o.strictEqual)},o.notStrictEqual=function(t,n,r){t===n&&l(t,n,r,"!==",o.notStrictEqual)},o.throws=function(e,t,n){m.apply(this,[!0].concat(i.call(arguments)))},o.doesNotThrow=function(e,t){m.apply(this,[!1].concat(i.call(arguments)))},o.ifError=function(e){if(e)throw e};var g=Object.keys||function(e){var t=[];for(var n in e)s.call(e,n)&&t.push(n);return t}},{"util/":42}],38:[function(e,t,n){typeof Object.create=="function"?t.exports=function(t,n){t.super_=n,t.prototype=Object.create(n.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}})}:t.exports=function(t,n){t.super_=n;var r=function(){};r.prototype=n.prototype,t.prototype=new r,t.prototype.constructor=t}},{}],39:[function(e,t,n){(function(e){function t(e,t){var n=0;for(var r=e.length-1;r>=0;r--){var i=e[r];i==="."?e.splice(r,1):i===".."?(e.splice(r,1),n++):n&&(e.splice(r,1),n--)}if(t)for(;n--;n)e.unshift("..");return e}function s(e,t){if(e.filter)return e.filter(t);var n=[];for(var r=0;r<e.length;r++)t(e[r],r,e)&&n.push(e[r]);return n}var r=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/,i=function(e){return r.exec(e).slice(1)};n.resolve=function(){var n="",r=!1;for(var i=arguments.length-1;i>=-1&&!r;i--){var o=i>=0?arguments[i]:e.cwd();if(typeof o!="string")throw new TypeError("Arguments to path.resolve must be strings");if(!o)continue;n=o+"/"+n,r=o.charAt(0)==="/"}return n=t(s(n.split("/"),function(e){return!!e}),!r).join("/"),(r?"/":"")+n||"."},n.normalize=function(e){var r=n.isAbsolute(e),i=o(e,-1)==="/";return e=t(s(e.split("/"),function(e){return!!e}),!r).join("/"),!e&&!r&&(e="."),e&&i&&(e+="/"),(r?"/":"")+e},n.isAbsolute=function(e){return e.charAt(0)==="/"},n.join=function(){var e=Array.prototype.slice.call(arguments,0);return n.normalize(s(e,function(e,t){if(typeof e!="string")throw new TypeError("Arguments to path.join must be strings");return e}).join("/"))},n.relative=function(e,t){function r(e){var t=0;for(;t<e.length;t++)if(e[t]!=="")break;var n=e.length-1;for(;n>=0;n--)if(e[n]!=="")break;return t>n?[]:e.slice(t,n-t+1)}e=n.resolve(e).substr(1),t=n.resolve(t).substr(1);var i=r(e.split("/")),s=r(t.split("/")),o=Math.min(i.length,s.length),u=o;for(var a=0;a<o;a++)if(i[a]!==s[a]){u=a;break}var f=[];for(var a=u;a<i.length;a++)f.push("..");return f=f.concat(s.slice(u)),f.join("/")},n.sep="/",n.delimiter=":",n.dirname=function(e){var t=i(e),n=t[0],r=t[1];return!n&&!r?".":(r&&(r=r.substr(0,r.length-1)),n+r)},n.basename=function(e,t){var n=i(e)[2];return t&&n.substr(-1*t.length)===t&&(n=n.substr(0,n.length-t.length)),n},n.extname=function(e){return i(e)[3]};var o="ab".substr(-1)==="b"?function(e,t,n){return e.substr(t,n)}:function(e,t,n){return t<0&&(t=e.length+t),e.substr(t,n)}}).call(this,e("_process"))},{_process:40}],40:[function(e,t,n){function i(){}var r=t.exports={};r.nextTick=function(){var e=typeof window!="undefined"&&window.setImmediate,t=typeof window!="undefined"&&window.MutationObserver,n=typeof window!="undefined"&&window.postMessage&&window.addEventListener;if(e)return function(e){return window.setImmediate(e)};var r=[];if(t){var i=document.createElement("div"),s=new MutationObserver(function(){var e=r.slice();r.length=0,e.forEach(function(e){e()})});return s.observe(i,{attributes:!0}),function(t){r.length||i.setAttribute("yes","no"),r.push(t)}}return n?(window.addEventListener("message",function(e){var t=e.source;if((t===window||t===null)&&e.data==="process-tick"){e.stopPropagation();if(r.length>0){var n=r.shift();n()}}},!0),function(t){r.push(t),window.postMessage("process-tick","*")}):function(t){setTimeout(t,0)}}(),r.title="browser",r.browser=!0,r.env={},r.argv=[],r.on=i,r.addListener=i,r.once=i,r.off=i,r.removeListener=i,r.removeAllListeners=i,r.emit=i,r.binding=function(e){throw new Error("process.binding is not supported")},r.cwd=function(){return"/"},r.chdir=function(e){throw new Error("process.chdir is not supported")}},{}],41:[function(e,t,n){t.exports=function(t){return t&&typeof t=="object"&&typeof t.copy=="function"&&typeof t.fill=="function"&&typeof t.readUInt8=="function"}},{}],42:[function(e,t,n){(function(t,r){function u(e,t){var r={seen:[],stylize:f};return arguments.length>=3&&(r.depth=arguments[2]),arguments.length>=4&&(r.colors=arguments[3]),y(t)?r.showHidden=t:t&&n._extend(r,t),T(r.showHidden)&&(r.showHidden=!1),T(r.depth)&&(r.depth=2),T(r.colors)&&(r.colors=!1),T(r.customInspect)&&(r.customInspect=!0),r.colors&&(r.stylize=a),c(r,e,r.depth)}function a(e,t){var n=u.styles[t];return n?"["+u.colors[n][0]+"m"+e+"["+u.colors[n][1]+"m":e}function f(e,t){return e}function l(e){var t={};return e.forEach(function(e,n){t[e]=!0}),t}function c(e,t,r){if(e.customInspect&&t&&A(t.inspect)&&t.inspect!==n.inspect&&(!t.constructor||t.constructor.prototype!==t)){var i=t.inspect(r,e);return S(i)||(i=c(e,i,r)),i}var s=h(e,t);if(s)return s;var o=Object.keys(t),u=l(o);e.showHidden&&(o=Object.getOwnPropertyNames(t));if(L(t)&&(o.indexOf("message")>=0||o.indexOf("description")>=0))return p(t);if(o.length===0){if(A(t)){var a=t.name?": "+t.name:"";return e.stylize("[Function"+a+"]","special")}if(N(t))return e.stylize(RegExp.prototype.toString.call(t),"regexp");if(k(t))return e.stylize(Date.prototype.toString.call(t),"date");if(L(t))return p(t)}var f="",y=!1,b=["{","}"];g(t)&&(y=!0,b=["[","]"]);if(A(t)){var w=t.name?": "+t.name:"";f=" [Function"+w+"]"}N(t)&&(f=" "+RegExp.prototype.toString.call(t)),k(t)&&(f=" "+Date.prototype.toUTCString.call(t)),L(t)&&(f=" "+p(t));if(o.length!==0||!!y&&t.length!=0){if(r<0)return N(t)?e.stylize(RegExp.prototype.toString.call(t),"regexp"):e.stylize("[Object]","special");e.seen.push(t);var E;return y?E=d(e,t,r,u,o):E=o.map(function(n){return v(e,t,r,u,n,y)}),e.seen.pop(),m(E,f,b)}return b[0]+f+b[1]}function h(e,t){if(T(t))return e.stylize("undefined","undefined");if(S(t)){var n="'"+JSON.stringify(t).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'";return e.stylize(n,"string")}if(E(t))return e.stylize(""+t,"number");if(y(t))return e.stylize(""+t,"boolean");if(b(t))return e.stylize("null","null")}function p(e){return"["+Error.prototype.toString.call(e)+"]"}function d(e,t,n,r,i){var s=[];for(var o=0,u=t.length;o<u;++o)H(t,String(o))?s.push(v(e,t,n,r,String(o),!0)):s.push("");return i.forEach(function(i){i.match(/^\d+$/)||s.push(v(e,t,n,r,i,!0))}),s}function v(e,t,n,r,i,s){var o,u,a;a=Object.getOwnPropertyDescriptor(t,i)||{value:t[i]},a.get?a.set?u=e.stylize("[Getter/Setter]","special"):u=e.stylize("[Getter]","special"):a.set&&(u=e.stylize("[Setter]","special")),H(r,i)||(o="["+i+"]"),u||(e.seen.indexOf(a.value)<0?(b(n)?u=c(e,a.value,null):u=c(e,a.value,n-1),u.indexOf("\n")>-1&&(s?u=u.split("\n").map(function(e){return"  "+e}).join("\n").substr(2):u="\n"+u.split("\n").map(function(e){return"   "+e}).join("\n"))):u=e.stylize("[Circular]","special"));if(T(o)){if(s&&i.match(/^\d+$/))return u;o=JSON.stringify(""+i),o.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(o=o.substr(1,o.length-2),o=e.stylize(o,"name")):(o=o.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),o=e.stylize(o,"string"))}return o+": "+u}function m(e,t,n){var r=0,i=e.reduce(function(e,t){return r++,t.indexOf("\n")>=0&&r++,e+t.replace(/\u001b\[\d\d?m/g,"").length+1},0);return i>60?n[0]+(t===""?"":t+"\n ")+" "+e.join(",\n  ")+" "+n[1]:n[0]+t+" "+e.join(", ")+" "+n[1]}function g(e){return Array.isArray(e)}function y(e){return typeof e=="boolean"}function b(e){return e===null}function w(e){return e==null}function E(e){return typeof e=="number"}function S(e){return typeof e=="string"}function x(e){return typeof e=="symbol"}function T(e){return e===void 0}function N(e){return C(e)&&M(e)==="[object RegExp]"}function C(e){return typeof e=="object"&&e!==null}function k(e){return C(e)&&M(e)==="[object Date]"}function L(e){return C(e)&&(M(e)==="[object Error]"||e instanceof Error)}function A(e){return typeof e=="function"}function O(e){return e===null||typeof e=="boolean"||typeof e=="number"||typeof e=="string"||typeof e=="symbol"||typeof e=="undefined"}function M(e){return Object.prototype.toString.call(e)}function _(e){return e<10?"0"+e.toString(10):e.toString(10)}function P(){var e=new Date,t=[_(e.getHours()),_(e.getMinutes()),_(e.getSeconds())].join(":");return[e.getDate(),D[e.getMonth()],t].join(" ")}function H(e,t){return Object.prototype.hasOwnProperty.call(e,t)}var i=/%[sdj%]/g;n.format=function(e){if(!S(e)){var t=[];for(var n=0;n<arguments.length;n++)t.push(u(arguments[n]));return t.join(" ")}var n=1,r=arguments,s=r.length,o=String(e).replace(i,function(e){if(e==="%%")return"%";if(n>=s)return e;switch(e){case"%s":return String(r[n++]);case"%d":return Number(r[n++]);case"%j":try{return JSON.stringify(r[n++])}catch(t){return"[Circular]"};default:return e}});for(var a=r[n];n<s;a=r[++n])b(a)||!C(a)?o+=" "+a:o+=" "+u(a);return o},n.deprecate=function(e,i){function o(){if(!s){if(t.throwDeprecation)throw new Error(i);t.traceDeprecation?console.trace(i):console.error(i),s=!0}return e.apply(this,arguments)}if(T(r.process))return function(){return n.deprecate(e,i).apply(this,arguments)};if(t.noDeprecation===!0)return e;var s=!1;return o};var s={},o;n.debuglog=function(e){T(o)&&(o=t.env.NODE_DEBUG||""),e=e.toUpperCase();if(!s[e])if((new RegExp("\\b"+e+"\\b","i")).test(o)){var r=t.pid;s[e]=function(){var t=n.format.apply(n,arguments);console.error("%s %d: %s",e,r,t)}}else s[e]=function(){};return s[e]},n.inspect=u,u.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]},u.styles={special:"cyan",number:"yellow","boolean":"yellow","undefined":"grey","null":"bold",string:"green",date:"magenta",regexp:"red"},n.isArray=g,n.isBoolean=y,n.isNull=b,n.isNullOrUndefined=w,n.isNumber=E,n.isString=S,n.isSymbol=x,n.isUndefined=T,n.isRegExp=N,n.isObject=C,n.isDate=k,n.isError=L,n.isFunction=A,n.isPrimitive=O,n.isBuffer=e("./support/isBuffer");var D=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];n.log=function(){console.log("%s - %s",P(),n.format.apply(n,arguments))},n.inherits=e("inherits"),n._extend=function(e,t){if(!t||!C(t))return e;var n=Object.keys(t),r=n.length;while(r--)e[n[r]]=t[n[r]];return e}}).call(this,e("_process"),typeof global!="undefined"?global:typeof self!="undefined"?self:typeof window!="undefined"?window:{})},{"./support/isBuffer":41,_process:40,inherits:38}],43:[function(e,t,n){(function(n){var r=e("fs"),i=e("path"),s=e("fs").existsSync||e("path").existsSync;t.exports.version={};var o=["2.0.0","2.0.1","2.0.2","2.1.0","2.1.1","2.2.0","2.3.0","3.0.0"];o.map(function(r){t.exports.version[r]=e(i.join(n,r,"reference.json"));var o=i.join(n,r,"datasources.json");s(o)&&(t.exports.version[r].datasources=e(o).datasources)})}).call(this,"/node_modules/mapnik-reference")},{fs:36,path:39}],44:[function(e,t,n){t.exports={name:"carto",version:"0.15.1",description:"CartoCSS Stylesheet Compiler",url:"https://github.com/cartodb/carto",repository:{type:"git",url:"http://github.com/cartodb/carto.git"},author:{name:"CartoDB",url:"http://cartodb.com/"},keywords:["maps","css","stylesheets"],contributors:["Tom MacWright <macwright@gmail.com>","Konstantin Käfer","Alexis Sellier <self@cloudhead.net>","Raul Ochoa <rochoa@cartodb.com>","Javi Santana <jsantana@cartodb.com>"],licenses:[{type:"Apache"}],bin:{carto:"./bin/carto"},man:"./man/carto.1",main:"./lib/carto/index",engines:{node:">=0.4.x"},dependencies:{underscore:"~1.6.0","mapnik-reference":"~6.0.2",optimist:"~0.6.0"},devDependencies:{mocha:"1.12.x",jshint:"0.2.x",sax:"0.1.x",istanbul:"~0.2.14",coveralls:"~2.10.1",browserify:"~7.0.0","uglify-js":"1.3.3"},scripts:{pretest:"npm install",test:"mocha -R spec",coverage:"istanbul cover ./node_modules/.bin/_mocha && coveralls < ./coverage/lcov.info"}}},{}]},{},[2])(2)});/**
Torque 2.11.4
Temporal mapping for CartoDB
https://github.com/cartodb/torque
**/


!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.torque=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var torque = require('./');

var requestAnimationFrame = global.requestAnimationFrame
    || global.mozRequestAnimationFrame
    || global.webkitRequestAnimationFrame
    || global.msRequestAnimationFrame
    || function(callback) { return global.setTimeout(callback, 1000 / 60); };

var cancelAnimationFrame = global.cancelAnimationFrame
    || global.mozCancelAnimationFrame
    || global.webkitCancelAnimationFrame
    || global.msCancelAnimationFrame
    || function(id) { clearTimeout(id); };

  /**
   * options:
   *    animationDuration in seconds
   *    animationDelay in seconds
   */
  function Animator(callback, options) {
    if(!options.steps) {
      throw new Error("steps option missing")
    }
    this.options = options;
    this.running = false;
    this._tick = this._tick.bind(this);
    this._t0 = +new Date();
    this.callback = callback;
    this._time = 0.0;
    this.itemsReady = false;

    this.options = torque.extend({
        animationDelay: 0,
        maxDelta: 0.2,
        loop: options.loop === undefined ? true : options.loop
    }, this.options);

    this.rescale();

  }


  Animator.prototype = {

    start: function() {
        this.running = true;
        requestAnimationFrame(this._tick);
        this.options.onStart && this.options.onStart();
        if(this.options.steps === 1){
          this.running = false;
        }
    },

    isRunning: function() {
      return this.running;
    },

    stop: function() {
      this.pause();
      this.time(0);
      this.options.onStop && this.options.onStop();
    },

    // real animation time
    time: function(_) {
      if (!arguments.length) return this._time;
      this._time = _;
      var t = this.range(this.domain(this._time));
      this.callback(t);
    },

    toggle: function() {
      if (this.running) {
        this.pause()
      } else {
        this.start()
      }
    },

    rescale: function() {
      this.domainInv = torque.math.linear(this.options.animationDelay, this.options.animationDelay + this.options.animationDuration);
      this.domain = this.domainInv.invert();
      this.range = torque.math.linear(0, this.options.steps);
      this.rangeInv = this.range.invert();
      this.time(this._time);
      this.running? this.start(): this.pause();
      return this;
    },

    duration: function(_) {
      if (!arguments.length)  return this.options.animationDuration;
      this.options.animationDuration = _;
      if (this.time() > _) {
        this.time(0);
      }
      this.rescale();
      return this;
    },

    steps: function(_) {
      this.options.steps = _;
      return this.rescale();
    },

    step: function(s) {
      if(arguments.length === 0) return this.range(this.domain(this._time));
      this._time = this.domainInv(this.rangeInv(s));
    },

    pause: function() {
      this.running = false;
      cancelAnimationFrame(this._tick);
      this.options.onPause && this.options.onPause();
    },

    _tick: function() {
      var t1 = +new Date();
      var delta = (t1 - this._t0)*0.001;
      // if delta is really big means the tab lost the focus
      // at some point, so limit delta change
      delta = Math.min(this.options.maxDelta, delta);
      this._t0 = t1;
      this._time += delta;
      if(this.step() >= this.options.steps) {
        if(!this.options.loop){
          // set time to max time
          this.time(this.options.animationDuration);
          this.pause();
        } else {
          this._time = 0;
        }
      }
      if(this.running) {
        this.time(this._time);
        requestAnimationFrame(this._tick);
      }
    }

  };

module.exports = Animator;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./":10}],2:[function(require,module,exports){
var _torque_reference_latest = {
    "version": "1.0.0",
    "style": {
        "comp-op": {
            "css": "comp-op",
            "default-value": "src-over",
            "default-meaning": "add the current layer on top of other layers",
            "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
            "type": [
                "src", //
                "src-over", //
                "dst-over", //
                "src-in", //
                "dst-in", //
                "src-out", //
                "dst-out", //
                "src-atop", //
                "dst-atop", //
                "xor", //
                "darken", //
                "lighten" //
            ]
        }
    },
    "layer" : {
        "buffer-size": {
            "default-value": "0",
            "type":"float",
            "default-meaning": "No buffer will be used",
            "doc": "Extra tolerance around the Layer extent (in pixels) used to when querying and (potentially) clipping the layer data during rendering"
        },
        "-torque-clear-color": {
            "css": "-torque-clear-color",
            "type": "color",
            "default-value": "rgba(255, 255, 255, 0)",
            "default-meaning": "full clear",
            "doc": "color used to clear canvas on each frame"
        },
        "-torque-frame-count": {
            "css": "-torque-frame-count",
            "default-value": "128",
            "type":"number",
            "default-meaning": "the data is broken into 128 time frames",
            "doc": "Number of animation steps/frames used in the animation. If the data contains a fewere number of total frames, the lesser value will be used."
        },
        "-torque-resolution": {
            "css": "-torque-resolution",
            "default-value": "2",
            "type":"number",
            "default-meaning": "",
            "doc": "Spatial resolution in pixels. A resolution of 1 means no spatial aggregation of the data. Any other resolution of N results in spatial aggregation into cells of NxN pixels. The value N must be power of 2"
        },
        "-torque-animation-duration": {
            "css": "-torque-animation-duration",
            "default-value": "30",
            "type":"number",
            "default-meaning": "the animation lasts 30 seconds",
            "doc": "Animation duration in seconds"
        },
        "-torque-aggregation-function": {
            "css": "-torque-aggregation-function",
            "default-value": "count(cartodb_id)",
            "type": "string",
            "default-meaning": "the value for each cell is the count of points in that cell",
            "doc": "A function used to calculate a value from the aggregate data for each cell. See -torque-resolution"
        },
        "-torque-time-attribute": {
            "css": "-torque-time-attribute",
            "default-value": "time",
            "type": "string",
            "default-meaning": "the data column in your table that is of a time based type",
            "doc": "The table column that contains the time information used create the animation"
        },
        "-torque-data-aggregation": {
            "css": "-torque-data-aggregation",
            "default-value": "linear",
            "type": [
              "cumulative"
            ],
            "default-meaning": "previous values are discarded",
            "doc": "A linear animation will discard previous values while a cumulative animation will accumulate them until it restarts"
        }
    },
    "symbolizers" : {
        "*": {
            "comp-op": {
                "css": "comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current layer on top of other layers",
                "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
                "type": [
                  "src", //
                  "src-over", //
                  "dst-over", //
                  "src-in", //
                  "dst-in", //
                  "src-out", //
                  "dst-out", //
                  "src-atop", //
                  "dst-atop", //
                  "xor", //
                  "darken", //
                  "lighten" //
                ]
            },
            "opacity": {
                "css": "opacity",
                "type": "float",
                "doc": "An alpha value for the style (which means an alpha applied to all features in separate buffer and then composited back to main buffer)",
                "default-value": 1,
                "default-meaning": "no separate buffer will be used and no alpha will be applied to the style after rendering"
            }
        },
        "trail": {
          "steps": {
            "css": "trail-steps",
            "type": "float",
            "default-value": 1,
            "default-meaning": "no trail steps",
            "doc": "How many steps of trails are going to be rendered"
          }
        },
        "polygon": {
            "fill": {
                "css": "polygon-fill",
                "type": "color",
                "default-value": "rgba(128,128,128,1)",
                "default-meaning": "gray and fully opaque (alpha = 1), same as rgb(128,128,128)",
                "doc": "Fill color to assign to a polygon"
            },
            "fill-opacity": {
                "css": "polygon-opacity",
                "type": "float",
                "doc": "The opacity of the polygon",
                "default-value": 1,
                "default-meaning": "opaque"
            }
        },
        "line": {
            "stroke": {
                "css": "line-color",
                "default-value": "rgba(0,0,0,1)",
                "type": "color",
                "default-meaning": "black and fully opaque (alpha = 1), same as rgb(0,0,0)",
                "doc": "The color of a drawn line"
            },
            "stroke-width": {
                "css": "line-width",
                "default-value": 1,
                "type": "float",
                "doc": "The width of a line in pixels"
            },
            "stroke-opacity": {
                "css": "line-opacity",
                "default-value": 1,
                "type": "float",
                "default-meaning": "opaque",
                "doc": "The opacity of a line"
            },
            "stroke-linejoin": {
                "css": "line-join",
                "default-value": "miter",
                "type": [
                    "miter",
                    "round",
                    "bevel"
                ],
                "doc": "The behavior of lines when joining"
            },
            "stroke-linecap": {
                "css": "line-cap",
                "default-value": "butt",
                "type": [
                    "butt",
                    "round",
                    "square"
                ],
                "doc": "The display of line endings"
            }
        },
        "markers": {
            "file": {
                "css": "marker-file",
                "doc": "An SVG file that this marker shows at each placement. If no file is given, the marker will show an ellipse.",
                "default-value": "",
                "default-meaning": "An ellipse or circle, if width equals height",
                "type": "uri"
            },
            "opacity": {
                "css": "marker-opacity",
                "doc": "The overall opacity of the marker, if set, overrides both the opacity of both the fill and stroke",
                "default-value": 1,
                "default-meaning": "The stroke-opacity and fill-opacity will be used",
                "type": "float"
            },
            "fill-opacity": {
                "css": "marker-fill-opacity",
                "doc": "The fill opacity of the marker",
                "default-value": 1,
                "default-meaning": "opaque",
                "type": "float"
            },
            "stroke": {
                "css": "marker-line-color",
                "doc": "The color of the stroke around a marker shape.",
                "default-value": "black",
                "type": "color"
            },
            "stroke-width": {
                "css": "marker-line-width",
                "doc": "The width of the stroke around a marker shape, in pixels. This is positioned on the boundary, so high values can cover the area itself.",
                "type": "float"
            },
            "stroke-opacity": {
                "css": "marker-line-opacity",
                "default-value": 1,
                "default-meaning": "opaque",
                "doc": "The opacity of a line",
                "type": "float"
            },
            "fill": {
                "css": "marker-fill",
                "default-value": "blue",
                "doc": "The color of the area of the marker.",
                "type": "color"
            },
            "marker-type": {
                "css": "marker-type",
                "type": [
                    "rectangle",
                    "ellipse"
                ],
                "default-value": "ellipse",
                "doc": "The default marker-type. If a SVG file is not given as the marker-file parameter, the renderer provides either an rectangle or an ellipse (a circle if height is equal to width)"
            },
             "width": {
                "css": "marker-width",
                "default-value": 10,
                "doc": "The width of the marker, if using one of the default types.",
                "type": "float"
            }
        },
        "point": {
            "file": {
                "css": "point-file",
                "type": "uri",
                "required": false,
                "default-value": "none",
                "doc": "Image file to represent a point"
            },
            "opacity": {
                "css": "point-opacity",
                "type": "float",
                "default-value": 1.0,
                "default-meaning": "Fully opaque",
                "doc": "A value from 0 to 1 to control the opacity of the point"
            }
        }
    },
    "colors": {
        "aliceblue":  [240, 248, 255],
        "antiquewhite":  [250, 235, 215],
        "aqua":  [0, 255, 255],
        "aquamarine":  [127, 255, 212],
        "azure":  [240, 255, 255],
        "beige":  [245, 245, 220],
        "bisque":  [255, 228, 196],
        "black":  [0, 0, 0],
        "blanchedalmond":  [255,235,205],
        "blue":  [0, 0, 255],
        "blueviolet":  [138, 43, 226],
        "brown":  [165, 42, 42],
        "burlywood":  [222, 184, 135],
        "cadetblue":  [95, 158, 160],
        "chartreuse":  [127, 255, 0],
        "chocolate":  [210, 105, 30],
        "coral":  [255, 127, 80],
        "cornflowerblue":  [100, 149, 237],
        "cornsilk":  [255, 248, 220],
        "crimson":  [220, 20, 60],
        "cyan":  [0, 255, 255],
        "darkblue":  [0, 0, 139],
        "darkcyan":  [0, 139, 139],
        "darkgoldenrod":  [184, 134, 11],
        "darkgray":  [169, 169, 169],
        "darkgreen":  [0, 100, 0],
        "darkgrey":  [169, 169, 169],
        "darkkhaki":  [189, 183, 107],
        "darkmagenta":  [139, 0, 139],
        "darkolivegreen":  [85, 107, 47],
        "darkorange":  [255, 140, 0],
        "darkorchid":  [153, 50, 204],
        "darkred":  [139, 0, 0],
        "darksalmon":  [233, 150, 122],
        "darkseagreen":  [143, 188, 143],
        "darkslateblue":  [72, 61, 139],
        "darkslategrey":  [47, 79, 79],
        "darkturquoise":  [0, 206, 209],
        "darkviolet":  [148, 0, 211],
        "deeppink":  [255, 20, 147],
        "deepskyblue":  [0, 191, 255],
        "dimgray":  [105, 105, 105],
        "dimgrey":  [105, 105, 105],
        "dodgerblue":  [30, 144, 255],
        "firebrick":  [178, 34, 34],
        "floralwhite":  [255, 250, 240],
        "forestgreen":  [34, 139, 34],
        "fuchsia":  [255, 0, 255],
        "gainsboro":  [220, 220, 220],
        "ghostwhite":  [248, 248, 255],
        "gold":  [255, 215, 0],
        "goldenrod":  [218, 165, 32],
        "gray":  [128, 128, 128],
        "grey":  [128, 128, 128],
        "green":  [0, 128, 0],
        "greenyellow":  [173, 255, 47],
        "honeydew":  [240, 255, 240],
        "hotpink":  [255, 105, 180],
        "indianred":  [205, 92, 92],
        "indigo":  [75, 0, 130],
        "ivory":  [255, 255, 240],
        "khaki":  [240, 230, 140],
        "lavender":  [230, 230, 250],
        "lavenderblush":  [255, 240, 245],
        "lawngreen":  [124, 252, 0],
        "lemonchiffon":  [255, 250, 205],
        "lightblue":  [173, 216, 230],
        "lightcoral":  [240, 128, 128],
        "lightcyan":  [224, 255, 255],
        "lightgoldenrodyellow":  [250, 250, 210],
        "lightgray":  [211, 211, 211],
        "lightgreen":  [144, 238, 144],
        "lightgrey":  [211, 211, 211],
        "lightpink":  [255, 182, 193],
        "lightsalmon":  [255, 160, 122],
        "lightseagreen":  [32, 178, 170],
        "lightskyblue":  [135, 206, 250],
        "lightslategray":  [119, 136, 153],
        "lightslategrey":  [119, 136, 153],
        "lightsteelblue":  [176, 196, 222],
        "lightyellow":  [255, 255, 224],
        "lime":  [0, 255, 0],
        "limegreen":  [50, 205, 50],
        "linen":  [250, 240, 230],
        "magenta":  [255, 0, 255],
        "maroon":  [128, 0, 0],
        "mediumaquamarine":  [102, 205, 170],
        "mediumblue":  [0, 0, 205],
        "mediumorchid":  [186, 85, 211],
        "mediumpurple":  [147, 112, 219],
        "mediumseagreen":  [60, 179, 113],
        "mediumslateblue":  [123, 104, 238],
        "mediumspringgreen":  [0, 250, 154],
        "mediumturquoise":  [72, 209, 204],
        "mediumvioletred":  [199, 21, 133],
        "midnightblue":  [25, 25, 112],
        "mintcream":  [245, 255, 250],
        "mistyrose":  [255, 228, 225],
        "moccasin":  [255, 228, 181],
        "navajowhite":  [255, 222, 173],
        "navy":  [0, 0, 128],
        "oldlace":  [253, 245, 230],
        "olive":  [128, 128, 0],
        "olivedrab":  [107, 142, 35],
        "orange":  [255, 165, 0],
        "orangered":  [255, 69, 0],
        "orchid":  [218, 112, 214],
        "palegoldenrod":  [238, 232, 170],
        "palegreen":  [152, 251, 152],
        "paleturquoise":  [175, 238, 238],
        "palevioletred":  [219, 112, 147],
        "papayawhip":  [255, 239, 213],
        "peachpuff":  [255, 218, 185],
        "peru":  [205, 133, 63],
        "pink":  [255, 192, 203],
        "plum":  [221, 160, 221],
        "powderblue":  [176, 224, 230],
        "purple":  [128, 0, 128],
        "red":  [255, 0, 0],
        "rosybrown":  [188, 143, 143],
        "royalblue":  [65, 105, 225],
        "saddlebrown":  [139, 69, 19],
        "salmon":  [250, 128, 114],
        "sandybrown":  [244, 164, 96],
        "seagreen":  [46, 139, 87],
        "seashell":  [255, 245, 238],
        "sienna":  [160, 82, 45],
        "silver":  [192, 192, 192],
        "skyblue":  [135, 206, 235],
        "slateblue":  [106, 90, 205],
        "slategray":  [112, 128, 144],
        "slategrey":  [112, 128, 144],
        "snow":  [255, 250, 250],
        "springgreen":  [0, 255, 127],
        "steelblue":  [70, 130, 180],
        "tan":  [210, 180, 140],
        "teal":  [0, 128, 128],
        "thistle":  [216, 191, 216],
        "tomato":  [255, 99, 71],
        "turquoise":  [64, 224, 208],
        "violet":  [238, 130, 238],
        "wheat":  [245, 222, 179],
        "white":  [255, 255, 255],
        "whitesmoke":  [245, 245, 245],
        "yellow":  [255, 255, 0],
        "yellowgreen":  [154, 205, 50],
        "transparent":  [0, 0, 0, 0]
    }
};

module.exports = {
  version: {
    latest: _torque_reference_latest,
    '1.0.0': _torque_reference_latest
  }
};

},{}],3:[function(require,module,exports){
(function (global){
//
// common functionallity for torque layers
//
var carto = global.carto || require('carto');

function TorqueLayer() {}

TorqueLayer.prototype = {
};

TorqueLayer.optionsFromLayer = function(mapConfig) {
  var opts = {};
  if (!mapConfig) return opts;
  var attrs = {
    'buffer-size': 'buffer-size',
    '-torque-frame-count': 'steps',
    '-torque-resolution': 'resolution',
    '-torque-animation-duration': 'animationDuration',
    '-torque-aggregation-function': 'countby',
    '-torque-time-attribute': 'column',
    '-torque-data-aggregation': 'data_aggregation'
  };
  for (var i in attrs) {
    var v = mapConfig.eval(i);
    if (v !== undefined) {
      var a = attrs[i];
      opts[a] = v;
    }
  }
  return opts;
};

TorqueLayer.optionsFromCartoCSS = function(cartocss) {
  var shader = new carto.RendererJS().render(cartocss);
  var mapConfig = shader.findLayer({ name: 'Map' });
  return TorqueLayer.optionsFromLayer(mapConfig);
};

module.exports.TorqueLayer = TorqueLayer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"carto":undefined}],4:[function(require,module,exports){
(function (global){
  var Event = {};
  Event.on = function(evt, callback) {
      var cb = this._evt_callbacks = this._evt_callbacks || {};
      var l = cb[evt] || (cb[evt] = []);
      l.push(callback);
      return this;
  };

  Event.trigger = function(evt) {
      var c = this._evt_callbacks && this._evt_callbacks[evt];
      for(var i = 0; c && i < c.length; ++i) {
          c[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
      return this;
  };

  Event.fire = Event.trigger;

  Event.off = function (evt, callback) {
      var c = this._evt_callbacks && this._evt_callbacks[evt];
      if (c && !callback) {
        delete this._evt_callbacks[evt];
        return this;
     }
     var remove = [];
     for(var i = 0; c && i < c.length; ++i) {
       if(c[i] === callback) remove.push(i);
     }
     while((i = remove.pop()) !== undefined) c.splice(i, 1);
    return this;
  };

  Event.callbacks = function(evt) {
    return (this._evt_callbacks && this._evt_callbacks[evt]) || [];
  };

  function extend() {
      var objs = arguments;
      var a = objs[0];
      for (var i = 1; i < objs.length; ++i) {
          var b = objs[i];
          for (var k in b) {
              a[k] = b[k];
          }
      }
      return a;
  }

  function clone(a) {
    return extend({}, a);
  }

  function isFunction(f) {
    return typeof f == 'function' || false;
  }

  function isArray(value) {
      return value && typeof value == 'object' && Object.prototype.toString.call(value) == '[object Array]';
  }

  // types
  var types = {
    Uint8Array: typeof(global['Uint8Array']) !== 'undefined' ? global.Uint8Array : Array,
    Uint8ClampedArray: typeof(global['Uint8ClampedArray']) !== 'undefined' ? global.Uint8ClampedArray: Array,
    Uint32Array: typeof(global['Uint32Array']) !== 'undefined' ? global.Uint32Array : Array,
    Int16Array: typeof(global['Int16Array']) !== 'undefined' ? global.Int16Array : Array,
    Int32Array: typeof(global['Int32Array']) !== 'undefined' ? global.Int32Array: Array
  };

  function isBrowserSupported() {
    return !!document.createElement('canvas');
  }

  function userAgent() {
      return typeof navigator !== 'undefined' ? navigator.userAgent : '';
  }

  var flags = {
    sprites_to_images: userAgent().indexOf('Safari') === -1 && userAgent().indexOf('Firefox') === -1
  };

module.exports = {
    Event: Event,
    extend: extend,
    clone: clone,
    isFunction: isFunction,
    isArray: isArray,
    types: types,
    isBrowserSupported: isBrowserSupported,
    flags: flags
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Extends OverlayView to provide a canvas "Layer".
 * @author Brendan Kenny
 */

/**
 * A map layer that provides a canvas over the slippy map and a callback
 * system for efficient animation. Requires canvas and CSS 2D transform
 * support.
 * @constructor
 * @extends google.maps.OverlayView
 * @param {CanvasLayerOptions=} opt_options Options to set in this CanvasLayer.
 */

function CanvasLayer(opt_options) {
  /**
   * If true, canvas is in a map pane and the OverlayView is fully functional.
   * See google.maps.OverlayView.onAdd for more information.
   * @type {boolean}
   * @private
   */
  this.isAdded_ = false;

  /**
   * If true, each update will immediately schedule the next.
   * @type {boolean}
   * @private
   */
  this.isAnimated_ = false;

  /**
   * The name of the MapPane in which this layer will be displayed.
   * @type {string}
   * @private
   */
  this.paneName_ = CanvasLayer.DEFAULT_PANE_NAME_;

  /**
   * A user-supplied function called whenever an update is required. Null or
   * undefined if a callback is not provided.
   * @type {?function=}
   * @private
   */
  this.updateHandler_ = null;

  /**
   * A user-supplied function called whenever an update is required and the
   * map has been resized since the last update. Null or undefined if a
   * callback is not provided.
   * @type {?function}
   * @private
   */
  this.resizeHandler_ = null;

  /**
   * The LatLng coordinate of the top left of the current view of the map. Will
   * be null when this.isAdded_ is false.
   * @type {google.maps.LatLng}
   * @private
   */
  this.topLeft_ = null;

  /**
   * The map-pan event listener. Will be null when this.isAdded_ is false. Will
   * be null when this.isAdded_ is false.
   * @type {?function}
   * @private
   */
  this.centerListener_ = null;

  /**
   * The map-resize event listener. Will be null when this.isAdded_ is false.
   * @type {?function}
   * @private
   */
  this.resizeListener_ = null;

  /**
   * If true, the map size has changed and this.resizeHandler_ must be called
   * on the next update.
   * @type {boolean}
   * @private
   */
  this.needsResize_ = true;

  /**
   * A browser-defined id for the currently requested callback. Null when no
   * callback is queued.
   * @type {?number}
   * @private
   */
  this.requestAnimationFrameId_ = null;

  var canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.pointerEvents = 'none';

  /**
   * The canvas element.
   * @type {!HTMLCanvasElement}
   */
  this.canvas = canvas;

  /**
   * Simple bind for functions with no args for bind-less browsers (Safari).
   * @param {Object} thisArg The this value used for the target function.
   * @param {function} func The function to be bound.
   */
  function simpleBindShim(thisArg, func) {
    return function() { func.apply(thisArg); };
  }

  /**
   * A reference to this.repositionCanvas_ with this bound as its this value.
   * @type {function}
   * @private
   */
  this.repositionFunction_ = simpleBindShim(this, this.repositionCanvas_);

  /**
   * A reference to this.resize_ with this bound as its this value.
   * @type {function}
   * @private
   */
  this.resizeFunction_ = simpleBindShim(this, this.resize_);

  /**
   * A reference to this.update_ with this bound as its this value.
   * @type {function}
   * @private
   */
  this.requestUpdateFunction_ = simpleBindShim(this, this.update_);

  // set provided options, if any
  if (opt_options) {
    this.setOptions(opt_options);
  }
}

CanvasLayer.prototype = new google.maps.OverlayView();

/**
 * The default MapPane to contain the canvas.
 * @type {string}
 * @const
 * @private
 */
CanvasLayer.DEFAULT_PANE_NAME_ = 'overlayLayer';

/**
 * Transform CSS property name, with vendor prefix if required. If browser
 * does not support transforms, property will be ignored.
 * @type {string}
 * @const
 * @private
 */
CanvasLayer.CSS_TRANSFORM_ = (function() {
  var div = document.createElement('div');
  var transformProps = [
    'transform',
    'WebkitTransform',
    'MozTransform',
    'OTransform',
    'msTransform'
  ];
  for (var i = 0; i < transformProps.length; i++) {
    var prop = transformProps[i];
    if (div.style[prop] !== undefined) {
      return prop;
    }
  }

  // return unprefixed version by default
  return transformProps[0];
})();

/**
 * The requestAnimationFrame function, with vendor-prefixed or setTimeout-based
 * fallbacks. MUST be called with window as thisArg.
 * @type {function}
 * @param {function} callback The function to add to the frame request queue.
 * @return {number} The browser-defined id for the requested callback.
 * @private
 */
CanvasLayer.prototype.requestAnimFrame_ =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      return window.setTimeout(callback, 1000 / 60);
    };

/**
 * The cancelAnimationFrame function, with vendor-prefixed fallback. Does not
 * fall back to clearTimeout as some platforms implement requestAnimationFrame
 * but not cancelAnimationFrame, and the cost is an extra frame on onRemove.
 * MUST be called with window as thisArg.
 * @type {function}
 * @param {number=} requestId The id of the frame request to cancel.
 * @private
 */
CanvasLayer.prototype.cancelAnimFrame_ =
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.msCancelAnimationFrame ||
    function(requestId) {};

/**
 * Sets any options provided. See CanvasLayerOptions for more information.
 * @param {CanvasLayerOptions} options The options to set.
 */
CanvasLayer.prototype.setOptions = function(options) {
  if (options.animate !== undefined) {
    this.setAnimate(options.animate);
  }

  if (options.paneName !== undefined) {
    this.setPane(options.paneName);
  }

  if (options.updateHandler !== undefined) {
    this.setUpdateHandler(options.updateHandler);
  }

  if (options.resizeHandler !== undefined) {
    this.setResizeHandler(options.resizeHandler);
  }

  if(options.readyHandler) {
    this.readyHandler = options.readyHandler;
  }

};

/**
 * Set the animated state of the layer. If true, updateHandler will be called
 * repeatedly, once per frame. If false, updateHandler will only be called when
 * a map property changes that could require the canvas content to be redrawn.
 * @param {boolean} animate Whether the canvas is animated.
 */
CanvasLayer.prototype.setAnimate = function(animate) {
  this.isAnimated_ = !!animate;

  if (this.isAnimated_) {
    this.scheduleUpdate();
  }
};

/**
 * @return {boolean} Whether the canvas is animated.
 */
CanvasLayer.prototype.isAnimated = function() {
  return this.isAnimated_;
};

/**
 * Set the MapPane in which this layer will be displayed, by name. See
 * {@code google.maps.MapPanes} for the panes available.
 * @param {string} paneName The name of the desired MapPane.
 */
CanvasLayer.prototype.setPaneName = function(paneName) {
  this.paneName_ = paneName;

  this.setPane_();
};

/**
 * Set the opacity for the canvas.
 * 
 * @param {number} opacity The opacity of the canvas
 */
CanvasLayer.prototype.setOpacity = function (opacity) {
  this.canvas.style.opacity = opacity;
};

/**
 * Get the canvases opacity.
 * 
 * @return {number} The opacity of the canvas
 */
CanvasLayer.prototype.getOpacity = function () {
  return this.canvas.style.opacity;
};

/**
 * @return {string} The name of the current container pane.
 */
CanvasLayer.prototype.getPaneName = function() {
  return this.paneName_;
};

/**
 * Adds the canvas to the specified container pane. Since this is guaranteed to
 * execute only after onAdd is called, this is when paneName's existence is
 * checked (and an error is thrown if it doesn't exist).
 * @private
 */
CanvasLayer.prototype.setPane_ = function() {
  if (!this.isAdded_) {
    return;
  }

  // onAdd has been called, so panes can be used
  var panes = this.getPanes();
  if (!panes[this.paneName_]) {
    throw new Error('"' + this.paneName_ + '" is not a valid MapPane name.');
  }

  panes[this.paneName_].appendChild(this.canvas);
};

/**
 * Set a function that will be called whenever the parent map and the overlay's
 * canvas have been resized. If opt_resizeHandler is null or unspecified, any
 * existing callback is removed.
 * @param {?function=} opt_resizeHandler The resize callback function.
 */
CanvasLayer.prototype.setResizeHandler = function(opt_resizeHandler) {
  this.resizeHandler_ = opt_resizeHandler;
};

/**
 * Set a function that will be called when a repaint of the canvas is required.
 * If opt_updateHandler is null or unspecified, any existing callback is
 * removed.
 * @param {?function=} opt_updateHandler The update callback function.
 */
CanvasLayer.prototype.setUpdateHandler = function(opt_updateHandler) {
  this.updateHandler_ = opt_updateHandler;
};

/**
 * @inheritDoc
 */
CanvasLayer.prototype.onAdd = function() {
  if (this.isAdded_) {
    return;
  }

  this.isAdded_ = true;
  this.setPane_();

  this.resizeListener_ = google.maps.event.addListener(this.getMap(),
      'resize', this.resizeFunction_);
  this.centerListener_ = google.maps.event.addListener(this.getMap(),
      'center_changed', this.repositionFunction_);

  this.resize_();
  this.repositionCanvas_();
  this.readyHandler && this.readyHandler();
};

/**
 * @inheritDoc
 */
CanvasLayer.prototype.onRemove = function() {
  if (!this.isAdded_) {
    return;
  }

  this.isAdded_ = false;
  this.topLeft_ = null;

  // remove canvas and listeners for pan and resize from map
  this.canvas.parentElement.removeChild(this.canvas);
  if (this.centerListener_) {
    google.maps.event.removeListener(this.centerListener_);
    this.centerListener_ = null;
  }
  if (this.resizeListener_) {
    google.maps.event.removeListener(this.resizeListener_);
    this.resizeListener_ = null;
  }

  // cease canvas update callbacks
  if (this.requestAnimationFrameId_) {
    this.cancelAnimFrame_.call(window, this.requestAnimationFrameId_);
    this.requestAnimationFrameId_ = null;
  }
};

/**
 * The internal callback for resize events that resizes the canvas to keep the
 * map properly covered.
 * @private
 */
CanvasLayer.prototype.resize_ = function() {
  // TODO(bckenny): it's common to use a smaller canvas but use CSS to scale
  // what is drawn by the browser to save on fill rate. Add an option to do
  // this.

  if (!this.isAdded_) {
    return;
  }

  var map = this.getMap();
  var width = map.getDiv().offsetWidth;
  var height = map.getDiv().offsetHeight;
  var oldWidth = this.canvas.width;
  var oldHeight = this.canvas.height;

  // resizing may allocate a new back buffer, so do so conservatively
  if (oldWidth !== width || oldHeight !== height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.needsResize_ = true;
    this.scheduleUpdate();
  }
};

/**
 * @inheritDoc
 */
CanvasLayer.prototype.draw = function() {
  this.repositionCanvas_();
};

/**
 * Internal callback for map view changes. Since the Maps API moves the overlay
 * along with the map, this function calculates the opposite translation to
 * keep the canvas in place.
 * @private
 */
CanvasLayer.prototype.repositionCanvas_ = function() {
  // TODO(bckenny): *should* only be executed on RAF, but in current browsers
  //     this causes noticeable hitches in map and overlay relative
  //     positioning.

  var bounds = this.getMap().getBounds();
  this.topLeft_ = new google.maps.LatLng(bounds.getNorthEast().lat(),
      bounds.getSouthWest().lng());

  // canvas position relative to draggable map's conatainer depends on
  // overlayView's projection, not the map's
  var projection = this.getProjection();
  var divTopLeft = projection.fromLatLngToDivPixel(this.topLeft_);

  // when the zoom level is low, more than one map can be shown in the screen
  // so the canvas should be attach to the map with more are in the screen
  var mapSize = (1 << this.getMap().getZoom())*256;
  if (Math.abs(divTopLeft.x) > mapSize) {
    divTopLeft.x -= mapSize;
  }
  this.canvas.style[CanvasLayer.CSS_TRANSFORM_] = 'translate(' +
      Math.round(divTopLeft.x) + 'px,' + Math.round(divTopLeft.y) + 'px)';

  this.scheduleUpdate();
};

/**
 * Internal callback that serves as main animation scheduler via
 * requestAnimationFrame. Calls resize and update callbacks if set, and
 * schedules the next frame if overlay is animated.
 * @private
 */
CanvasLayer.prototype.update_ = function() {
  this.requestAnimationFrameId_ = null;

  if (!this.isAdded_) {
    return;
  }

  if (this.isAnimated_) {
    this.scheduleUpdate();
  }

  if (this.needsResize_ && this.resizeHandler_) {
    this.needsResize_ = false;
    this.resizeHandler_();
  }

  if (this.updateHandler_) {
    this.updateHandler_();
  }
};

/**
 * A convenience method to get the current LatLng coordinate of the top left of
 * the current view of the map.
 * @return {google.maps.LatLng} The top left coordinate.
 */
CanvasLayer.prototype.getTopLeft = function() {
  return this.topLeft_;
};

/**
 * Schedule a requestAnimationFrame callback to updateHandler. If one is
 * already scheduled, there is no effect.
 */
CanvasLayer.prototype.scheduleUpdate = function() {
  if (this.isAdded_ && !this.requestAnimationFrameId_) {
    this.requestAnimationFrameId_ =
        this.requestAnimFrame_.call(window, this.requestUpdateFunction_);
  }
};

module.exports = CanvasLayer;

},{}],6:[function(require,module,exports){
/*
 ====================
 canvas setup for drawing tiles
 ====================
 */

function CanvasTileLayer(canvas_setup, render) {
  this.tileSize = new google.maps.Size(256, 256);
  this.maxZoom = 19;
  this.name = "Tile #s";
  this.alt = "Canvas tile layer";
  this.tiles = {};
  this.canvas_setup = canvas_setup;
  this.render = render;
  if (!render) {
      this.render = canvas_setup;
  }
}


// create a tile with a canvas element
CanvasTileLayer.prototype.create_tile_canvas = function (coord, zoom, ownerDocument) {

  // create canvas and reset style
  var canvas = ownerDocument.createElement('canvas');
  var hit_canvas = ownerDocument.createElement('canvas');
  canvas.style.border = hit_canvas.style.border = "none";
  canvas.style.margin = hit_canvas.style.margin = "0";
  canvas.style.padding = hit_canvas.style.padding = "0";

  // prepare canvas and context sizes
  var ctx = canvas.getContext('2d');
  ctx.width = canvas.width = this.tileSize.width;
  ctx.height = canvas.height = this.tileSize.height;

  var hit_ctx = hit_canvas.getContext('2d');
  hit_canvas.width = hit_ctx.width = this.tileSize.width;
  hit_canvas.height = hit_ctx.height = this.tileSize.height;

  //set unique id
  var tile_id = coord.x + '_' + coord.y + '_' + zoom;

  canvas.setAttribute('id', tile_id);
  hit_canvas.setAttribute('id', tile_id);

  if (tile_id in this.tiles)
      delete this.tiles[tile_id];

  this.tiles[tile_id] = {canvas:canvas, ctx:ctx, hit_canvas:hit_canvas, hit_ctx:hit_ctx, coord:coord, zoom:zoom, primitives:null};

  // custom setup
  //if (tile_id == '19295_24654_16'){
  if (this.canvas_setup)
      this.canvas_setup(this.tiles[tile_id], coord, zoom);
  //}
  return canvas;

}


CanvasTileLayer.prototype.each = function (callback) {
  for (var t in this.tiles) {
      var tile = this.tiles[t];
      callback(tile);
  }
}

CanvasTileLayer.prototype.recreate = function () {
  for (var t in this.tiles) {
      var tile = this.tiles[t];
      this.canvas_setup(tile, tile.coord, tile.zoom);
  }
};

CanvasTileLayer.prototype.redraw_tile = function (tile) {
  this.render(tile, tile.coord, tile.zoom);
};

CanvasTileLayer.prototype.redraw = function () {
  for (var t in this.tiles) {
      var tile = this.tiles[t];
      this.render(tile, tile.coord, tile.zoom);
  }
};

// could be called directly...
CanvasTileLayer.prototype.getTile = function (coord, zoom, ownerDocument) {
  return this.create_tile_canvas(coord, zoom, ownerDocument);
};

CanvasTileLayer.prototype.releaseTile = function (tile) {
  var id = tile.getAttribute('id');
  delete this.tiles[id];
};

module.exports = CanvasTileLayer;

},{}],7:[function(require,module,exports){
function GMapsTileLoader() {
}


GMapsTileLoader.prototype = {

  _initTileLoader: function(map, projection) {
    this._map = map;
    this._projection = projection;
    this._tiles = {};
    this._tilesLoading = {};
    this._tilesToLoad = 0;
    this._updateTiles = this._updateTiles.bind(this);
    this._listeners = [];
    this._listeners.push(
      google.maps.event.addListener(this._map, 'dragend', this._updateTiles),
      google.maps.event.addListener(this._map, 'zoom_changed', this._updateTiles)
    );
    this.tileSize = 256;
    this._updateTiles();
  },

  _removeTileLoader: function() {
    this._listeners.forEach(function (listener) {
      google.maps.event.removeListener(listener);
    });
    
    this._removeTiles();
  },

  _removeTiles: function () {
    for (var key in this._tiles) {
      this._removeTile(key);
    }
  },

  _reloadTiles: function() {
    this._removeTiles();
    this._updateTiles();
  },

  _updateTiles: function () {

      if (!this._map) { return; }

      var bounds = this._map.getBounds();
      var zoom = this._map.getZoom();
      var tileSize = this.tileSize;
      var mzoom = (1 << zoom);

      var topLeft = new google.maps.LatLng(
        bounds.getNorthEast().lat(),
        bounds.getSouthWest().lng()
      );

      var bottomRigth = new google.maps.LatLng(
        bounds.getSouthWest().lat(),
        bounds.getNorthEast().lng()
      );


      this._projection = this._map.getProjection();
      var divTopLeft = this._projection.fromLatLngToPoint(topLeft);
      var divBottomRight = this._projection.fromLatLngToPoint(bottomRigth);


      var nwTilePoint = new google.maps.Point(
              Math.floor(divTopLeft.x*mzoom / tileSize),
              Math.floor(divTopLeft.y*mzoom / tileSize)),
          seTilePoint = new google.maps.Point(
              Math.floor(divBottomRight.x*mzoom / tileSize),
              Math.floor(divBottomRight.y*mzoom / tileSize));


      this._addTilesFromCenterOut(nwTilePoint, seTilePoint);
      this._removeOtherTiles(nwTilePoint, seTilePoint);
  },

  _removeOtherTiles: function (nwTilePoint, seTilePoint) {
      var kArr, x, y, key;

      var zoom = this._map.getZoom();
      for (key in this._tiles) {
          if (this._tiles.hasOwnProperty(key)) {
              kArr = key.split(':');
              x = parseInt(kArr[0], 10);
              y = parseInt(kArr[1], 10);
              z = parseInt(kArr[2], 10);

              // remove tile if it's out of bounds
              if (z !== zoom || x < nwTilePoint.x || x > seTilePoint.x || y < nwTilePoint.y || y > seTilePoint.y) {
                  this._removeTile(key);
              }
          }
      }
  },

  _removeTile: function (key) {
      this.onTileRemoved && this.onTileRemoved(this._tiles[key]); 
      delete this._tiles[key];
      delete this._tilesLoading[key];
  },

  _tileKey: function(tilePoint) {
    return tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.zoom;
  },

  _tileShouldBeLoaded: function (tilePoint) {
      var k = this._tileKey(tilePoint);
      return !(k in this._tiles) && !(k in this._tilesLoading);
  },

  _tileLoaded: function(tilePoint, tileData) {
    this._tilesToLoad--;
    var k = tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.zoom
    this._tiles[k] = tileData;
    delete this._tilesLoading[k];
    if(this._tilesToLoad === 0) {
      this.onTilesLoaded && this.onTilesLoaded();
    }
  },

  getTilePos: function (tilePoint) {
    var limit = (1 << this._map.getZoom());
    // wrap tile
    tilePoint = {
      x: ((tilePoint.x % limit) + limit) % limit,
      y: tilePoint.y
    };

    tilePoint = new google.maps.Point(
      tilePoint.x * this.tileSize, 
      tilePoint.y * this.tileSize
    );

    var bounds = this._map.getBounds();
    var topLeft = new google.maps.LatLng(
      bounds.getNorthEast().lat(),
      bounds.getSouthWest().lng()
    );

    var divTopLeft = this._map.getProjection().fromLatLngToPoint(topLeft);
    zoom = (1 << this._map.getZoom());
    divTopLeft.x = divTopLeft.x * zoom;
    divTopLeft.y = divTopLeft.y * zoom;

    return new google.maps.Point(
      tilePoint.x - divTopLeft.x,
      tilePoint.y - divTopLeft.y
    );
  },

  _addTilesFromCenterOut: function (nwTilePoint, seTilePoint) {
      var queue = [],
          center = new google.maps.Point(
            (nwTilePoint.x + seTilePoint.x) * 0.5,
            (nwTilePoint.y + seTilePoint.y) * 0.5
          ),
          zoom = this._map.getZoom();

      var j, i, point;

      for (j = nwTilePoint.y; j <= seTilePoint.y; j++) {
          for (i = nwTilePoint.x; i <= seTilePoint.x; i++) {
              point = new google.maps.Point (i, j);
              point.zoom = zoom;

              if (this._tileShouldBeLoaded(point)) {
                  queue.push(point);
              }
          }
      }

      var tilesToLoad = queue.length;

      if (tilesToLoad === 0) { return; }

      function distanceToCenterSq(point) {
        var dx = point.x - center.x;
        var dy = point.y - center.y;
        return dx * dx + dy * dy;
      }

      // load tiles in order of their distance to center
      queue.sort(function (a, b) {
          return distanceToCenterSq(a) - distanceToCenterSq(b);
      });

      this._tilesToLoad += tilesToLoad;

        for (i = 0; i < tilesToLoad; i++) {
          var t = queue[i];
          var k = this._tileKey(t);
          this._tilesLoading[k] = t;
          // events
          if (this.onTileAdded) {
            this.onTileAdded(t);
          }
        }

      this.onTilesLoading && this.onTilesLoading();
  }

}

module.exports = GMapsTileLoader;

},{}],8:[function(require,module,exports){
var gmaps = {};
if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
    gmaps = require('./torque');
    gmaps.GMapsTileLoader = require('./gmaps_tileloader_mixin');
}
module.exports = gmaps;

},{"./gmaps_tileloader_mixin":7,"./torque":9}],9:[function(require,module,exports){
(function (global){
var carto = global.carto || require('carto');
var torque = require('../');
var CanvasLayer = require('./CanvasLayer');
var CanvasTileLayer = require('./canvas_tile_layer');
var GMapsTileLoader = require('./gmaps_tileloader_mixin');

function GMapsTorqueLayer(options) {
  var self = this;
  if (!torque.isBrowserSupported()) {
    throw new Error("browser is not supported by torque");
  }
  this.key = 0;
  this.shader = null;
  this.ready = false;
  this.options = torque.extend({}, options);
  this.options = torque.extend({
    provider: 'windshaft',
    renderer: 'point',
    resolution: 2,
    steps: 100,
    visible: true
  }, this.options);
  if (options.cartocss) {
    torque.extend(this.options,
        torque.common.TorqueLayer.optionsFromCartoCSS(options.cartocss));
  }

  this.hidden = !this.options.visible;

  this.animator = new torque.Animator(function(time) {
    var k = time | 0;
    if(self.key !== k) {
      self.setKey(k);
    }
  }, torque.clone(this.options));

  this.play = this.animator.start.bind(this.animator);
  this.stop = this.animator.stop.bind(this.animator);
  this.pause = this.animator.pause.bind(this.animator);
  this.toggle = this.animator.toggle.bind(this.animator);
  this.setDuration = this.animator.duration.bind(this.animator);
  this.isRunning = this.animator.isRunning.bind(this.animator);


  CanvasLayer.call(this, {
    map: this.options.map,
    //resizeHandler: this.redraw,
    animate: false,
    updateHandler: this.render,
    readyHandler: this.initialize
  });

}

/**
 * torque layer
 */
GMapsTorqueLayer.prototype = torque.extend({},
  CanvasLayer.prototype,
  GMapsTileLoader.prototype,
  torque.Event,
  {

  providers: {
    'sql_api': torque.providers.json,
    'url_template': torque.providers.JsonArray,
    'windshaft': torque.providers.windshaft
  },

  renderers: {
    'point': torque.renderer.Point,
    'pixel': torque.renderer.Rectangle
  },

  initialize: function() {
    var self = this;

    this.onTileAdded = this.onTileAdded.bind(this);

    this.options.ready = function() {
      self.fire("change:bounds", {
        bounds: self.provider.getBounds()
      });
      self.animator.steps(self.provider.getSteps());
      self.animator.rescale();
      self.fire('change:steps', {
        steps: self.provider.getSteps()
      });
      self.setKey(self.key);
    };

    this.provider = new this.providers[this.options.provider](this.options);
    this.renderer = new this.renderers[this.options.renderer](this.getCanvas(), this.options);
    this.renderer.options.errorCallback = this.options.errorCallback;

    // this listener should be before tile loader
    this._cacheListener = google.maps.event.addListener(this.options.map, 'zoom_changed', function() {
      self.renderer && self.renderer.clearSpriteCache();
    });

    this._initTileLoader(this.options.map, this.getProjection());

    if (this.shader) {
      this.renderer.setShader(this.shader);
    }

  },

  hide: function() {
    if(this.hidden) return this;
    this.pause();
    this.clear();
    this.hidden = true;
    return this;
  },

  show: function() {
    if(!this.hidden) return this;
    this.hidden = false;
    this.play();
    if (this.options.steps === 1){
      this.redraw();
    }
    return this;
  },

  setSQL: function(sql) {
    if (this.provider.options.named_map) throw new Error("SQL queries on named maps are read-only");
    if (!this.provider || !this.provider.setSQL) {
      throw new Error("this provider does not support SQL");
    }
    this.provider.setSQL(sql);
    this._reloadTiles();
    return this;
  },

  setBlendMode: function(_) {
    this.renderer && this.renderer.setBlendMode(_);
    this.redraw();
  },

  setSteps: function(steps) {
    this.provider && this.provider.setSteps(steps);
    this.animator && this.animator.steps(steps);
    this._reloadTiles();
  },

  setColumn: function(column, isTime) {
    this.provider && this.provider.setColumn(column, isTime);
    this._reloadTiles();
  },

  getTimeBounds: function() {
    return this.provider && this.provider.getKeySpan();
  },

  getCanvas: function() {
    return this.canvas;
  },

    // for each tile shown on the map request the data
  onTileAdded: function(t) {
    var self = this;
    this.provider.getTileData(t, t.zoom, function(tileData) {
      // don't load tiles that are not being shown
      if (t.zoom !== self.options.map.getZoom()) return;
      self._tileLoaded(t, tileData);
      if (tileData) {
        self.redraw();
      }
    });
  },

  clear: function() {
    var canvas = this.canvas;
    canvas.width = canvas.width;
  },

  /**
   * render the selectef key
   * don't call this function directly, it's called by
   * requestAnimationFrame. Use redraw to refresh it
   */
  render: function() {
    if(this.hidden) return;
    var t, tile, pos;
    var canvas = this.canvas;
    this.renderer.clearCanvas();
    var ctx = canvas.getContext('2d');

    // renders only a "frame"
    for(t in this._tiles) {
      tile = this._tiles[t];
      if (tile) {
        pos = this.getTilePos(tile.coord);
        ctx.setTransform(1, 0, 0, 1, pos.x, pos.y);
        this.renderer.renderTile(tile, this.key);
      }
    }
    this.renderer.applyFilters();
  },

  getActivePointsBBox: function(step) {
    var positions = [];
    var tileMax = this.options.resolution * (256/this.options.resolution - 1);
    for(var t in this._tiles) {
      var tile = this._tiles[t];
      positions = positions.concat(this.renderer.getActivePointsBBox(tile, step));
    }
    return positions;
  },

  /**
   * set key to be shown. If it's a single value
   * it renders directly, if it's an array it renders
   * accumulated
   */
  setKey: function(key) {
    this.key = key;
    this.animator.step(key);
    this.redraw();
    this.fire('change:time', { time: this.getTime(), step: this.key });
  },

  /**
   * helper function, does the same than ``setKey`` but only 
   * accepts scalars.
   */
  setStep: function(time) {
    if(time === undefined || time.length !== undefined) {
      throw new Error("setTime only accept scalars");
    }
    this.setKey(time);
  },

  /**
   * transform from animation step to Date object 
   * that contains the animation time
   *
   * ``step`` should be between 0 and ``steps - 1`` 
   */
  stepToTime: function(step) {
    if (!this.provider) return 0;
    var times = this.provider.getKeySpan();
    var time = times.start + (times.end - times.start)*(step/this.provider.getSteps());
    return new Date(time);
  },

  timeToStep: function(timestamp) {
    if (typeof timestamp === "Date") timestamp = timestamp.getTime();
    if (!this.provider) return 0;
    var times = this.provider.getKeySpan();
    var step = (this.provider.getSteps() * (timestamp - times.start)) / (times.end - times.start);
    return step;
  },

  getStep: function() {
    return this.key;
  },

  /**
   * returns the animation time defined by the data
   * in the defined column. Date object
   */
  getTime: function() {
    return this.stepToTime(this.key);
  },

  /**
   * set the cartocss for the current renderer
   */
  setCartoCSS: function(cartocss) {
    if (this.provider && this.provider.options.named_map) throw new Error("CartoCSS style on named maps is read-only");
    var shader = new carto.RendererJS().render(cartocss);
    this.shader = shader;
    if (this.renderer) {
      this.renderer.setShader(shader);
    }

    // provider options
    var options = torque.common.TorqueLayer.optionsFromLayer(shader.findLayer({ name: 'Map' }));
    this.provider && this.provider.setCartoCSS && this.provider.setCartoCSS(cartocss);
    if(this.provider && this.provider.setOptions(options)) {
      this._reloadTiles();
    }
    torque.extend(this.options, options);

    // animator options
    if (options.animationDuration) {
      this.animator.duration(options.animationDuration);
    }

    this.redraw();
    return this;
  },

  redraw: function() {
    this.scheduleUpdate();
  },

  onRemove: function() {
    this.fire('remove');
    CanvasLayer.prototype.onRemove.call(this);
    this.animator.stop();
    this._removeTileLoader();
    google.maps.event.removeListener(this._cacheListener);
  },

  getValueForPos: function(x, y, step) {
    step = step === undefined ? this.key: step;
    var t, tile, pos, value = null, xx, yy;
    for(t in this._tiles) {
      tile = this._tiles[t];
      pos = this.getTilePos(tile.coord);
      xx = x - pos.x;
      yy = y - pos.y;
      if (xx >= 0 && yy >= 0 && xx < this.renderer.TILE_SIZE && yy <= this.renderer.TILE_SIZE) {
        value = this.renderer.getValueFor(tile, step, xx, yy);
      }
      if (value !== null) {
        return value;
      }
    }
    return null;
  },
  getValueForBBox: function(x, y, w, h) {
    var xf = x + w, yf = y + h;
    var sum = 0;
    for(_y = y; y<yf; y+=this.options.resolution){
      for(_x = x; x<xf; x+=this.options.resolution){
        var thisValue = this.getValueForPos(_x,_y);
        if (thisValue){
          var bb = thisValue.bbox;
          var proj = this.getProjection()
          var xy = proj.fromLatLngToContainerPixel(new google.maps.LatLng(bb[1].lat, bb[1].lon));
          if(xy.x < xf && xy.y < yf){
            sum += thisValue.value;
          }
        }
      }
    }
    return sum;
  },
  
  error: function (callback) {
    this.options.errorCallback = callback;
    return this;
  }

});



function GMapsTiledTorqueLayer(options) {
  this.options = torque.extend({}, options);
  CanvasTileLayer.call(this, this._loadTile.bind(this), this.drawTile.bind(this));
  this.initialize(options);
}

GMapsTiledTorqueLayer.prototype = torque.extend({}, CanvasTileLayer.prototype, {

  providers: {
    'sql_api': torque.providers.json,
    'url_template': torque.providers.JsonArray
  },

  renderers: {
    'point': torque.renderer.Point,
    'pixel': torque.renderer.Rectangle
  },

  initialize: function(options) {
    var self = this;
    this.key = 0;

    this.options.renderer = this.options.renderer || 'pixel';
    this.options.provider = this.options.provider || 'sql_api';

    this.provider = new this.providers[this.options.provider](options);
    this.renderer = new this.renderers[this.options.renderer](null, options);

  },

  _tileLoaded: function(tile, tileData) {
    tile.data = tileData;
    this.drawTile(tile);
  },

  _loadTile: function(tile, coord, zoom) {
    var self = this;
    var limit = 1 << zoom;
    // wrap tile
    var wrappedCoord = {
      x: ((coord.x % limit) + limit) % limit,
      y: coord.y
    };

    this.provider.getTileData(wrappedCoord, zoom, function(tileData) {
      self._tileLoaded(tile, tileData);
    });
  },

  drawTile: function (tile) {
    var canvas = tile.canvas;
    if(!tile.data) return;
    canvas.width = canvas.width;

    this.renderer.setCanvas(canvas);

    var accum = this.renderer.accumulate(tile.data, this.key);
    this.renderer.renderTileAccum(accum, 0, 0);
  },

  setKey: function(key) {
    this.key = key;
    this.redraw();
  },

  /**
   * set the cartocss for the current renderer
   */
  setCartoCSS: function(cartocss) {
    if (!this.renderer) throw new Error('renderer is not valid');
    return this.renderer.setCartoCSS(cartocss);
  }

});

module.exports = {
    GMapsTiledTorqueLayer: GMapsTiledTorqueLayer,
    GMapsTorqueLayer: GMapsTorqueLayer
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../":10,"./CanvasLayer":5,"./canvas_tile_layer":6,"./gmaps_tileloader_mixin":7,"carto":undefined}],10:[function(require,module,exports){
module.exports = require('./core');

module.exports.Animator = require('./animator');
module.exports.cartocss_reference = require('./cartocss_reference');
module.exports.common = require('./common');
module.exports.math = require('./math');
module.exports.Mercator = require('./mercator');
module.exports.net = require('./request');
module.exports.renderer = require('./renderer');
module.exports.providers = require('./provider');

require('./leaflet');

var gmaps = require('./gmaps');
module.exports.GMapsTileLoader = gmaps.GMapsTileLoader;
module.exports.GMapsTorqueLayer = gmaps.GMapsTorqueLayer;
module.exports.GMapsTiledTorqueLayer = gmaps.GMapsTiledTorqueLayer;

},{"./animator":1,"./cartocss_reference":2,"./common":3,"./core":4,"./gmaps":8,"./leaflet":12,"./math":15,"./mercator":16,"./provider":18,"./renderer":23,"./request":27}],11:[function(require,module,exports){
require('./leaflet_tileloader_mixin');

/**
 * full canvas layer implementation for Leaflet
 */

L.CanvasLayer = L.Class.extend({

  includes: [L.Mixin.Events, L.Mixin.TileLoader],

  options: {
      minZoom: 0,
      maxZoom: 28,
      tileSize: 256,
      subdomains: 'abc',
      errorTileUrl: '',
      attribution: '',
      zoomOffset: 0,
      opacity: 1,
      unloadInvisibleTiles: L.Browser.mobile,
      updateWhenIdle: L.Browser.mobile,
      tileLoader: false, // installs tile loading events
      zoomAnimation: true
  },

  initialize: function (options) {
    var self = this;
    options = options || {};
    //this.project = this._project.bind(this);
    this.render = this.render.bind(this);
    L.Util.setOptions(this, options);
    this._canvas = this._createCanvas();
    // backCanvas for zoom animation
    if (this.options.zoomAnimation) {
      this._backCanvas = this._createCanvas();
    }
    this._ctx = this._canvas.getContext('2d');
    this.currentAnimationFrame = -1;
    this.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
                                    return window.setTimeout(callback, 1000 / 60);
                                };
    this.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
                                window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || function(id) { clearTimeout(id); };
  },

  _createCanvas: function() {
    var canvas;
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = this.options.zIndex || 0;
    var className = 'leaflet-tile-container';
    if (this.options.zoomAnimation) {
      className += ' leaflet-zoom-animated';
    }
    canvas.setAttribute('class', className);
    return canvas;
  },

  onAdd: function (map) {
    this._map = map;

    // add container with the canvas to the tile pane
    // the container is moved in the oposite direction of the 
    // map pane to keep the canvas always in (0, 0)
    var tilePane = this._map._panes.tilePane;
    var _container = L.DomUtil.create('div', 'leaflet-layer');
    _container.appendChild(this._canvas);
    if (this.options.zoomAnimation) {
      _container.appendChild(this._backCanvas);
      this._backCanvas.style.display = 'none';
    }
    tilePane.appendChild(_container);

    this._container = _container;

    // hack: listen to predrag event launched by dragging to
    // set container in position (0, 0) in screen coordinates
    map.dragging._draggable.on('predrag', function() {
      var d = map.dragging._draggable;
      L.DomUtil.setPosition(this._canvas, { x: -d._newPos.x, y: -d._newPos.y });
    }, this);

    map.on({ 'viewreset': this._reset }, this);
    map.on('move', this.redraw, this);
    map.on('resize', this._reset, this);

    if (this.options.zoomAnimation) {
      map.on({
        'zoomanim': this._animateZoom,
        'zoomend': this._endZoomAnim,
        'moveend': this._reset
      }, this);
    }

    if(this.options.tileLoader) {
      this._initTileLoader();
    }

    this._reset();
  },

  _animateZoom: function (e) {
    if (!this._animating) {
        this._animating = true;
    }
    var back = this._backCanvas;

    back.width = this._canvas.width;
    back.height = this._canvas.height;

    // paint current canvas in back canvas with trasnformation
    var pos = this._canvas._leaflet_pos || { x: 0, y: 0 };
    back.getContext('2d').drawImage(this._canvas, 0, 0);

    L.DomUtil.setPosition(back, L.DomUtil.getPosition(this._canvas));

    // hide original
    this._canvas.style.display = 'none';
    back.style.display = 'block';
    var map = this._map;
    var scale = map.getZoomScale(e.zoom);
    var newCenter = map._latLngToNewLayerPoint(map.getCenter(), e.zoom, e.center);
    var oldCenter = map._latLngToNewLayerPoint(e.center, e.zoom, e.center);

    var origin = {
      x:  newCenter.x - oldCenter.x + pos.x,
      y:  newCenter.y - oldCenter.y + pos.y,
    };

    var bg = back;
    var transform = L.DomUtil.TRANSFORM;
    setTimeout(function() {
      bg.style[transform] = L.DomUtil.getTranslateString(origin) + ' scale(' + e.scale + ') ';
    }, 0)
  },

  _endZoomAnim: function () {
    this._animating = false;
    this._canvas.style.display = 'block';
    this._backCanvas.style.display = 'none';
    this._backCanvas.style[L.DomUtil.TRANSFORM] = '';
  },

  getCanvas: function() {
    return this._canvas;
  },

  getAttribution: function() {
    return this.options.attribution;
  },

  draw: function() {
    return this._reset();
  },

  onRemove: function (map) {
    this._container.parentNode.removeChild(this._container);
    map.off({
      'viewreset': this._reset,
      'move': this._render,
      'moveend': this._reset,
      'resize': this._reset,
      'zoomanim': this._animateZoom,
      'zoomend': this._endZoomAnim
    }, this);
  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  error: function (callback) {
    this.provider.options.errorCallback = callback;
    return this;
  },

  setOpacity: function (opacity) {
    this.options.opacity = opacity;
    this._updateOpacity();
    return this;
  },

  setZIndex: function(zIndex) {
    this._canvas.style.zIndex = zIndex;
    if (this.options.zoomAnimation) {
      this._backCanvas.style.zIndex = zIndex;
    }
  },

  bringToFront: function () {
    return this;
  },

  bringToBack: function () {
    return this;
  },

  _reset: function () {
    var size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;

    // fix position
    var pos = L.DomUtil.getPosition(this._map.getPanes().mapPane);
    if (pos) {
      L.DomUtil.setPosition(this._canvas, { x: -pos.x, y: -pos.y });
    }
    this.onResize();
    this._render();
  },

  /*
  _project: function(x) {
    var point = this._map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  },
  */

  _updateOpacity: function () { },

  _render: function() {
    if (this.currentAnimationFrame >= 0) {
      this.cancelAnimationFrame.call(window, this.currentAnimationFrame);
    }
    this.currentAnimationFrame = this.requestAnimationFrame.call(window, this.render);
  },

  // use direct: true if you are inside an animation frame call
  redraw: function(direct) {
    var domPosition = L.DomUtil.getPosition(this._map.getPanes().mapPane);
    if (domPosition) {
      L.DomUtil.setPosition(this._canvas, { x: -domPosition.x, y: -domPosition.y });
    }
    if (direct) {
      this.render();
    } else {
      this._render();
    }
  },

  onResize: function() {
  },

  render: function() {
    throw new Error('render function should be implemented');
  }

});

},{"./leaflet_tileloader_mixin":13}],12:[function(require,module,exports){
if (typeof L !== 'undefined') {
    require('./torque');
}

},{"./torque":14}],13:[function(require,module,exports){
L.Mixin.TileLoader = {

  _initTileLoader: function() {
    this._tiles = {}
    this._tilesLoading = {};
    this._tilesToLoad = 0;
    this._map.on({
        'moveend': this._updateTiles
    }, this);
    this._updateTiles();
  },

  _removeTileLoader: function() {
    this._map.off({
        'moveend': this._updateTiles
    }, this);
    this._removeTiles();
  },

  _updateTiles: function () {

      if (!this._map) { return; }

      var bounds = this._map.getPixelBounds(),
          zoom = this._map.getZoom(),
          tileSize = this.options.tileSize;

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
          return;
      }

      var nwTilePoint = new L.Point(
              Math.floor(bounds.min.x / tileSize),
              Math.floor(bounds.min.y / tileSize)),

          seTilePoint = new L.Point(
              Math.floor(bounds.max.x / tileSize),
              Math.floor(bounds.max.y / tileSize)),

          tileBounds = new L.Bounds(nwTilePoint, seTilePoint);

      this._addTilesFromCenterOut(tileBounds);
      this._removeOtherTiles(tileBounds);
  },

  _removeTiles: function (bounds) {
      for (var key in this._tiles) {
        this._removeTile(key);
      }
  },

  _reloadTiles: function() {
    this._removeTiles();
    this._updateTiles();
  },

  _removeOtherTiles: function (bounds) {
      var kArr, x, y, z, key;
      var zoom = this._map.getZoom();

      for (key in this._tiles) {
          if (this._tiles.hasOwnProperty(key)) {
              kArr = key.split(':');
              x = parseInt(kArr[0], 10);
              y = parseInt(kArr[1], 10);
              z = parseInt(kArr[2], 10);

              // remove tile if it's out of bounds
              if (zoom !== z || x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
                  this._removeTile(key);
              }
          }
      }
  },

  _removeTile: function (key) {
      this.fire('tileRemoved', this._tiles[key]);
      delete this._tiles[key];
      delete this._tilesLoading[key];
  },

  _tileKey: function(tilePoint) {
    return tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.zoom;
  },

  _tileShouldBeLoaded: function (tilePoint) {
      var k = this._tileKey(tilePoint);
      return !(k in this._tiles) && !(k in this._tilesLoading);
  },

  _tileLoaded: function(tilePoint, tileData) {
    this._tilesToLoad--;
    var k = tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.zoom
    this._tiles[k] = tileData;
    delete this._tilesLoading[k];
    if(this._tilesToLoad === 0) {
      this.fire("tilesLoaded");
    }
  },

  getTilePos: function (tilePoint) {
    tilePoint = new L.Point(tilePoint.x, tilePoint.y);
    var origin = this._map._getNewTopLeftPoint(this._map.getCenter()),
        tileSize = this.options.tileSize;

    return tilePoint.multiplyBy(tileSize).subtract(origin);
  },

  _addTilesFromCenterOut: function (bounds) {
      var queue = [],
          center = bounds.getCenter(),
          zoom = this._map.getZoom();

      var j, i, point;

      for (j = bounds.min.y; j <= bounds.max.y; j++) {
          for (i = bounds.min.x; i <= bounds.max.x; i++) {
              point = new L.Point(i, j);
              point.zoom =  zoom;

              if (this._tileShouldBeLoaded(point)) {
                  queue.push(point);
              }
          }
      }

      var tilesToLoad = queue.length;

      if (tilesToLoad === 0) { return; }

      // load tiles in order of their distance to center
      queue.sort(function (a, b) {
          return a.distanceTo(center) - b.distanceTo(center);
      });

      this._tilesToLoad += tilesToLoad;

      for (i = 0; i < tilesToLoad; i++) {
        var t = queue[i];
        var k = this._tileKey(t);
        this._tilesLoading[k] = t;
        this.fire('tileAdded', t);
      }
      this.fire("tilesLoading");

  }

}

},{}],14:[function(require,module,exports){
(function (global){
var carto = global.carto || require('carto');
var torque = require('../');

require('./canvas_layer');

/**
 * torque layer
 */
L.TorqueLayer = L.CanvasLayer.extend({

  providers: {
    'sql_api': torque.providers.json,
    'url_template': torque.providers.JsonArray,
    'windshaft': torque.providers.windshaft
  },

  renderers: {
    'point': torque.renderer.Point,
    'pixel': torque.renderer.Rectangle
  },

  initialize: function(options) {
    var self = this;
    if (!torque.isBrowserSupported()) {
      throw new Error("browser is not supported by torque");
    }
    options.tileLoader = true;
    this.key = 0;
    this.prevRenderedKey = 0;
    if (options.cartocss) {
      torque.extend(options, torque.common.TorqueLayer.optionsFromCartoCSS(options.cartocss));
    }

    options.resolution = options.resolution || 2;
    options.steps = options.steps || 100;
    options.visible = options.visible === undefined ? true: options.visible;
    this.hidden = !options.visible;

    this.animator = new torque.Animator(function(time) {
      var k = time | 0;
      if(self.key !== k) {
        self.setKey(k, { direct: true });
      }
    }, torque.extend(torque.clone(options), {
      onPause: function() {
        self.fire('pause');
      },
      onStop: function() {
        self.fire('stop');
      },
      onStart: function() {
        self.fire('play');
      }
    }));

    this.play = this.animator.start.bind(this.animator);
    this.stop = this.animator.stop.bind(this.animator);
    this.pause = this.animator.pause.bind(this.animator);
    this.toggle = this.animator.toggle.bind(this.animator);
    this.setDuration = this.animator.duration.bind(this.animator);
    this.isRunning = this.animator.isRunning.bind(this.animator);


    L.CanvasLayer.prototype.initialize.call(this, options);

    this.options.renderer = this.options.renderer || 'point';
    this.options.provider = this.options.provider || 'windshaft';

    this.provider = new this.providers[this.options.provider](options);
    this.renderer = new this.renderers[this.options.renderer](this.getCanvas(), options);

    options.ready = function() {
      self.fire("change:bounds", {
        bounds: self.provider.getBounds()
      });
      self.animator.steps(self.provider.getSteps());
      self.animator.rescale();
      self.fire('change:steps', {
        steps: self.provider.getSteps()
      });
      self.setKey(self.key);
    };

    this.renderer.on("allIconsLoaded", this.render.bind(this));


    // for each tile shown on the map request the data
    this.on('tileAdded', function(t) {
      var tileData = this.provider.getTileData(t, t.zoom, function(tileData) {
        // don't load tiles that are not being shown
        if (t.zoom !== self._map.getZoom()) return;
        self._tileLoaded(t, tileData);
        self._clearTileCaches();
        if (tileData) {
          self.redraw();
        }
      });
    }, this);

  },

  _clearTileCaches: function() {
    var t, tile;
    for(t in this._tiles) {
      tile = this._tiles[t];
      if (tile && tile._tileCache) {
        tile._tileCache = null;
      }
    }
  },

  _clearCaches: function() {
    this.renderer && this.renderer.clearSpriteCache();
    this._clearTileCaches();
  },

  onAdd: function (map) {
    map.on({
      'zoomend': this._clearCaches,
      'zoomstart': this._pauseOnZoom,
    }, this);

    map.on({
      'zoomend': this._resumeOnZoom
    }, this);
    L.CanvasLayer.prototype.onAdd.call(this, map);
  },

  onRemove: function(map) {
    this.fire('remove');
    this._removeTileLoader();
    map.off({
      'zoomend': this._clearCaches,
      'zoomstart': this._pauseOnZoom,
    }, this);
    map.off({
      'zoomend': this._resumeOnZoom
    }, this);
    L.CanvasLayer.prototype.onRemove.call(this, map);
  },

  _pauseOnZoom: function() {
    this.wasRunning = this.isRunning();
    if (this.wasRunning) {
      this.pause();
    }
  },

  _resumeOnZoom: function() {
    if (this.wasRunning) {
      this.play();
    }
  },

  hide: function() {
    if(this.hidden) return this;
    this.pause();
    this.clear();
    this.hidden = true;
    return this;
  },

  show: function() {
    if(!this.hidden) return this;
    this.hidden = false;
    this.play();
    if (this.options.steps === 1){
      this.redraw();
    }
    return this;
  },

  setSQL: function(sql) {
    if (this.provider.options.named_map) throw new Error("SQL queries on named maps are read-only");
    if (!this.provider || !this.provider.setSQL) {
      throw new Error("this provider does not support SQL");
    }
    this.provider.setSQL(sql);
    this._reloadTiles();
    return this;
  },

  setBlendMode: function(_) {
    this.renderer.setBlendMode(_);
    this.redraw();
  },

  setSteps: function(steps) {
    this.provider.setSteps(steps);
    this._reloadTiles();
  },

  setColumn: function(column, isTime) {
    this.provider.setColumn(column, isTime);
    this._reloadTiles();
  },

  getTimeBounds: function() {
    return this.provider && this.provider.getKeySpan();
  },

  clear: function() {
    var canvas = this.getCanvas();
    canvas.width = canvas.width;
  },

  /**
   * render the selectef key
   * don't call this function directly, it's called by
   * requestAnimationFrame. Use redraw to refresh it
   */
  render: function() {
    if(this.hidden) return;
    var t, tile, pos;
    var canvas = this.getCanvas();
    this.renderer.clearCanvas();
    var ctx = canvas.getContext('2d');

    for(t in this._tiles) {
      tile = this._tiles[t];
      if (tile) {
        // clear cache
        if (this.animator.isRunning()) {
          tile._tileCache = null;
        }

        pos = this.getTilePos(tile.coord);
        ctx.setTransform(1, 0, 0, 1, pos.x, pos.y);

        if (tile._tileCache) {
          // when the tile has a cached image just render it and avoid to render
          // all the points
          this.renderer._ctx.drawImage(tile._tileCache, 0, 0);
        } else {
          this.renderer.renderTile(tile, this.key);
        }
      }
    }
    this.renderer.applyFilters();

    // prepare caches if the animation is not running
    // don't cache if the key has just changed, this avoids to cache
    // when the user is dragging, it only cache when the map is still
    if (!this.animator.isRunning() && this.key === this.prevRenderedKey) {
      var tile_size = this.renderer.TILE_SIZE;
      for(t in this._tiles) {
        tile = this._tiles[t];
        if (tile && !tile._tileCache) {
          var c = tile._tileCache = document.createElement('canvas');
          c.width = c.height = tile_size;
          pos = this.getTilePos(tile.coord);
          // clip bounds, firefox raise an exception when try to get data from outside canvas
          var x = Math.max(0, pos.x)
          var y = Math.max(0, pos.y)
          var w = Math.min(tile_size, this.getCanvas().width - x);
          var h = Math.min(tile_size, this.getCanvas().height - y);
          if (w > 0 && h > 0) {
            c.getContext('2d').drawImage(this.getCanvas(), x, y, w, h, x - pos.x, y - pos.y, w, h);
          }
        }
      }
    }

    this.prevRenderedKey = this.key;

  },

  /**
   * set key to be shown. If it's a single value
   * it renders directly, if it's an array it renders
   * accumulated
   */
  setKey: function(key, options) {
    this.key = key;
    this.animator.step(key);
    this._clearTileCaches();
    this.redraw(options && options.direct);
    this.fire('change:time', { time: this.getTime(), step: this.key });
  },

  /**
   * helper function, does the same than ``setKey`` but only
   * accepts scalars.
   */
  setStep: function(time) {
    if(time === undefined || time.length !== undefined) {
      throw new Error("setTime only accept scalars");
    }
    this.setKey(time);
  },

  /**
   * transform from animation step to Date object
   * that contains the animation time
   *
   * ``step`` should be between 0 and ``steps - 1``
   */
  stepToTime: function(step) {
    var times = this.provider.getKeySpan();
    var time = times.start + (times.end - times.start)*(step/this.provider.getSteps());
    return new Date(time);
  },

  timeToStep: function(timestamp) {
    if (typeof timestamp === "Date") timestamp = timestamp.getTime();
    if (!this.provider) return 0;
    var times = this.provider.getKeySpan();
    var step = (this.provider.getSteps() * (timestamp - times.start)) / (times.end - times.start);
    return step;
  },

  getStep: function() {
    return this.key;
  },

  /**
   * returns the animation time defined by the data
   * in the defined column. Date object
   */
  getTime: function() {
    return this.stepToTime(this.key);
  },

  /**
   * returns an object with the start and end times
   */
  getTimeSpan: function() {
    return this.provider.getKeySpan();
  },

  /**
   * set the cartocss for the current renderer
   */
  setCartoCSS: function(cartocss) {
    if (this.provider.options.named_map) throw new Error("CartoCSS style on named maps is read-only");
    if (!this.renderer) throw new Error('renderer is not valid');
    var shader = new carto.RendererJS().render(cartocss);
    this.renderer.setShader(shader);

    // provider options
    var options = torque.common.TorqueLayer.optionsFromLayer(shader.findLayer({ name: 'Map' }));
    this.provider.setCartoCSS && this.provider.setCartoCSS(cartocss);
    if(this.provider.setOptions(options)) {
      this._reloadTiles();
    }

    torque.extend(this.options, options);

    // animator options
    if (options.animationDuration) {
      this.animator.duration(options.animationDuration);
    }
    this._clearCaches();
    this.redraw();
    return this;
  },

  /**
   * get active points for a step in active zoom
   * returns a list of bounding boxes [[] , [], []]
   * empty list if there is no active pixels
   */
  getActivePointsBBox: function(step) {
    var positions = [];
    for(var t in this._tiles) {
      var tile = this._tiles[t];
      positions = positions.concat(this.renderer.getActivePointsBBox(tile, step));
    }
    return positions;
  },

  /**
   * return the value for position relative to map coordinates. null for no value
   */
  getValueForPos: function(x, y, step) {
    step = step === undefined ? this.key: step;
    var t, tile, pos, value = null, xx, yy;
    for(t in this._tiles) {
      tile = this._tiles[t];
      pos = this.getTilePos(tile.coord);
      xx = x - pos.x;
      yy = y - pos.y;
      if (xx >= 0 && yy >= 0 && xx < this.renderer.TILE_SIZE && yy <= this.renderer.TILE_SIZE) {
        value = this.renderer.getValueFor(tile, step, xx, yy);
      }
      if (value !== null) {
        return value;
      }
    }
    return null;
  },

  getValueForBBox: function(x, y, w, h) {
    var xf = x + w, yf = y + h, _x=x;
    var sum = 0;
    for(_y = y; _y<yf; _y+=this.options.resolution){
      for(_x = x; _x<xf; _x+=this.options.resolution){
        var thisValue = this.getValueForPos(_x,_y);
        if (thisValue){
          var bb = thisValue.bbox;
          var xy = this._map.latLngToContainerPoint([bb[1].lat, bb[1].lon]);
          if(xy.x < xf && xy.y < yf){
            sum += thisValue.value;
          }
        }
      }
    }
    return sum;
  },

  invalidate: function() {
    this.provider.reload();
  }
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../":10,"./canvas_layer":11,"carto":undefined}],15:[function(require,module,exports){
  function clamp(a, b) {
    return function(t) {
      return Math.max(Math.min(t, b), a);
    };
  }

  function invLinear(a, b) {
    var c = clamp(0, 1.0);
    return function(t) {
      return c((t - a)/(b - a));
    };
  }

  function linear(a, b) {
    var c = clamp(a, b);
    function _linear(t) {
      return c(a*(1.0 - t) + t*b);
    }

    _linear.invert = function() {
      return invLinear(a, b);
    };

    return _linear;
  }

module.exports = {
    clamp: clamp,
    linear: linear,
    invLinear: invLinear
};

},{}],16:[function(require,module,exports){
var Point = function(x, y) {
  this.x = x || 0;
  this.y = y || 0;
};

function clamp(value, optMin, optMax) {
  if (optMin !== null) value = Math.max(value, optMin);
  if (optMax !== null) value = Math.min(value, optMax);
  return value;
}

function degreesToRadians(deg) {
  return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
  return rad / (Math.PI / 180);
}


var MercatorProjection = function() {
//  this._tileSize = L.Browser.retina ? 512 : 256;
  this._tileSize = 256;
  this._pixelOrigin = new Point(this._tileSize / 2, this._tileSize / 2);
  this._pixelsPerLonDegree = this._tileSize / 360;
  this._pixelsPerLonRadian = this._tileSize / (2 * Math.PI);
};

MercatorProjection.prototype._fromLatLonToPoint = function(lat, lon) {
  var point = new Point(0, 0);
  var origin = this._pixelOrigin;

  point.x = origin.x + lon * this._pixelsPerLonDegree;

  // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
  // 89.189.  This is about a third of a tile past the edge of the world
  // tile.
  var siny = clamp(Math.sin(degreesToRadians(lat)), -0.9999, 0.9999);
  point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -this._pixelsPerLonRadian;
  return point;
};

MercatorProjection.prototype._fromPointToLatLon = function(point) {
  var me = this;
  var origin = me._pixelOrigin;
  var lon = (point.x - origin.x) / me._pixelsPerLonDegree;
  var latRadians = (point.y - origin.y) / -me._pixelsPerLonRadian;
  var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
  return { lat:lat, lon:lon };
};

MercatorProjection.prototype._tilePixelPos = function(tileX, tileY) {
  return {
    x: tileX*this._tileSize,
    y: tileY*this._tileSize
  };
};

MercatorProjection.prototype.tilePixelBBox = function(x, y, zoom, px, py, res) {
  res = res || 1.0;
  var numTiles = 1 <<zoom;
  var inc = res/numTiles;
  px = (x*this._tileSize + px)/numTiles;
  py = (y*this._tileSize + py)/numTiles;
  return [
    this._fromPointToLatLon(new Point(px, py + inc)),
    this._fromPointToLatLon(new Point(px + inc, py))
  ];
};

MercatorProjection.prototype.tileBBox = function(x, y, zoom, bufferSize) {
  var numTiles = 1 <<zoom;
  bufferSize = bufferSize || 0;
  var inc =  (this._tileSize + bufferSize*2)/numTiles;
  var px = (x*this._tileSize - bufferSize  )/numTiles;
  var py = (y*this._tileSize - bufferSize  )/numTiles;
  return [
    this._fromPointToLatLon(new Point(px, py + inc)),
    this._fromPointToLatLon(new Point(px + inc, py))
  ];
};

MercatorProjection.prototype.latLonToTilePoint = function(lat, lon, tileX, tileY, zoom) {
  var numTiles = 1 <<zoom;
  var worldCoordinate = this._fromLatLonToPoint(lat, lon);
  var pixelCoordinate = new Point(worldCoordinate.x*numTiles, worldCoordinate.y*numTiles);
  var tilePixelPos    = this._tilePixelPos(tileX, tileY);
  return new Point(Math.round(pixelCoordinate.x-tilePixelPos.x), Math.round(pixelCoordinate.y-tilePixelPos.y));
};

module.exports = MercatorProjection;

},{}],17:[function(require,module,exports){
/*
# metrics profiler

## timing

```
 var timer = Profiler.metric('resource:load')
 time.start();
 ...
 time.end();
```

## counters

```
 var counter = Profiler.metric('requests')
 counter.inc();   // 1
 counter.inc(10); // 11
 counter.dec()    // 10
 counter.dec(10)  // 0
```

## Calls per second
```
  var fps = Profiler.metric('fps')
  function render() {
    fps.mark();
  }
```
*/
var MAX_HISTORY = 1024;
function Profiler() {}
Profiler.metrics = {};

Profiler.get = function(name) {
  return Profiler.metrics[name] || {
    max: 0,
    min: Number.MAX_VALUE,
    avg: 0,
    total: 0,
    count: 0,
    history: typeof(Float32Array) !== 'undefined' ? new Float32Array(MAX_HISTORY) : []
  };
};

Profiler.new_value = function (name, value) {
  var t = Profiler.metrics[name] = Profiler.get(name);

  t.max = Math.max(t.max, value);
  t.min = Math.min(t.min, value);
  t.total += value;
  ++t.count;
  t.avg = t.total / t.count;
  t.history[t.count%MAX_HISTORY] = value;
};

Profiler.print_stats = function () {
  for (k in Profiler.metrics) {
    var t = Profiler.metrics[k];
    console.log(" === " + k + " === ");
    console.log(" max: " + t.max);
    console.log(" min: " + t.min);
    console.log(" avg: " + t.avg);
    console.log(" count: " + t.count);
    console.log(" total: " + t.total);
  }
};

function Metric(name) {
  this.t0 = null;
  this.name = name;
  this.count = 0;
}

Metric.prototype = {

  //
  // start a time measurement
  //
  start: function() {
    this.t0 = +new Date();
    return this;
  },

  // elapsed time since start was called
  _elapsed: function() {
    return +new Date() - this.t0;
  },

  //
  // finish a time measurement and register it
  // ``start`` should be called first, if not this 
  // function does not take effect
  //
  end: function() {
    if (this.t0 !== null) {
      Profiler.new_value(this.name, this._elapsed());
      this.t0 = null;
    }
  },

  //
  // increments the value 
  // qty: how many, default = 1
  //
  inc: function(qty) {
    qty = qty === undefined ? 1: qty;
    Profiler.new_value(this.name, Profiler.get(this.name).count + (qty ? qty: 0));
  },

  //
  // decrements the value 
  // qty: how many, default = 1
  //
  dec: function(qty) {
    qty = qty === undefined ? 1: qty;
    this.inc(-qty);
  },

  //
  // measures how many times per second this function is called
  //
  mark: function() {
    ++this.count;
    if(this.t0 === null) {
      this.start();
      return;
    }
    var elapsed = this._elapsed();
    if(elapsed > 1) {
      Profiler.new_value(this.name, this.count);
      this.count = 0;
      this.start();
    }
  }
};

Profiler.metric = function(name) {
  return new Metric(name);
};

module.exports = Profiler;

},{}],18:[function(require,module,exports){
module.exports = {
    json: require('./json'),
    JsonArray: require('./jsonarray'),
    windshaft: require('./windshaft')
};

},{"./json":19,"./jsonarray":20,"./windshaft":21}],19:[function(require,module,exports){
var torque = require('../');
var Profiler = require('../profiler');

  var Uint8Array = torque.types.Uint8Array;
  var Int32Array = torque.types.Int32Array;
  var Uint32Array = torque.types.Uint32Array;

  // format('hello, {0}', 'rambo') -> "hello, rambo"
  function format(str) {
    for(var i = 1; i < arguments.length; ++i) {
      var attrs = arguments[i];
      for(var attr in attrs) {
        str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
      }
    }
    return str;
  }

  var json = function (options) {
    this._ready = false;
    this._tileQueue = [];
    this.options = options;

    this.options.is_time = this.options.is_time === undefined ? true: this.options.is_time;
    this.options.tiler_protocol = options.tiler_protocol || 'http';
    this.options.tiler_domain = options.tiler_domain || 'cartodb.com';
    this.options.tiler_port = options.tiler_port || 80;

    if (this.options.data_aggregation) {
      this.options.cumulative = this.options.data_aggregation === 'cumulative';
    }

    // check options
    if (options.resolution === undefined ) throw new Error("resolution should be provided");
    if (options.steps === undefined ) throw new Error("steps should be provided");
    if(options.start === undefined) {
      this._fetchKeySpan();
    } else {
      this._setReady(true);
    }
  };

  json.prototype = {

    /**
     * return the torque tile encoded in an efficient javascript
     * structure:
     * {
     *   x:Uint8Array x coordinates in tile reference system, normally from 0-255
     *   y:Uint8Array y coordinates in tile reference system
     *   Index: Array index to the properties
     * }
     */
    proccessTile: function(rows, coord, zoom) {
      var r;
      var x = new Uint8Array(rows.length);
      var y = new Uint8Array(rows.length);

      var prof_mem = Profiler.metric('ProviderJSON:mem');
      var prof_point_count = Profiler.metric('ProviderJSON:point_count');
      var prof_process_time = Profiler.metric('ProviderJSON:process_time').start()

      // count number of dates
      var dates = 0;
      var maxDateSlots = -1;
      for (r = 0; r < rows.length; ++r) {
        var row = rows[r];
        dates += row.dates__uint16.length;
        for(var d = 0; d < row.dates__uint16.length; ++d) {
          maxDateSlots = Math.max(maxDateSlots, row.dates__uint16[d]);
        }
      }

      if(this.options.cumulative) {
        dates = (1 + maxDateSlots) * rows.length;
      }

      var type = this.options.cumulative ? Uint32Array: Uint8Array;

      // reserve memory for all the dates
      var timeIndex = new Int32Array(maxDateSlots + 1); //index-size
      var timeCount = new Int32Array(maxDateSlots + 1);
      var renderData = new (this.options.valueDataType || type)(dates);
      var renderDataPos = new Uint32Array(dates);

      prof_mem.inc(
        4 * maxDateSlots + // timeIndex
        4 * maxDateSlots + // timeCount
        dates + //renderData
        dates * 4
      ); //renderDataPos

      prof_point_count.inc(rows.length);

      var rowsPerSlot = {};

      // precache pixel positions
      for (var r = 0; r < rows.length; ++r) {
        var row = rows[r];
        x[r] = row.x__uint8 * this.options.resolution;
        // fix value when it's in the tile EDGE
        // TODO: this should be fixed in SQL query
        if (row.y__uint8 === -1) {
          y[r] = 0;
        } else {
          y[r] = row.y__uint8 * this.options.resolution;
        }

        var dates = row.dates__uint16;
        var vals = row.vals__uint8;
        if (!this.options.cumulative) {
          for (var j = 0, len = dates.length; j < len; ++j) {
              var rr = rowsPerSlot[dates[j]] || (rowsPerSlot[dates[j]] = []);
              if(this.options.cumulative) {
                  vals[j] += prev_val;
              }
              prev_val = vals[j];
              rr.push([r, vals[j]]);
          }
        } else {
          var valByDate = {}
          for (var j = 0, len = dates.length; j < len; ++j) {
            valByDate[dates[j]] = vals[j];
          }
          var accum = 0;

          // extend the latest to the end
          for (var j = dates[0]; j <= maxDateSlots; ++j) {
              var rr = rowsPerSlot[j] || (rowsPerSlot[j] = []);
              var v = valByDate[j];
              if (v) {
                accum += v;
              }
              rr.push([r, accum]);
          }

          /*var lastDateSlot = dates[dates.length - 1];
          for (var j = lastDateSlot + 1; j <= maxDateSlots; ++j) {
            var rr = rowsPerSlot[j] || (rowsPerSlot[j] = []);
            rr.push([r, prev_val]);
          }
          */
        }

      }

      // for each timeslot search active buckets
      var renderDataIndex = 0;
      var timeSlotIndex = 0;
      var i = 0;
      for(var i = 0; i <= maxDateSlots; ++i) {
        var c = 0;
        var slotRows = rowsPerSlot[i]
        if(slotRows) {
          for (var r = 0; r < slotRows.length; ++r) {
            var rr = slotRows[r];
            ++c;
            renderDataPos[renderDataIndex] = rr[0]
            renderData[renderDataIndex] = rr[1];
            ++renderDataIndex;
          }
        }
        timeIndex[i] = timeSlotIndex;
        timeCount[i] = c;
        timeSlotIndex += c;
      }

      prof_process_time.end();

      return {
        x: x,
        y: y,
        z: zoom,
        coord: {
          x: coord.x,
          y: coord.y,
          z: zoom
        },
        timeCount: timeCount,
        timeIndex: timeIndex,
        renderDataPos: renderDataPos,
        renderData: renderData,
        maxDate: maxDateSlots
      };
    },

    _host: function() {
      var opts = this.options;
      var port = opts.sql_api_port;
      var domain = ((opts.user_name || opts.user) + '.' + (opts.sql_api_domain || 'cartodb.com')) + (port ? ':' + port: '');
      var protocol = opts.sql_api_protocol || 'http';
      return this.options.url || protocol + '://' + domain + '/api/v2/sql';
    },

    url: function(subhost) {
      var opts = this.options;
      var protocol = opts.sql_api_protocol || 'http';
      if (!this.options.cdn_url) {
        return this._host();
      }
      var h = protocol+ "://";
      if (subhost) {
        h += subhost + ".";
      }
      var cdn_host = opts.cdn_url;
      if(!cdn_host.http && !cdn_host.https) {
        throw new Error("cdn_host should contain http and/or https entries");
      }
      h += cdn_host[protocol] + "/" + (opts.user_name || opts.user) + '/api/v2/sql';
      return h;
    },

    _hash: function(str) {
      var hash = 0;
      if (!str || str.length == 0) return hash;
      for (var i = 0, l = str.length; i < l; ++i) {
          hash = (( (hash << 5 ) - hash ) + str.charCodeAt(i)) | 0;
      }
      return hash;
    },

    _extraParams: function() {
      if (this.options.extra_params) {
        var p = [];
        for(var k in this.options.extra_params) {
          var v = this.options.extra_params[k];
          if (v) {
            p.push(k + "=" + encodeURIComponent(v));
          }
        }
        return p.join('&');
      }
      return null;
    },

    isHttps: function() {
      return this.options.sql_api_protocol && this.options.sql_api_protocol === 'https';
    },

    // execute actual query
    sql: function(sql, callback, options) {
      options = options || {};
      var subdomains = this.options.subdomains || '0123';
      if(this.isHttps()) {
        subdomains = [null]; // no subdomain
      }


      var url;
      if (options.no_cdn) {
        url = this._host();
      } else {
        url = this.url(subdomains[Math.abs(this._hash(sql))%subdomains.length]);
      }
      var extra = this._extraParams();
      torque.net.get( url + "?q=" + encodeURIComponent(sql) + (extra ? "&" + extra: ''), function (data) {
          if(options.parseJSON) {
            data = JSON.parse(data && data.responseText);
          }
          callback && callback(data);
      });
    },

    getTileData: function(coord, zoom, callback) {
      if(!this._ready) {
        this._tileQueue.push([coord, zoom, callback]);
      } else {
        this._getTileData(coord, zoom, callback);
      }
    },

    _setReady: function(ready) {
      this._ready = true;
      this._processQueue();
      this.options.ready && this.options.ready();
    },

    _processQueue: function() {
      var item;
      while (item = this._tileQueue.pop()) {
        this._getTileData.apply(this, item);
      }
    },

    /**
     * `coord` object like {x : tilex, y: tiley }
     * `zoom` quadtree zoom level
     */
    _getTileData: function(coord, zoom, callback) {
      var prof_fetch_time = Profiler.metric('ProviderJSON:tile_fetch_time').start()
      this.table = this.options.table;
      var numTiles = 1 << zoom;

      var column_conv = this.options.column;

      if(this.options.is_time) {
        column_conv = format("date_part('epoch', {column})", this.options);
      }

      var sql = "" +
        "WITH " +
        "par AS (" +
        "  SELECT CDB_XYZ_Resolution({zoom})*{resolution} as res" +
        ",  256/{resolution} as tile_size" +
        ", CDB_XYZ_Extent({x}, {y}, {zoom}) as ext "  +
        ")," +
        "cte AS ( "+
        "  SELECT ST_SnapToGrid(i.the_geom_webmercator, p.res) g" +
        ", {countby} c" +
        ", floor(({column_conv} - {start})/{step}) d" +
        "  FROM ({_sql}) i, par p " +
        "  WHERE i.the_geom_webmercator && p.ext " +
        "  GROUP BY g, d" +
        ") " +
        "" +
        "SELECT (st_x(g)-st_xmin(p.ext))/p.res x__uint8, " +
        "       (st_y(g)-st_ymin(p.ext))/p.res y__uint8," +
        " array_agg(c) vals__uint8," +
        " array_agg(d) dates__uint16" +
        // the tile_size where are needed because the overlaps query in cte subquery includes the points
        // in the left and bottom borders of the tile
        " FROM cte, par p where (st_y(g)-st_ymin(p.ext))/p.res < tile_size and (st_x(g)-st_xmin(p.ext))/p.res < tile_size GROUP BY x__uint8, y__uint8";


      var query = format(sql, this.options, {
        zoom: zoom,
        x: coord.x,
        y: coord.y,
        column_conv: column_conv,
        _sql: this.getSQL()
      });

      var self = this;
      this.sql(query, function (data) {
        if (data) {
          var rows = JSON.parse(data.responseText).rows;
          callback(self.proccessTile(rows, coord, zoom));
        } else {
          callback(null);
        }
        prof_fetch_time.end();
      });
    },

    getKeySpan: function() {
      return {
        start: this.options.start * 1000,
        end: this.options.end * 1000,
        step: this.options.step,
        steps: this.options.steps,
        columnType: this.options.is_time ? 'date': 'number'
      };
    },

    setColumn: function(column, isTime) {
      this.options.column = column;
      this.options.is_time = isTime === undefined ? true: false;
      this.reload();
    },

    setResolution: function(res) {
      this.options.resolution = res;
    },

    // return true if tiles has been changed
    setOptions: function(opt) {
      var refresh = false;

      if(opt.resolution !== undefined && opt.resolution !== this.options.resolution) {
        this.options.resolution = opt.resolution;
        refresh = true;
      }

      if(opt.steps !== undefined && opt.steps !== this.options.steps) {
        this.setSteps(opt.steps, { silent: true });
        refresh = true;
      }

      if(opt.column !== undefined && opt.column !== this.options.column) {
        this.options.column = opt.column;
        refresh = true;
      }

      if(opt.countby !== undefined && opt.countby !== this.options.countby) {
        this.options.countby = opt.countby;
        refresh = true;
      }

      if(opt.data_aggregation !== undefined) {
        var c = opt.data_aggregation === 'cumulative';
        if (this.options.cumulative !== c) {
          this.options.cumulative = c;
          refresh = true;
        }
      }

      if (refresh) this.reload();
      return refresh;

    },

    reload: function() {
      this._ready = false;
      this._fetchKeySpan();
    },

    setSQL: function(sql) {
      if (this.options.sql != sql) {
        this.options.sql = sql;
        this.reload();
      }
    },

    getSteps: function() {
      return Math.min(this.options.steps, this.options.data_steps);
    },

    setSteps: function(steps, opt) {
      opt = opt || {};
      if (this.options.steps !== steps) {
        this.options.steps = steps;
        this.options.step = (this.options.end - this.options.start)/this.getSteps();
        this.options.step = this.options.step || 1;
        if (!opt.silent) this.reload();
      }
    },

    getBounds: function() {
      return this.options.bounds;
    },

    getSQL: function() {
      return this.options.sql || "select * from " + this.options.table;
    },

    _tilerHost: function() {
      var opts = this.options;
      var user = (opts.user_name || opts.user);
      return opts.tiler_protocol +
           "://" + (user ? user + "." : "")  +
           opts.tiler_domain +
           ((opts.tiler_port != "") ? (":" + opts.tiler_port) : "");
    },

    _fetchUpdateAt: function(callback) {
      var self = this;
      var layergroup = {
        "version": "1.0.1",
        "stat_tag": this.options.stat_tag || 'torque',
        "layers": [{
          "type": "cartodb",
          "options": {
            "cartocss_version": "2.1.1", 
            "cartocss": "#layer {}",
            "sql": this.getSQL()
          }
        }]
      };
      var url = this._tilerHost() + "/tiles/layergroup";
      var extra = this._extraParams();

      // tiler needs map_key instead of api_key
      // so replace it
      if (extra) {
        extra = extra.replace('api_key=', 'map_key=');
      }

      url = url +
        "?config=" + encodeURIComponent(JSON.stringify(layergroup)) +
        "&callback=?" + (extra ? "&" + extra: '');

      torque.net.jsonp(url, function (data) {
        var query = format("select * from ({sql}) __torque_wrap_sql limit 0", { sql: self.getSQL() });
        self.sql(query, function (queryData) {
          if (data && queryData) {
            callback({
              updated_at: data.last_updated,
              fields: queryData.fields
            });
          }
        }, { parseJSON: true });
      });
    },

    //
    // the data range could be set by the user though ``start``
    // option. It can be fecthed from the table when the start
    // is not specified.
    //
    _fetchKeySpan: function() {
      var self = this;
      var max_col, min_col, max_tmpl, min_tmpl;

      this._fetchUpdateAt(function(data) {
        if (!data) return;
        self.options.extra_params = self.options.extra_params || {};
        self.options.extra_params.last_updated = data.updated_at || 0;
        self.options.extra_params.cache_policy = 'persist';
        self.options.is_time = data.fields[self.options.column].type === 'date';

        var column_conv = self.options.column;
        if (self.options.is_time){
          max_tmpl = "date_part('epoch', max({column}))";
          min_tmpl = "date_part('epoch', min({column}))";
          column_conv = format("date_part('epoch', {column})", self.options);
        } else {
          max_tmpl = "max({column})";
          min_tmpl = "min({column})";
        }

        max_col = format(max_tmpl, { column: self.options.column });
        min_col = format(min_tmpl, { column: self.options.column });

        /*var sql_stats = "" +
        "WITH summary_groups as ( " +
          "WITH summary as ( " +
           "select   (row_number() over (order by __time_col asc nulls last)+1)/2 as rownum, __time_col " +
            "from (select *, {column} as __time_col from ({sql}) __s) __torque_wrap_sql " +
            "order by __time_col asc " +
          ") " +
          "SELECT " +
          "max(__time_col) OVER(PARTITION BY rownum) -  " +
          "min(__time_col) OVER(PARTITION BY rownum) diff " +
          "FROM summary " +
        "), subq as ( " +
        " SELECT " +
            "st_xmax(st_envelope(st_collect(the_geom))) xmax, " +
            "st_ymax(st_envelope(st_collect(the_geom))) ymax, " +
            "st_xmin(st_envelope(st_collect(the_geom))) xmin, " +
            "st_ymin(st_envelope(st_collect(the_geom))) ymin, " +
            "{max_col} max, " +
            "{min_col} min FROM  ({sql}) __torque_wrap_sql " +
        ")" +
        "SELECT " +
        "xmax, xmin, ymax, ymin, a.max as max_date, a.min as min_date, " +
        "avg(diff) as diffavg," +
        "(a.max - a.min)/avg(diff) as num_steps " +
        "FROM summary_groups, subq a  " +
        "WHERE diff > 0 group by xmax, xmin, ymax, ymin, max_date, min_date";
        */
        var sql_stats = " SELECT " +
            "st_xmax(st_envelope(st_collect(the_geom))) xmax, " +
            "st_ymax(st_envelope(st_collect(the_geom))) ymax, " +
            "st_xmin(st_envelope(st_collect(the_geom))) xmin, " +
            "st_ymin(st_envelope(st_collect(the_geom))) ymin, " +
            "count(*) as num_steps, " +
            "{max_col} max_date, " +
            "{min_col} min_date FROM  ({sql}) __torque_wrap_sql ";

        var sql = format(sql_stats, {
          max_col: max_col,
          min_col: min_col,
          column: column_conv,
          sql: self.getSQL()
        });

        self.sql(sql, function(data) {
          //TODO: manage bounds
          data = data.rows[0];
          self.options.start = data.min_date;
          self.options.end = data.max_date;
          self.options.step = (data.max_date - data.min_date)/Math.min(self.options.steps, data.num_steps>>0);
          self.options.data_steps = data.num_steps >> 0;
          // step can't be 0
          self.options.step = self.options.step || 1;
          self.options.bounds = [
            [data.ymin, data.xmin],
            [data.ymax, data.xmax]
          ];
          self._setReady(true);
        }, { parseJSON: true, no_cdn: true });
      }, { parseJSON: true, no_cdn: true})
    }

  };

module.exports = json;

},{"../":10,"../profiler":17}],20:[function(require,module,exports){
var torque = require('../');
var Profiler = require('../profiler');

  var Uint8Array = torque.types.Uint8Array;
  var Int32Array = torque.types.Int32Array;
  var Uint32Array = torque.types.Uint32Array;

  // format('hello, {0}', 'rambo') -> "hello, rambo"
  function format(str, attrs) {
    for(var i = 1; i < arguments.length; ++i) {
      var attrs = arguments[i];
      for(var attr in attrs) {
        str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
      }
    }
    return str;
  }

  var json = function (options) {
    // check options
    this.options = options;
  };


  json.prototype = {

    //
    // return the data aggregated by key:
    // {
    //  key0: 12,
    //  key1: 32
    //  key2: 25
    // }
    //
    aggregateByKey: function(rows) {
      function getKeys(row) {
        var HEADER_SIZE = 3;
        var valuesCount = row.data[2];
        var keys = {};
        for (var s = 0; s < valuesCount; ++s) {
          keys[row.data[HEADER_SIZE + s]] = row.data[HEADER_SIZE + valuesCount + s];
        }
        return keys;
      }
      var keys = {};
      for (r = 0; r < rows.length; ++r) {
        var rowKeys = getKeys(rows[r]);
        for(var k in rowKeys) {
          keys[k] = keys[k] || 0;
          keys[k] += rowKeys[k];
        }
      }
      return keys;
    },
    



    /**
     *
     */
    proccessTile: function(rows, coord, zoom) {
      var r;
      var x = new Uint8Array(rows.length);
      var y = new Uint8Array(rows.length);
      var self = this;

      // decode into a javascript strcuture the array
      function decode_row(row) {
        var HEADER_SIZE = 3;
        var o = {
          x: row.data[0] * self.options.resolution,
          y: row.data[1] * self.options.resolution,
          valuesCount: row.data[2],
          times: [],
          values: []
        };
        for (var s = 0; s < o.valuesCount; ++s) {
           o.times.push(row.data[HEADER_SIZE + s]);
           o.values.push(row.data[HEADER_SIZE + o.valuesCount + s]);
        }
        if(self.options.cumulative) {
          for (var s = 1; s < o.valuesCount; ++s) {
           o.values[s] += o.values[s - 1];
          }
        }
        return o
      }

      // decode all the rows
      for (r = 0; r < rows.length; ++r) {
        rows[r] = decode_row(rows[r]);
      }

      // count number of dates
      var dates = 0;
      var maxDateSlots = 0;
      for (r = 0; r < rows.length; ++r) {
        var row = rows[r];
        dates += row.times.length;
        for(var d = 0; d < row.times.length; ++d) {
          maxDateSlots = Math.max(maxDateSlots, row.times[d]);
        }
      }

      // reserve memory for all the dates
      var timeIndex = new Int32Array(maxDateSlots + 1); //index-size
      var timeCount = new Int32Array(maxDateSlots + 1);
      var renderData = new (this.options.valueDataType || Uint8Array)(dates);
      var renderDataPos = new Uint32Array(dates);

      var rowsPerSlot = {};

      // precache pixel positions
      for (var r = 0; r < rows.length; ++r) {
        var row = rows[r];
        x[r] = row.x;
        y[r] = row.y;

        var dates = row.times;
        var vals = row.values;
        for (var j = 0, len = dates.length; j < len; ++j) {
            var rr = rowsPerSlot[dates[j]] || (rowsPerSlot[dates[j]] = []);
            rr.push([r, vals[j]]);
        }
      }

      // for each timeslot search active buckets
      var renderDataIndex = 0;
      var timeSlotIndex = 0;
      var i = 0;
      for(var i = 0; i <= maxDateSlots; ++i) {
        var c = 0;
        var slotRows = rowsPerSlot[i]
        if(slotRows) {
          for (var r = 0; r < slotRows.length; ++r) {
            var rr = slotRows[r];
            ++c;
            renderDataPos[renderDataIndex] = rr[0]
            renderData[renderDataIndex] = rr[1];
            ++renderDataIndex;
          }
        }
        timeIndex[i] = timeSlotIndex;
        timeCount[i] = c;
        timeSlotIndex += c;
      }

      return {
        x: x,
        y: y,
        coord: {
          x: coord.x,
          y: coord.y,
          z: zoom
        },
        timeCount: timeCount,
        timeIndex: timeIndex,
        renderDataPos: renderDataPos,
        renderData: renderData
      };
    },

    url: function() {
      return this.options.url;
    },


    tileUrl: function(coord, zoom) {
      var template = this.url();
      var s = (this.options.subdomains || 'abcd')[(coord.x + coord.y + zoom) % 4];
      return template
        .replace('{x}', coord.x)
        .replace('{y}', coord.y)
        .replace('{z}', zoom)
        .replace('{s}', s);
    },

    getTile: function(coord, zoom, callback) {
      var template = this.tileUrl(coord, zoom);

      var self = this;
      var fetchTime = Profiler.metric('jsonarray:fetch time');
      fetchTime.start();
      torque.net.get(template, function (data) {
        fetchTime.end();
        if(data) {
          data = JSON.parse(data.responseText);
        }
        callback(data);
      });
    },

    /**
     * `coord` object like {x : tilex, y: tiley } 
     * `zoom` quadtree zoom level
     */
    getTileData: function(coord, zoom, callback) {
      var template = this.tileUrl(coord, zoom);

      var self = this;
      var fetchTime = Profiler.metric('jsonarray:fetch time');
      fetchTime.start();
      torque.net.get(template, function (data) {
        fetchTime.end();
        var processed = null;
        
        var processingTime = Profiler.metric('jsonarray:processing time');
        var parsingTime = Profiler.metric('jsonarray:parsing time');
        try {
          processingTime.start();
          parsingTime.start();
          var rows = JSON.parse(data.responseText || data.response).rows;
          parsingTime.end();
          processed = self.proccessTile(rows, coord, zoom);
          processingTime.end();
        } catch(e) {
          console.error("problem parsing JSON on ", coord, zoom);
        }

        callback(processed);

      });
    }

  };

  module.exports = json;

},{"../":10,"../profiler":17}],21:[function(require,module,exports){
  var torque = require('../');
  var Profiler = require('../profiler');

  var Uint8Array = torque.types.Uint8Array;
  var Int32Array = torque.types.Int32Array;
  var Uint32Array = torque.types.Uint32Array;
  var Uint8ClampedArray = torque.types.Uint8ClampedArray;

  // format('hello, {0}', 'rambo') -> "hello, rambo"
  function format(str) {
    for(var i = 1; i < arguments.length; ++i) {
      var attrs = arguments[i];
      for(var attr in attrs) {
        str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
      }
    }
    return str;
  }

  var windshaft = function (options) {
    this._ready = false;
    this._tileQueue = [];
    this.options = options;

    this.options.is_time = this.options.is_time === undefined ? true: this.options.is_time;
    this.options.tiler_protocol = options.tiler_protocol || 'http';
    this.options.tiler_domain = options.tiler_domain || 'cartodb.com';
    this.options.tiler_port = options.tiler_port || 80;

    // backwards compatible
    if (!options.maps_api_template) {
      this._buildMapsApiTemplate(this.options);
    } else {
      this.options.maps_api_template =  options.maps_api_template;
    }

    this.options.coordinates_data_type = this.options.coordinates_data_type || Uint8Array;

    if (this.options.data_aggregation) {
      this.options.cumulative = this.options.data_aggregation === 'cumulative';
    }
    if (this.options.auth_token) {
      var e = this.options.extra_params || (this.options.extra_params = {});
      e.auth_token = this.options.auth_token;
    }
    if (!this.options.no_fetch_map) {
      this._fetchMap();
    }
  };

  windshaft.prototype = {

    /**
     * return the torque tile encoded in an efficient javascript
     * structure:
     * {
     *   x:Uint8Array x coordinates in tile reference system, normally from 0-255
     *   y:Uint8Array y coordinates in tile reference system
     *   Index: Array index to the properties
     * }
     */
    proccessTile: function(rows, coord, zoom) {
      var r;
      var x = new this.options.coordinates_data_type(rows.length);
      var y = new this.options.coordinates_data_type(rows.length);

      var prof_mem = Profiler.metric('torque.provider.windshaft.mem');
      var prof_point_count = Profiler.metric('torque.provider.windshaft.points');
      var prof_process_time = Profiler.metric('torque.provider.windshaft.process_time').start();

      // count number of dates
      var dates = 0;
      var maxDateSlots = -1;
      for (r = 0; r < rows.length; ++r) {
        var row = rows[r];
        dates += row.dates__uint16.length;
        for(var d = 0; d < row.dates__uint16.length; ++d) {
          maxDateSlots = Math.max(maxDateSlots, row.dates__uint16[d]);
        }
      }

      if(this.options.cumulative) {
        dates = (1 + maxDateSlots) * rows.length;
      }

      var type = this.options.cumulative ? Uint32Array: Uint8ClampedArray;

      // reserve memory for all the dates
      var timeIndex = new Int32Array(maxDateSlots + 1); //index-size
      var timeCount = new Int32Array(maxDateSlots + 1);
      var renderData = new (this.options.valueDataType || type)(dates);
      var renderDataPos = new Uint32Array(dates);

      prof_mem.inc(
        4 * maxDateSlots + // timeIndex
        4 * maxDateSlots + // timeCount
        dates + //renderData
        dates * 4
      ); //renderDataPos

      prof_point_count.inc(rows.length);

      var rowsPerSlot = {};

      // precache pixel positions
      for (var r = 0; r < rows.length; ++r) {
        var row = rows[r];
        x[r] = row.x__uint8 * this.options.resolution;
        y[r] = row.y__uint8 * this.options.resolution;

        var dates = row.dates__uint16;
        var vals = row.vals__uint8;
        if (!this.options.cumulative) {
          for (var j = 0, len = dates.length; j < len; ++j) {
              var rr = rowsPerSlot[dates[j]] || (rowsPerSlot[dates[j]] = []);
              if(this.options.cumulative) {
                  vals[j] += prev_val;
              }
              prev_val = vals[j];
              rr.push([r, vals[j]]);
          }
        } else {
          var valByDate = {}
          for (var j = 0, len = dates.length; j < len; ++j) {
            valByDate[dates[j]] = vals[j];
          }
          var accum = 0;

          // extend the latest to the end
          for (var j = dates[0]; j <= maxDateSlots; ++j) {
              var rr = rowsPerSlot[j] || (rowsPerSlot[j] = []);
              var v = valByDate[j];
              if (v) {
                accum += v;
              }
              rr.push([r, accum]);
          }

          /*var lastDateSlot = dates[dates.length - 1];
          for (var j = lastDateSlot + 1; j <= maxDateSlots; ++j) {
            var rr = rowsPerSlot[j] || (rowsPerSlot[j] = []);
            rr.push([r, prev_val]);
          }
          */
        }

      }

      // for each timeslot search active buckets
      var renderDataIndex = 0;
      var timeSlotIndex = 0;
      var i = 0;
      for(var i = 0; i <= maxDateSlots; ++i) {
        var c = 0;
        var slotRows = rowsPerSlot[i]
        if(slotRows) {
          for (var r = 0; r < slotRows.length; ++r) {
            var rr = slotRows[r];
            ++c;
            renderDataPos[renderDataIndex] = rr[0]
            renderData[renderDataIndex] = rr[1];
            ++renderDataIndex;
          }
        }
        timeIndex[i] = timeSlotIndex;
        timeCount[i] = c;
        timeSlotIndex += c;
      }

      prof_process_time.end();

      return {
        x: x,
        y: y,
        z: zoom,
        coord: {
          x: coord.x,
          y: coord.y,
          z: zoom
        },
        timeCount: timeCount,
        timeIndex: timeIndex,
        renderDataPos: renderDataPos,
        renderData: renderData,
        maxDate: maxDateSlots
      };
    },

    /*setCartoCSS: function(c) {
      this.options.cartocss = c;
    },*/

    setSteps: function(steps, opt) { 
      opt = opt || {};
      if (this.options.steps !== steps) {
        this.options.steps = steps;
        this.options.step = (this.options.end - this.options.start)/this.getSteps();
        this.options.step = this.options.step || 1;
        if (!opt.silent) this.reload();
      }
    },

    setOptions: function(opt) {
      var refresh = false;

      if(opt.resolution !== undefined && opt.resolution !== this.options.resolution) {
        this.options.resolution = opt.resolution;
        refresh = true;
      }

      if(opt.steps !== undefined && opt.steps !== this.options.steps) {
        this.setSteps(opt.steps, { silent: true });
        refresh = true;
      }

      if(opt.column !== undefined && opt.column !== this.options.column) {
        this.options.column = opt.column;
        refresh = true;
      }

      if(opt.countby !== undefined && opt.countby !== this.options.countby) {
        this.options.countby = opt.countby;
        refresh = true;
      }

      if(opt.data_aggregation !== undefined) {
        var c = opt.data_aggregation === 'cumulative';
        if (this.options.cumulative !== c) {
          this.options.cumulative = c;
          refresh = true;
        }
      }

      if (refresh) this.reload();
      return refresh;
    },

    _extraParams: function(e) {
      e = torque.extend(torque.extend({}, e), this.options.extra_params);
      if (e) {
        var p = [];
        for(var k in e) {
          var v = e[k];
          if (v) {
            if (torque.isArray(v)) {
              for (var i = 0, len = v.length; i < len; i++) {
                p.push(k + "[]=" + encodeURIComponent(v[i]));
              }
            } else {
              p.push(k + "=" + encodeURIComponent(v));
            }
          }
        }
        return p.join('&');
      }
      return null;
    },

    getTileData: function(coord, zoom, callback) {
      if(!this._ready) {
        this._tileQueue.push([coord, zoom, callback]);
      } else {
        this._getTileData(coord, zoom, callback);
      }
    },

    _setReady: function(ready) {
      this._ready = true;
      this._processQueue();
      this.options.ready && this.options.ready();
    },

    _processQueue: function() {
      var item;
      while (item = this._tileQueue.pop()) {
        this._getTileData.apply(this, item);
      }
    },

    /**
     * `coord` object like {x : tilex, y: tiley }
     * `zoom` quadtree zoom level
     */
    _getTileData: function(coord, zoom, callback) {
      var self = this;
      var prof_fetch_time = Profiler.metric('torque.provider.windshaft.tile.fetch').start();
      var subdomains = this.options.subdomains || '0123';
      var limit_x = Math.pow(2, zoom);
      var corrected_x = ((coord.x % limit_x) + limit_x) % limit_x;
      var index = Math.abs(corrected_x + coord.y) % subdomains.length;
      var url = this.templateUrl
                .replace('{x}', corrected_x)
                .replace('{y}', coord.y)
                .replace('{z}', zoom)
                .replace('{s}', subdomains[index])

      var extra = this._extraParams();
      torque.net.get( url + (extra ? "?" + extra: ''), function (data) {
        prof_fetch_time.end();
        if (data && data.responseText) {
          var rows = JSON.parse(data.responseText);
          callback(self.proccessTile(rows, coord, zoom));
        } else {
          Profiler.metric('torque.provider.windshaft.tile.error').inc();
          callback(null);
        }
      });
    },

    getKeySpan: function() {
      return {
        start: this.options.start,
        end: this.options.end,
        step: this.options.step,
        steps: this.options.steps,
        columnType: this.options.column_type
      };
    },

    setColumn: function(column, isTime) {
      this.options.column = column;
      this.options.is_time = isTime === undefined ? true: false;
      this.reload();
    },

    reload: function() {
      this._ready = false;
      this._fetchMap();
    },

    getSteps: function() {
      return Math.min(this.options.steps, this.options.data_steps);
    },

    getBounds: function() {
      return this.options.bounds;
    },

    getSQL: function() {
      return this.options.sql || "select * from " + this.options.table;
    },

    setSQL: function(sql) {
      if (this.options.sql != sql) {
        this.options.sql = sql;
        this.reload();
      }
    },

    _buildMapsApiTemplate: function(opts) {
       var user = opts.user_name || opts.user;
       opts.maps_api_template = opts.tiler_protocol +
           "://" + ((user) ? "{user}.":"")  +
           opts.tiler_domain +
           ((opts.tiler_port != "") ? (":" + opts.tiler_port) : "");
    },

    _tilerHost: function() {
      var opts = this.options;
      var user = opts.user_name || opts.user;
      return opts.maps_api_template.replace('{user}', user);
    },

    url: function () {
      var opts = this.options;
      var cdn_host = opts.cdn_url;
      var has_empty_cdn = !cdn_host || (cdn_host && (!cdn_host.http && !cdn_host.https));

      if (opts.no_cdn || has_empty_cdn) {
        return this._tilerHost();
      } else {
        var protocol = this.isHttps() ? 'https': 'http';
        var h = protocol + "://";
        if (!this.isHttps()) {
          h += "{s}.";
        }
        var cdn_url = cdn_host[protocol];
        // build default template url if the cdn url is not templatized
        // this is for backwards compatiblity, ideally we should use the url
        // that tiler sends to us right away
        if (!this._isUserTemplateUrl(cdn_url)) {
          cdn_url = cdn_url  + "/{user}";
        }
        var user = opts.user_name || opts.user;
        h += cdn_url.replace('{user}', user)
        return h;
      }

    },

    _isUserTemplateUrl: function(t) {
      return t && t.indexOf('{user}') !== -1;
    },

    isHttps: function() {
      return this.options.maps_api_template.indexOf('https') === 0;
    },

    _generateCartoCSS: function() {
      var attr = {
        '-torque-frame-count': this.options.steps,
        '-torque-resolution': this.options.resolution,
        '-torque-aggregation-function': "'" + this.options.countby + "'",
        '-torque-time-attribute': "'" + this.options.column + "'",
        '-torque-data-aggregation': this.options.cumulative ? 'cumulative': 'linear',
      };
      var st = 'Map{';
      for (var k in attr) {
        st += k + ":" + attr[k] + ";";
      }
      return st + "}";
    },

    _fetchMap: function(callback) {
      var self = this;
      var layergroup = {};
      var host = this.options.dynamic_cdn ? this.url().replace('{s}', '0'): this._tilerHost();
      var url = host + "/api/v1/map";
      var named = this.options.named_map;
      var allParams = {};

      if(named) {
        //tiles/template
        url = host + "/api/v1/map/named/" + named.name + "/jsonp";
        if(typeof named.params !== "undefined"){
          layergroup = named.params;
        }
      } else {
        layergroup = {
          "version": "1.0.1",
          "stat_tag": this.options.stat_tag || 'torque',
          "layers": [{
            "type": "torque",
            "options": {
              "cartocss_version": "1.0.0",
              "cartocss": this._generateCartoCSS(),
              "sql": this.getSQL()
            }
          }]
        };
      }
      
      if(this.options.stat_tag){
        allParams["stat_tag"] = this.options.stat_tag;
      }

      extra = this._extraParams(allParams);

      // tiler needs map_key instead of api_key
      // so replace it
      if (extra) {
        extra = extra.replace('api_key=', 'map_key=');
      }

      url = url +
        "?config=" + encodeURIComponent(JSON.stringify(layergroup)) +
        "&callback=?" + (extra ? "&" + extra: '');

      var map_instance_time = Profiler.metric('torque.provider.windshaft.layergroup.time').start();
      torque.net.jsonp(url, function (data) {
        map_instance_time.end();
        if (data) {
          if (data.errors){
            self.options.errorCallback && self.options.errorCallback(data.errors);
            return;
          }
          var torque_key = Object.keys(data.metadata.torque)[0]
          var opt = data.metadata.torque[torque_key];
          for(var k in opt) {
            self.options[k] = opt[k];
          }
          // use cdn_url if present
          if (data.cdn_url) {
            var c = self.options.cdn_url = self.options.cdn_url || {};
            c.http = data.cdn_url.http || c.http;
            c.https = data.cdn_url.https || c.https;
          }
          self.templateUrl = self.url() + "/api/v1/map/" + data.layergroupid + "/" + torque_key + "/{z}/{x}/{y}.json.torque";
          self._setReady(true);
        } else {
          Profiler.metric('torque.provider.windshaft.layergroup.error').inc();
        }
      }, { callbackName: self.options.instanciateCallback });
    }

  };

  module.exports = windshaft;

},{"../":10,"../profiler":17}],22:[function(require,module,exports){
  var TAU = Math.PI*2;
  // min value to render a line. 
  // it does not make sense to render a line of a width is not even visible
  var LINEWIDTH_MIN_VALUE = 0.05; 
  var MAX_SPRITE_RADIUS = 255;

  function renderPoint(ctx, st) {
    ctx.fillStyle = st['marker-fill'];
    var pixel_size = st['marker-width'];

    // render a circle
    // TODO: fill and stroke order should depend on the order of the properties
    // in the cartocss.

    // fill
    ctx.beginPath();
    ctx.arc(0, 0, pixel_size, 0, TAU, true, true);
    ctx.closePath();

    if (st['marker-opacity'] !== undefined )  st['marker-fill-opacity'] = st['marker-line-opacity'] = st['marker-opacity'];

    if (st['marker-fill']) {
        ctx.globalAlpha = st['marker-fill-opacity'] >= 0? st['marker-fill-opacity']: 1;

      if (ctx.globalAlpha > 0) {
        ctx.fill();
      }
    }

    // stroke
    if (st['marker-line-color'] && st['marker-line-width'] && st['marker-line-width'] > LINEWIDTH_MIN_VALUE) {
      ctx.globalAlpha = st['marker-line-opacity'] >= 0? st['marker-line-opacity']: 1;
      if (st['marker-line-width'] !== undefined) {
        ctx.lineWidth = st['marker-line-width'];
      }
      ctx.strokeStyle = st['marker-line-color'];

      // do not render for alpha = 0
      if (ctx.globalAlpha > 0) {
        ctx.stroke();
      }
    }
  }

  function renderRectangle(ctx, st) {
    ctx.fillStyle = st['marker-fill'];
    var pixel_size = st['marker-width'];
    var w = pixel_size * 2;

    // fill
    if (st['marker-fill']) {
      if (st['marker-fill-opacity'] !== undefined || st['marker-opacity'] !== undefined) {
        ctx.globalAlpha = st['marker-fill-opacity'] || st['marker-opacity'];
      }
      ctx.fillRect(-pixel_size, -pixel_size, w, w)
    }

    // stroke
    ctx.globalAlpha = 1.0;
    if (st['marker-line-color'] && st['marker-line-width']) {
      if (st['marker-line-opacity']) {
        ctx.globalAlpha = st['marker-line-opacity'];
      }
      if (st['marker-line-width']) {
        ctx.lineWidth = st['marker-line-width'];
      }
      ctx.strokeStyle = st['marker-line-color'];

      // do not render for alpha = 0
      if (ctx.globalAlpha > 0) {
        ctx.strokeRect(-pixel_size, -pixel_size, w, w)
      }
    }
  }

  function renderSprite(ctx, img, st) {

    if(img.complete){
      if (st['marker-fill-opacity'] !== undefined || st['marker-opacity'] !== undefined) {
        ctx.globalAlpha = st['marker-fill-opacity'] || st['marker-opacity'];
      }
      ctx.drawImage(img, 0, 0, Math.min(img.width, MAX_SPRITE_RADIUS), Math.min(img.height, MAX_SPRITE_RADIUS));
    }
  }

module.exports = {
    renderPoint: renderPoint,
    renderSprite: renderSprite,
    renderRectangle: renderRectangle,
    MAX_SPRITE_RADIUS: MAX_SPRITE_RADIUS
};

},{}],23:[function(require,module,exports){
module.exports = {
    cartocss: require('./cartocss_render'),
    Point: require('./point'),
    Rectangle: require('./rectangle')
};
},{"./cartocss_render":22,"./point":24,"./rectangle":25}],24:[function(require,module,exports){
(function (global){
var torque = require('../');
var cartocss = require('./cartocss_render');
var Profiler = require('../profiler');
var carto = global.carto || require('carto');
var Filters = require('./torque_filters');

  var TAU = Math.PI * 2;
  var DEFAULT_CARTOCSS = [
    '#layer {',
    '  marker-fill: #662506;',
    '  marker-width: 4;',
    '  [value > 1] { marker-fill: #FEE391; }',
    '  [value > 2] { marker-fill: #FEC44F; }',
    '  [value > 3] { marker-fill: #FE9929; }',
    '  [value > 4] { marker-fill: #EC7014; }',
    '  [value > 5] { marker-fill: #CC4C02; }',
    '  [value > 6] { marker-fill: #993404; }',
    '  [value > 7] { marker-fill: #662506; }',
    '}'
  ].join('\n');

  var COMP_OP_TO_CANVAS = {
    "src": 'source-over',
    "src-over": 'source-over',
    "dst-over": 'destination-over',
    "src-in": 'source-in',
    "dst-in": 'destination-in',
    "src-out": 'source-out',
    "dst-out": 'destination-out',
    "src-atop": 'source-atop',
    "dst-atop": 'destination-atop',
    "xor": 'xor',
    "darken": 'darken',
    "lighten": 'lighten'
  }

  function compop2canvas(compop) {
    return COMP_OP_TO_CANVAS[compop] || compop;
  }

  //
  // this renderer just render points depending of the value
  //
  function PointRenderer(canvas, options) {
    if (!canvas) {
      throw new Error("canvas can't be undefined");
    }
    this.options = options;
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._sprites = []; // sprites per layer
    this._shader = null;
    this._icons = {};
    this._iconsToLoad = 0;
    this._filters = new Filters(this._canvas, {canvasClass: options.canvasClass});
    this.setCartoCSS(this.options.cartocss || DEFAULT_CARTOCSS);
    this.TILE_SIZE = 256;
    this._style = null;
    this._gradients = {};
    
    this._forcePoints = false;
  }

  torque.extend(PointRenderer.prototype, torque.Event, {

    clearCanvas: function() {
      var canvas = this._canvas;
      var color = this._Map['-torque-clear-color']
      // shortcut for the default value
      if (color  === "rgba(255, 255, 255, 0)" || !color) {
        this._canvas.width = this._canvas.width;
      } else {
        var ctx = this._ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        var compop = this._Map['comp-op']
        ctx.globalCompositeOperation = compop2canvas(compop);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    },

    setCanvas: function(canvas) {
      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
    },

    //
    // sets the cartocss style to render stuff
    //
    setCartoCSS: function(cartocss) {
      // clean sprites
      this.setShader(new carto.RendererJS().render(cartocss));
    },

    setShader: function(shader) {
      // clean sprites
      this._sprites = [];
      this._shader = shader;
      this._Map = this._shader.getDefault().getStyle({}, { zoom: 0 });
      var img_names = this._shader.getImageURLs();
      this._preloadIcons(img_names);
    },

    clearSpriteCache: function() {
      this._sprites = [];
    },


    //
    // generate sprite based on cartocss style
    //
    generateSprite: function(shader, value, shaderVars) {
      var self = this;
      var prof = Profiler.metric('torque.renderer.point.generateSprite').start();
      var st = shader.getStyle({
        value: value
      }, shaderVars);
      if(this._style === null || this._style !== st){
        this._style = st;
      }

      var pointSize = st['marker-width'];
      if (!pointSize) {
        return null;
      }

      if (st['marker-opacity'] === 0 && !st['marker-line-opacity']) {
        return null;
      }

      var canvas = this._createCanvas();
      var ctx = canvas.getContext('2d');

      var markerFile = st["marker-file"] || st["point-file"];
      var qualifiedUrl = markerFile && this._qualifyURL(markerFile);

      if (qualifiedUrl && this._iconsToLoad <= 0 && this._icons[qualifiedUrl]) {
        var img = this._icons[qualifiedUrl];

        var dWidth =  Math.min(st['marker-width'] * 2 || img.width, cartocss.MAX_SPRITE_RADIUS * 2);
        var dHeight = Math.min((st['marker-height'] || dWidth) * (img.width / img.height), cartocss.MAX_SPRITE_RADIUS * 2);

        canvas.width = ctx.width = dWidth;
        canvas.height = ctx.height = dHeight;

        ctx.scale(dWidth/img.width, dHeight/img.height);

        cartocss.renderSprite(ctx, img, st);
      } else {
        // take into account the exterior ring to calculate the size
        var canvasSize = (st['marker-line-width'] || 0) + pointSize*2;
        var w = ctx.width = canvas.width = ctx.height = canvas.height = Math.ceil(canvasSize);
        ctx.translate(w/2, w/2);

        var mt = st['marker-type'];
        if (mt && mt === 'rectangle') {
          cartocss.renderRectangle(ctx, st);
        } else {
          cartocss.renderPoint(ctx, st);
        }
      }
      prof.end(true);
      if (torque.flags.sprites_to_images) {
        var i = this._createImage();
        i.src = canvas.toDataURL();
        return i;
      }
      
      return canvas;
    },

    //
    // renders all the layers (and frames for each layer) from cartocss
    //
    renderTile: function(tile, key, callback) {
      if (this._iconsToLoad > 0) {
          this.on('allIconsLoaded', function() {
              this.renderTile.apply(this, [tile, key, callback]);
          });
          return false;
      }
      var prof = Profiler.metric('torque.renderer.point.renderLayers').start();
      var layers = this._shader.getLayers();
      for(var i = 0, n = layers.length; i < n; ++i ) {
        var layer = layers[i];
        if (layer.name() !== "Map") {
          var sprites = this._sprites[i] || (this._sprites[i] = {});
          // frames for each layer
          for(var fr = 0; fr < layer.frames().length; ++fr) {
            var frame = layer.frames()[fr];
            var fr_sprites = sprites[frame] || (sprites[frame] = []);
            this._renderTile(tile, key - frame, frame, fr_sprites, layer);
          }
        }
      }
      
      prof.end(true);

      return callback && callback(null);
    },

    _createCanvas: function() {
      return this.options.canvasClass
        ? new this.options.canvasClass()
        : document.createElement('canvas');
    },

    _createImage: function() {
      return this.options.imageClass
        ? new this.options.imageClass()
        : new Image();
    },

    _setImageSrc: function(img, url, callback) {
      if (this.options.setImageSrc) {
        this.options.setImageSrc(img, url, callback);
      } else {
        img.onload = function(){
            callback(null);
        };
        img.onerror = function(){
            callback(new Error('Could not load image'));
        };
        img.src = url;
      }
    },

    _qualifyURL: function(url) {
      if (typeof this.options.qualifyURL !== "undefined"){
        return this.options.qualifyURL(url);
      }
      else{
        var a = document.createElement('a');
        a.href = url;
        return a.href;
      }
    },

    //
    // renders a tile in the canvas for key defined in 
    // the torque tile
    //
    _renderTile: function(tile, key, frame_offset, sprites, shader, shaderVars) {
      if (!this._canvas) return;

      var prof = Profiler.metric('torque.renderer.point.renderTile').start();
      var ctx = this._ctx;
      var blendMode = compop2canvas(shader.eval('comp-op')) || this.options.blendmode;
      if (blendMode) {
        ctx.globalCompositeOperation = blendMode;
      }
      if (this.options.cumulative && key > tile.maxDate) {
        //TODO: precache because this tile is not going to change
        key = tile.maxDate;
      }
      var tileMax = this.options.resolution * (this.TILE_SIZE/this.options.resolution - 1)
      var activePixels = tile.timeCount[key];
      var anchor = this.options.resolution/2;
      if (activePixels) {
        var pixelIndex = tile.timeIndex[key];
        for(var p = 0; p < activePixels; ++p) {
          var posIdx = tile.renderDataPos[pixelIndex + p];
          var c = tile.renderData[pixelIndex + p];
          if (c) {
           var sp = sprites[c];
           if (sp === undefined) {
             sp = sprites[c] = this.generateSprite(shader, c, torque.extend({ zoom: tile.z, 'frame-offset': frame_offset }, shaderVars));
           }
           if (sp) {
             var x = tile.x[posIdx]- (sp.width >> 1) + anchor;
             var y = tileMax - tile.y[posIdx] + anchor; // flip mercator
             ctx.drawImage(sp, x, y - (sp.height >> 1));
           }
          }
        }
      }
      

      prof.end(true);
    },

    setBlendMode: function(b) {
      this.options.blendmode = b;
    },

    /**
     * get active points for a step in active zoom
     * returns a list of bounding boxes [[sw, ne] , [], []] where ne is a {lat: .., lon: ...} obj
     * empty list if there is no active pixels
     */
    getActivePointsBBox: function(tile, step) {
      var positions = [];
      var mercator = new torque.Mercator();

      var tileMax = this.options.resolution * (this.TILE_SIZE/this.options.resolution - 1);
      //this.renderer.renderTile(tile, this.key, pos.x, pos.y);
      var activePixels = tile.timeCount[step];
      var pixelIndex = tile.timeIndex[step];
      for(var p = 0; p < activePixels; ++p) {
        var posIdx = tile.renderDataPos[pixelIndex + p];
        var c = tile.renderData[pixelIndex + p];
        if (c) {
         var x = tile.x[posIdx];
         var y = tileMax - tile.y[posIdx]; // flip mercator
         positions.push(mercator.tilePixelBBox(
           tile.coord.x,
           tile.coord.y,
           tile.coord.z,
           x, y
         ));
        }
      }
      return positions;
    },

    // return the value for x, y (tile coordinates)
    // null for no value
    getValueFor: function(tile, step, px, py) {
      var mercator = new torque.Mercator();
      var res = this.options.resolution;
      var res2 = res >> 1;

      var tileMax = this.options.resolution * (this.TILE_SIZE/this.options.resolution - 1);
      //this.renderer.renderTile(tile, this.key, pos.x, pos.y);
      var activePixels = tile.timeCount[step];
      var pixelIndex = tile.timeIndex[step];
      for(var p = 0; p < activePixels; ++p) {
        var posIdx = tile.renderDataPos[pixelIndex + p];
        var c = tile.renderData[pixelIndex + p];
        if (c) {
         var x = tile.x[posIdx];
         var y = tileMax - tile.y[posIdx];
         var dx = px + res2 - x;
         var dy = py + res2 - y;
         if (dx >= 0 && dx < res && dy >= 0 && dy < res) {
           return {
             value: c,
             bbox: mercator.tilePixelBBox(
               tile.coord.x,
               tile.coord.y,
               tile.coord.z,
               x - res2, y - res2, res
             )
           }
         }
        }
      }
      return null;
    },

    _preloadIcons: function(img_names) {
      var self = this;

      if (img_names.length > 0 && !this._forcePoints) {

        var qualifiedImageUrlSet = Object.keys(img_names.reduce(function(imgNamesMap, imgName) {
            var qualifiedUrl = self._qualifyURL(imgName);
            if (!self._icons[qualifiedUrl]) {
                imgNamesMap[qualifiedUrl] = true;
            }
            return imgNamesMap;
        }, {}));

        var filtered = self._shader.getLayers().some(function(layer) {
          return typeof layer.shader["image-filters"] !== "undefined";
        });

        this._iconsToLoad += qualifiedImageUrlSet.length;

        qualifiedImageUrlSet.forEach(function(qualifiedImageUrl) {
          self._icons[qualifiedImageUrl] = null;

          var img = self._createImage();

          if (filtered) {
            img.crossOrigin = 'Anonymous';
          }

          self._setImageSrc(img, qualifiedImageUrl, function(err) {
            if (err) {
              self._forcePoints = true;
              self.clearSpriteCache();
              self._iconsToLoad = 0;
              self.fire("allIconsLoaded");
              if(filtered) {
                console.info("Only CORS-enabled, or same domain image-files can be used in combination with image-filters");
              }
              console.error("Couldn't get marker-file " + qualifiedImageUrl);
            } else {
              self._icons[qualifiedImageUrl] = img;
              self._iconsToLoad--;

              if (self._iconsToLoad <= 0){
                self.clearSpriteCache();
                self.fire("allIconsLoaded");
              }
            }
          });
        });
      } else {
          this.fire("allIconsLoaded");
      }
  },

  applyFilters: function(){
    if(this._style){
      if(this._style['image-filters']){
        function gradientKey(imf){
          var hash = ""
          for(var i = 0; i < imf.args.length; i++){
            var rgb = imf.args[i].rgb;
            hash += rgb[0] + ":" + rgb[1] + ":" + rgb[2];
          }
          return hash;
        }
        var gradient = this._gradients[gradientKey(this._style['image-filters'])];
        if(!gradient){
          function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
          }

          function rgbToHex(r, g, b) {
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
          }
          gradient = {};
          var colorize = this._style['image-filters'].args;
          
          var increment = 1/colorize.length;
          for (var i = 0; i < colorize.length; i++){
            var key = increment * i + increment;
            var rgb = colorize[i].rgb;
            var formattedColor = rgbToHex(rgb[0], rgb[1], rgb[2]);
            gradient[key] = formattedColor;
          }
          this._gradients[gradientKey(this._style['image-filters'])] = gradient;
        }
        this._filters.gradient(gradient);
        this._filters.draw();
      }
    }
  }
});


  // exports public api
module.exports = PointRenderer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../":10,"../profiler":17,"./cartocss_render":22,"./torque_filters":26,"carto":undefined}],25:[function(require,module,exports){
(function (global){
var carto = global.carto || require('carto');

  var DEFAULT_CARTOCSS = [
    '#layer {',
    '  polygon-fill: #FFFF00;',
    '  [value > 10] { polygon-fill: #FFFF00; }',
    '  [value > 100] { polygon-fill: #FFCC00; }',
    '  [value > 1000] { polygon-fill: #FE9929; }',
    '  [value > 10000] { polygon-fill: #FF6600; }',
    '  [value > 100000] { polygon-fill: #FF3300; }',
    '}'
  ].join('\n');

  var TAU = Math.PI * 2;

  //
  // this renderer just render points depending of the value
  // 
  function RectanbleRenderer(canvas, options) {
    this.options = options;
    carto.tree.Reference.set(torque['torque-reference']);
    this.setCanvas(canvas);
    this.setCartoCSS(this.options.cartocss || DEFAULT_CARTOCSS);
  }

  RectanbleRenderer.prototype = {

    //
    // sets the cartocss style to render stuff
    //
    setCartoCSS: function(cartocss) {
      this._cartoCssStyle = new carto.RendererJS().render(cartocss);
      if(this._cartoCssStyle.getLayers().length > 1) {
        throw new Error("only one CartoCSS layer is supported");
      }
      this._shader = this._cartoCssStyle.getLayers()[0].shader;
    },

    setCanvas: function(canvas) {
      if(!canvas) return;
      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
    },

    accumulate: function(tile, keys) {
      var prof = Profiler.metric('RectangleRender:accumulate').start();
      var x, y, posIdx, p, k, key, activePixels, pixelIndex;
      var res = this.options.resolution;
      var s = 256/res;
      var accum = new Float32Array(s*s);

      if(typeof(keys) !== 'object') {
        keys = [keys];
      }

      for(k = 0; k < keys.length; ++k) {
        key = keys[k];
        activePixels = tile.timeCount[key];
        if(activePixels) {
          pixelIndex = tile.timeIndex[key];
          for(p = 0; p < activePixels; ++p) {
            posIdx = tile.renderDataPos[pixelIndex + p];
            x = tile.x[posIdx]/res;
            y = tile.y[posIdx]/res;
            accum[x*s + y] += tile.renderData[pixelIndex + p];
          }
        }
      }

      prof.end();
      return accum;
    },

    renderTileAccum: function(accum, px, py) {
      var prof = Profiler.metric('RectangleRender:renderTileAccum').start();
      var color, x, y, alpha;
      var res = this.options.resolution;
      var ctx = this._ctx;
      var s = (256/res) | 0;
      var s2 = s*s;
      var colors = this._colors;
      if(this.options.blendmode) {
        ctx.globalCompositeOperation = this.options.blendmode;
      }
      var polygon_alpha = this._shader['polygon-opacity'] || function() { return 1.0; };
      for(var i = 0; i < s2; ++i) {
        var xy = i;
        var value = accum[i];
        if(value) {
          x = (xy/s) | 0;
          y = xy % s;
          // by-pass the style generation for improving performance
          color = this._shader['polygon-fill']({ value: value }, { zoom: 0 });
          ctx.fillStyle = color;
          //TODO: each function should have a default value for each 
          //property defined in the cartocss
          alpha = polygon_alpha({ value: value }, { zoom: 0 });
          if(alpha === null) {
            alpha = 1.0;
          }
          ctx.globalAlpha = alpha;
          ctx.fillRect(x * res, 256 - res - y * res, res, res);
        }
      }
      prof.end();
    },

    //
    // renders a tile in the canvas for key defined in 
    // the torque tile
    //
    renderTile: function(tile, key, callback) {
      if(!this._canvas) return;

      var res = this.options.resolution;

      //var prof = Profiler.get('render').start();
      var ctx = this._ctx;
      var colors = this._colors;
      var activepixels = tile.timeCount[key];
      if(activepixels) {
        var w = this._canvas.width;
        var h = this._canvas.height;
        //var imageData = ctx.getImageData(0, 0, w, h);
        //var pixels = imageData.data;
        var pixelIndex = tile.timeIndex[key];
        for(var p = 0; p < activePixels; ++p) {
          var posIdx = tile.renderDataPos[pixelIndex + p];
          var c = tile.renderData[pixelIndex + p];
          if(c) {
           var color = colors[Math.min(c, colors.length - 1)];
           var x = tile.x[posIdx];// + px;
           var y = tile.y[posIdx]; //+ py;

           ctx.fillStyle = color;
           ctx.fillRect(x, y, res, res);
           /*

           for(var xx = 0; xx < res; ++xx) {
            for(var yy = 0; yy < res; ++yy) {
              var idx = 4*((x+xx) + w*(y + yy));
              pixels[idx + 0] = color[0];
              pixels[idx + 1] = color[1];
              pixels[idx + 2] = color[2];
              pixels[idx + 3] = color[3];
            }
           }
           */
          }
        }
        //ctx.putImageData(imageData, 0, 0);
      }
      //prof.end();
      return callback && callback(null);
    }
  };


  // exports public api
module.exports = RectanbleRenderer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"carto":undefined}],26:[function(require,module,exports){
/*
 Based on simpleheat, a tiny JavaScript library for drawing heatmaps with Canvas, 
 by Vladimir Agafonkin
 https://github.com/mourner/simpleheat
*/

'use strict';

function torque_filters(canvas, options) {
    // jshint newcap: false, validthis: true
    if (!(this instanceof torque_filters)) { return new torque_filters(canvas, options); }

    options = options || {};

    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;

    this._max = 1;
    this._data = [];

    this.canvasClass = options.canvasClass;
}

torque_filters.prototype = {

    defaultGradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    },

    gradient: function (grad) {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = this._createCanvas(),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in grad) {
            gradient.addColorStop(+i, grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this._grad = ctx.getImageData(0, 0, 1, 256).data;

        return this;
    },

    draw: function () {
        if (!this._grad) {
            this.gradient(this.defaultGradient);
        }

        var ctx = this._ctx;
        var colored = ctx.getImageData(0, 0, this._canvas.width, this._canvas.height);
        this._colorize(colored.data, this._grad);
        ctx.putImageData(colored, 0, 0);

        return this;
    },

    _colorize: function (pixels, gradient) {
        for (var i = 3, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i] * 4; // get gradient color from opacity value

            if (j) {
                pixels[i - 3] = gradient[j];
                pixels[i - 2] = gradient[j + 1];
                pixels[i - 1] = gradient[j + 2];
            }
        }
    },

    _createCanvas: function() {
        return this.canvasClass
            ? new this.canvasClass()
            : document.createElement('canvas');
    }
};

module.exports = torque_filters;

},{}],27:[function(require,module,exports){
(function (global){
var torque = require('./core');

  var lastCall = null;

  function jsonp(url, callback, options) {
     options = options || {};
     options.timeout = options.timeout === undefined ? 10000: options.timeout;
     var head = document.getElementsByTagName('head')[0];
     var script = document.createElement('script');

     // function name
     var fnName = options.callbackName || 'torque_' + Date.now();

     if (torque.isFunction(fnName)) {
       fnName = fnName();
     }

     function clean() {
       head.removeChild(script);
       clearTimeout(timeoutTimer);
       delete window[fnName];
     }

     window[fnName] = function() {
       clean();
       callback.apply(window, arguments);
     };

     // timeout for errors
     var timeoutTimer = setTimeout(function() { 
       clean();
       callback.call(window, null); 
     }, options.timeout);

     // setup url
     url = url.replace('callback=\?', 'callback=' + fnName);
     script.type = 'text/javascript';
     script.src = url;
     script.async = true;
     // defer the loading because IE9 loads in the same frame the script
     // so Loader._script is null
     setTimeout(function() { head.appendChild(script); }, 0);
  }

  function get(url, callback, options) {
    options = options || {
      method: 'GET',
      data: null,
      responseType: 'text'
    };
    lastCall = { url: url, callback: callback };
    var request = XMLHttpRequest;
    // from d3.js
    if (global.XDomainRequest
        && !("withCredentials" in request)
        && /^(http(s)?:)?\/\//.test(url)) request = XDomainRequest;

    var req = new request();
    req.open(options.method, url, true);


    function respond() {
      var status = req.status, result;
      var r = options.responseType === 'arraybuffer' ? req.response: req.responseText;
      if (!status && r || status >= 200 && status < 300 || status === 304) {
        callback(req);
      } else {
        callback(null);
      }
    }

    "onload" in req
      ? req.onload = req.onerror = respond
      : req.onreadystatechange = function() { req.readyState > 3 && respond(); };

    req.onprogress = function() {};

    req.responseType = options.responseType; //'arraybuffer';
    if (options.data) {
      req.setRequestHeader("Content-type", "application/json");
      //req.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
      req.setRequestHeader("Accept", "*");
    }
    req.send(options.data);
    return req;
  }

  function post(url, data, callback) {
    return get(url, callback, {
      data: data,
      method: "POST"
    });
  }

module.exports = {
    get: get,
    post: post,
    jsonp: jsonp,
    lastCall: function() { return lastCall; }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./core":4}]},{},[10])(10)
});
(function() {

if(typeof(google) == "undefined" || typeof(google.maps) == "undefined")
  return;

var GMapsTorqueLayerView = function(layerModel, gmapsMap) {

  var extra = layerModel.get('extra_params');
  cdb.geo.GMapsLayerView.call(this, layerModel, this, gmapsMap);

  var query = this._getQuery(layerModel);
  torque.GMapsTorqueLayer.call(this, {
      table: layerModel.get('table_name'),
      user: layerModel.get('user_name'),
      column: layerModel.get('property'),
      blendmode: layerModel.get('torque-blend-mode'),
      resolution: 1,
      //TODO: manage time columns
      countby: 'count(cartodb_id)',
      sql_api_domain: layerModel.get('sql_api_domain'),
      sql_api_protocol: layerModel.get('sql_api_protocol'),
      sql_api_port: layerModel.get('sql_api_port'),
      tiler_protocol: layerModel.get('tiler_protocol'),
      tiler_domain: layerModel.get('tiler_domain'),
      tiler_port: layerModel.get('tiler_port'),
      maps_api_template: layerModel.get('maps_api_template'),
      stat_tag: layerModel.get('stat_tag'),
      animationDuration: layerModel.get('torque-duration'),
      steps: layerModel.get('torque-steps'),
      sql: query,
      visible: layerModel.get('visible'),
      extra_params: {
        api_key: extra ? extra.map_key: ''
      },
      map: gmapsMap,
      cartodb_logo: layerModel.get('cartodb_logo'),
      attribution: layerModel.get('attribution'),
      cartocss: layerModel.get('cartocss') || layerModel.get('tile_style'),
      named_map: layerModel.get('named_map'),
      auth_token: layerModel.get('auth_token'),
      no_cdn: layerModel.get('no_cdn'),
      loop: layerModel.get('loop') === false? false: true,
  });

  //this.setCartoCSS(this.model.get('tile_style'));
  if (layerModel.get('visible')) {
    this.play();
  }

};

_.extend(
  GMapsTorqueLayerView.prototype,
  cdb.geo.GMapsLayerView.prototype,
  torque.GMapsTorqueLayer.prototype,
  {

  _update: function() {
    var changed = this.model.changedAttributes();
    if(changed === false) return;
    changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
    if ('query' in changed || 'query_wrapper' in changed) {
      this.setSQL(this._getQuery(this.model));
    }
    if ('visible' in changed) 
      this.model.get('visible') ? this.show(): this.hide();
  },

  _getQuery: function(layerModel) {
    var query = layerModel.get('query');
    var qw = layerModel.get('query_wrapper');
    if(qw) {
      query = _.template(qw)({ sql: query || ('select * from ' + layerModel.get('table_name')) });
    }
    return query;
  },

  refreshView: function() {
    //TODO: update screen
  },

  onAdd: function() {
    torque.GMapsTorqueLayer.prototype.onAdd.apply(this);
    // Add CartoDB logo
    if (this.options.cartodb_logo != false)
      cdb.geo.common.CartoDBLogo.addWadus({ left: 74, bottom:8 }, 2000, this.map.getDiv())
  },

  onTilesLoaded: function() {
    //this.trigger('load');
    Backbone.Events.trigger.call(this, 'load');
  },

  onTilesLoading: function() {
    Backbone.Events.trigger.call(this, 'loading');
  }

});


cdb.geo.GMapsTorqueLayerView = GMapsTorqueLayerView;


})();

(function() {

if(typeof(L) === "undefined") 
  return;

/**
 * leaflet torque layer
 */
var LeafLetTorqueLayer = L.TorqueLayer.extend({

  initialize: function(layerModel, leafletMap) {
    var extra = layerModel.get('extra_params');

    var query = this._getQuery(layerModel);

    // initialize the base layers
    L.TorqueLayer.prototype.initialize.call(this, {
      table: layerModel.get('table_name'),
      user: layerModel.get('user_name'),
      column: layerModel.get('property'),
      blendmode: layerModel.get('torque-blend-mode'),
      resolution: 1,
      //TODO: manage time columns
      countby: 'count(cartodb_id)',
      sql_api_domain: layerModel.get('sql_api_domain'),
      sql_api_protocol: layerModel.get('sql_api_protocol'),
      sql_api_port: layerModel.get('sql_api_port'),
      tiler_protocol: layerModel.get('tiler_protocol'),
      tiler_domain: layerModel.get('tiler_domain'),
      tiler_port: layerModel.get('tiler_port'),
      maps_api_template: layerModel.get('maps_api_template'),
      stat_tag: layerModel.get('stat_tag'),
      animationDuration: layerModel.get('torque-duration'),
      steps: layerModel.get('torque-steps'),
      sql: query,
      visible: layerModel.get('visible'),
      extra_params: {
        api_key: extra ? extra.map_key: ''
      },
      cartodb_logo: layerModel.get('cartodb_logo'),
      attribution: layerModel.get('attribution'),
      cartocss: layerModel.get('cartocss') || layerModel.get('tile_style'),
      named_map: layerModel.get('named_map'),
      auth_token: layerModel.get('auth_token'),
      no_cdn: layerModel.get('no_cdn'),
      dynamic_cdn: layerModel.get('dynamic_cdn'),
      loop: layerModel.get('loop') === false? false: true,
      instanciateCallback: function() {
        var cartocss = layerModel.get('cartocss') || layerModel.get('tile_style');

        return '_cdbct_' + cdb.core.util.uniqueCallbackName(cartocss + query);
      }
    });

    cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);

    // match leaflet events with backbone events
    this.fire = this.trigger;

    //this.setCartoCSS(layerModel.get('tile_style'));
    if (layerModel.get('visible')) {
      this.play();
    }

    this.bind('tilesLoaded', function() {
      this.trigger('load');
    }, this);

    this.bind('tilesLoading', function() {
      this.trigger('loading');
    }, this);

  },

  onAdd: function(map) {
    L.TorqueLayer.prototype.onAdd.apply(this, [map]);
    // Add CartoDB logo
    if (this.options.cartodb_logo != false)
      cdb.geo.common.CartoDBLogo.addWadus({ left:8, bottom:8 }, 0, map._container)
  },

  _getQuery: function(layerModel) {
    var query = layerModel.get('query');
    var qw = layerModel.get('query_wrapper');
    if(qw) {
      query = _.template(qw)({ sql: query || ('select * from ' + layerModel.get('table_name')) });
    }
    return query;
  },

  _modelUpdated: function(model) {
    var changed = this.model.changedAttributes();
    if(changed === false) return;
    changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
    if ('query' in changed || 'query_wrapper' in changed) {
      this.setSQL(this._getQuery(this.model));
    }

    if ('visible' in changed) 
      this.model.get('visible') ? this.show(): this.hide();

  }
});

_.extend(LeafLetTorqueLayer.prototype, cdb.geo.LeafLetLayerView.prototype);

cdb.geo.LeafLetTorqueLayer = LeafLetTorqueLayer;

})();
cdb.geo.ui.TimeSlider = cdb.geo.ui.InfoBox.extend({

  DEFAULT_OFFSET_TOP: 30,
  className: 'cartodb-timeslider',

  defaultTemplate:
    " <ul> " +
    "   <li class='controls'><a href='#/stop' class='button stop'>pause</a></li>" +
    "   <li class='time'><p class='value'></p></li>" +
    "   <li class='last'><div class='slider-wrapper'><div class='slider'></div></div></li>" +
    " </ul> "
  ,

  events: {
    "click .button":  "toggleTime",
    "click .time":    "_onClickTime",
    "dragstart":      "_stopPropagation",
    "mousedown":      "_stopPropagation",
    "touchstart":     "_stopPropagation",
    "MSPointerDown":  "_stopPropagation",
    "dblclick":       "_stopPropagation",
    "mousewheel":     "_stopPropagation",
    "DOMMouseScroll": "_stopPropagation",
    "click":          "_stopPropagation"
  },

  initialize: function() {
    _.bindAll(this, '_stop', '_start', '_slide', '_bindLayer', '_unbindLayer', 'updateSliderRange', 'updateSlider', 'updateTime', 'toggleTime', 'toggleButton');
    var self = this;
    this.options.template = this.options.template || this.defaultTemplate;
    this.options.position = 'bottom|left';
    this.options.width = null;

    // Control variable to know if the layer was
    // running before touching the slider
    this.wasRunning = false;

    this._bindLayer(this.options.layer);

    this.on('clean', this._unbindLayer);
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);

  },

  setLayer: function(layer) {
    this._unbindLayer();
    this._bindLayer(layer);
    this._initSlider();
  },

  _bindLayer: function(layer) {
    this.torqueLayer = layer;
    this.torqueLayer.on('change:time', this.updateSlider);
    this.torqueLayer.on('change:time', this.updateTime);
    this.torqueLayer.on('change:steps', this.updateSliderRange);
    this.torqueLayer.on('play', this.toggleButton);
    this.torqueLayer.on('pause', this.toggleButton);
    return this;
  },

  _unbindLayer: function() {
    this.torqueLayer.off('change:time', this.updateSlider);
    this.torqueLayer.off('change:time', this.updateTime);
    this.torqueLayer.off('change:steps', this.updateSliderRange);
    return this;
  },

  updateSlider: function(changes) {
    this.$(".slider" ).slider({ value: changes.step });
  },

  updateSliderRange: function(changes) {
    if (changes.steps > 1){
      this.show();
      this.$(".slider" ).slider({ max: changes.steps - 1 });
    }
    else{
      this.hide();
    }
  },

  // each time time changes, move the slider
  updateTime: function(changes) {
    var self = this;
    var tb = self.torqueLayer.getTimeBounds();
    if (!tb) return;
    if (tb.columnType === 'date' || this.options.force_format_date) {
      if (tb && tb.start !== undefined) {
        var f = self.options.formatter || this.formatterForRange(tb.start, tb.end);
        // avoid showing invalid dates
        if (!_.isNaN(changes.time.getYear())) {
          self.$('.value').text(f(changes.time, this.torqueLayer));
        }
      }
    } else {
        self.$('.value').text(changes.step);
    }
  },

  formatter: function(_) {
    this.options.formatter = _;
  },

  formatterForRange: function(start, end) {
    start = start.getTime ? start : new Date(start);
    end = end.getTime ? end : new Date(end);
    var range = (end.getTime() - start.getTime()) / 1000;
    var ONE_DAY = 3600*24;
    var THREE_DAYS = ONE_DAY*3;
    var ONE_YEAR = ONE_DAY * 31 * 12;
    if(this.torqueLayer.options){
      var stepDurationMS = (end.getTime() - start.getTime()) / this.torqueLayer.options.steps;
    }

    function pad(n) {
      return n < 10 ? '0' + n : n;
    }

    function toUSDateStr(date) {
      return pad(date.getMonth() + 1) + "/" + pad(date.getDate()) + "/" + pad(date.getFullYear());
    }

    function toTimeStr(date) {
      return pad(date.getHours()) + ":" + pad(date.getMinutes());
    }

    function toDateRange(date, torqueLayer) {
      var stepStartTimeMS = date.getTime();
      var tb = torqueLayer.getTimeBounds();
      var stepDurationMS = (new Date(tb.end).getTime() - new Date(tb.start).getTime()) / torqueLayer.options.steps;
      var stepEndTime = new Date(stepStartTimeMS + stepDurationMS);
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return pad(months[date.getMonth()]) + " " + pad(date.getDate())  + " - " 
        + pad(months[stepEndTime.getMonth()]) + " " + pad(stepEndTime.getDate());
    }

    

    if (range < THREE_DAYS) {
      if (start.getDate() === end.getDate()) {
        return toTimeStr;
      } else {
        // range is less than a day, but the range spans more than one day so render the date in addition to the time
        return function(date) {
          return toUSDateStr(date) +' '+ toTimeStr(date);
        };
      }
    }

    if (range < ONE_YEAR) {
      if (stepDurationMS > ONE_DAY * 2000){ // More than 48 hours
        return toDateRange;
      }
      return toUSDateStr;
    }

    // >= ONE_YEAR
    return function(date) {
      return pad(date.getMonth() + 1) + "/" + pad(date.getFullYear());
    };
  },

  _slide: function(e, ui) {
    this.killEvent(e);
    var step = ui.value;
    this.torqueLayer.setStep(step);
  },

  _start: function(e, ui) {
    if(this.torqueLayer.isRunning()) {
      this.wasRunning = true;
      this.toggleTime();
    }
  },

  _stop: function(e, ui) {
    if (this.wasRunning) {
      this.toggleTime()
    }

    this.wasRunning = false;
  },

  _initSlider: function() {
    var torqueLayer = this.torqueLayer;
    var slider = this.$(".slider");
    slider.slider({
      range: 'min',
      min: 0,
      max: this.torqueLayer.options.steps,
      value: 0,
      step: 1, //
      value: this.torqueLayer.getStep(),
      stop: this._stop,
      start: this._start,
      slide: this._slide
    });
    if(torqueLayer.provider){
      this.updateSliderRange({"steps": torqueLayer.provider.getSteps()});
    }
  },

  toggleTime: function(e) {
    this.killEvent(e);
    this.torqueLayer.toggle();
  },
  toggleButton: function() {
    this.$('.button')
      [(this.torqueLayer.isRunning() ? 'addClass': 'removeClass')]('stop')
      .attr('href','#/' + (this.torqueLayer.isRunning() ? 'pause': 'play'))
      .html(this.torqueLayer.isRunning() ? 'pause': 'play');
  },

  enable: function() {},

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

   _onClickTime: function() {
    this.trigger("time_clicked", this);
  },

  render: function() {
    cdb.geo.ui.InfoBox.prototype.render.apply(this, arguments);
    this._initSlider();
    return this;
  }

});

/*!
 * jQuery UI Core 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/category/ui-core/
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

// $.ui might exist from components with no dependencies, e.g., $.ui.position
$.ui = $.ui || {};

$.extend( $.ui, {
	version: "1.11.4",

	keyCode: {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	}
});

// plugins
$.fn.extend({
	scrollParent: function( includeHidden ) {
		var position = this.css( "position" ),
			excludeStaticParent = position === "absolute",
			overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
			scrollParent = this.parents().filter( function() {
				var parent = $( this );
				if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
					return false;
				}
				return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) + parent.css( "overflow-x" ) );
			}).eq( 0 );

		return position === "fixed" || !scrollParent.length ? $( this[ 0 ].ownerDocument || document ) : scrollParent;
	},

	uniqueId: (function() {
		var uuid = 0;

		return function() {
			return this.each(function() {
				if ( !this.id ) {
					this.id = "ui-id-" + ( ++uuid );
				}
			});
		};
	})(),

	removeUniqueId: function() {
		return this.each(function() {
			if ( /^ui-id-\d+$/.test( this.id ) ) {
				$( this ).removeAttr( "id" );
			}
		});
	}
});

// selectors
function focusable( element, isTabIndexNotNaN ) {
	var map, mapName, img,
		nodeName = element.nodeName.toLowerCase();
	if ( "area" === nodeName ) {
		map = element.parentNode;
		mapName = map.name;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap='#" + mapName + "']" )[ 0 ];
		return !!img && visible( img );
	}
	return ( /^(input|select|textarea|button|object)$/.test( nodeName ) ?
		!element.disabled :
		"a" === nodeName ?
			element.href || isTabIndexNotNaN :
			isTabIndexNotNaN) &&
		// the element and all of its ancestors must be visible
		visible( element );
}

function visible( element ) {
	return $.expr.filters.visible( element ) &&
		!$( element ).parents().addBack().filter(function() {
			return $.css( this, "visibility" ) === "hidden";
		}).length;
}

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo(function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		}) :
		// support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		},

	focusable: function( element ) {
		return focusable( element, !isNaN( $.attr( element, "tabindex" ) ) );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			isTabIndexNaN = isNaN( tabIndex );
		return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
	}
});

// support: jQuery <1.8
if ( !$( "<a>" ).outerWidth( 1 ).jquery ) {
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.css( elem, "padding" + this ) ) || 0;
				if ( border ) {
					size -= parseFloat( $.css( elem, "border" + this + "Width" ) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.css( elem, "margin" + this ) ) || 0;
				}
			});
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each(function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			});
		};

		$.fn[ "outer" + name] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each(function() {
				$( this).css( type, reduce( this, size, true, margin ) + "px" );
			});
		};
	});
}

// support: jQuery <1.8
if ( !$.fn.addBack ) {
	$.fn.addBack = function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	};
}

// support: jQuery 1.6.1, 1.6.2 (http://bugs.jquery.com/ticket/9413)
if ( $( "<a>" ).data( "a-b", "a" ).removeData( "a-b" ).data( "a-b" ) ) {
	$.fn.removeData = (function( removeData ) {
		return function( key ) {
			if ( arguments.length ) {
				return removeData.call( this, $.camelCase( key ) );
			} else {
				return removeData.call( this );
			}
		};
	})( $.fn.removeData );
}

// deprecated
$.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );

$.fn.extend({
	focus: (function( orig ) {
		return function( delay, fn ) {
			return typeof delay === "number" ?
				this.each(function() {
					var elem = this;
					setTimeout(function() {
						$( elem ).focus();
						if ( fn ) {
							fn.call( elem );
						}
					}, delay );
				}) :
				orig.apply( this, arguments );
		};
	})( $.fn.focus ),

	disableSelection: (function() {
		var eventType = "onselectstart" in document.createElement( "div" ) ?
			"selectstart" :
			"mousedown";

		return function() {
			return this.bind( eventType + ".ui-disableSelection", function( event ) {
				event.preventDefault();
			});
		};
	})(),

	enableSelection: function() {
		return this.unbind( ".ui-disableSelection" );
	},

	zIndex: function( zIndex ) {
		if ( zIndex !== undefined ) {
			return this.css( "zIndex", zIndex );
		}

		if ( this.length ) {
			var elem = $( this[ 0 ] ), position, value;
			while ( elem.length && elem[ 0 ] !== document ) {
				// Ignore z-index if position is set to a value where z-index is ignored by the browser
				// This makes behavior of this function consistent across browsers
				// WebKit always returns auto if the element is positioned
				position = elem.css( "position" );
				if ( position === "absolute" || position === "relative" || position === "fixed" ) {
					// IE returns 0 when zIndex is not specified
					// other browsers return a string
					// we ignore the case of nested elements with an explicit value of 0
					// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
					value = parseInt( elem.css( "zIndex" ), 10 );
					if ( !isNaN( value ) && value !== 0 ) {
						return value;
					}
				}
				elem = elem.parent();
			}
		}

		return 0;
	}
});

// $.ui.plugin is deprecated. Use $.widget() extensions instead.
$.ui.plugin = {
	add: function( module, option, set ) {
		var i,
			proto = $.ui[ module ].prototype;
		for ( i in set ) {
			proto.plugins[ i ] = proto.plugins[ i ] || [];
			proto.plugins[ i ].push( [ option, set[ i ] ] );
		}
	},
	call: function( instance, name, args, allowDisconnected ) {
		var i,
			set = instance.plugins[ name ];

		if ( !set ) {
			return;
		}

		if ( !allowDisconnected && ( !instance.element[ 0 ].parentNode || instance.element[ 0 ].parentNode.nodeType === 11 ) ) {
			return;
		}

		for ( i = 0; i < set.length; i++ ) {
			if ( instance.options[ set[ i ][ 0 ] ] ) {
				set[ i ][ 1 ].apply( instance.element, args );
			}
		}
	}
};

}));
/*!
 * jQuery UI Widget 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/jQuery.widget/
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

var widget_uuid = 0,
	widget_slice = Array.prototype.slice;

$.cleanData = (function( orig ) {
	return function( elems ) {
		var events, elem, i;
		for ( i = 0; (elem = elems[i]) != null; i++ ) {
			try {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}

			// http://bugs.jquery.com/ticket/8235
			} catch ( e ) {}
		}
		orig( elems );
	};
})( $.cleanData );

$.widget = function( name, base, prototype ) {
	var fullName, existingConstructor, constructor, basePrototype,
		// proxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		proxiedPrototype = {},
		namespace = name.split( "." )[ 0 ];

	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};
	// extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,
		// copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),
		// track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	});

	basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = (function() {
			var _super = function() {
					return base.prototype[ prop ].apply( this, arguments );
				},
				_superApply = function( args ) {
					return base.prototype[ prop ].apply( this, args );
				};
			return function() {
				var __super = this._super,
					__superApply = this._superApply,
					returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		})();
	});
	constructor.prototype = $.widget.extend( basePrototype, {
		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? (basePrototype.widgetEventPrefix || name) : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	});

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto );
		});
		// remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );

	return constructor;
};

$.widget.extend = function( target ) {
	var input = widget_slice.call( arguments, 1 ),
		inputIndex = 0,
		inputLength = input.length,
		key,
		value;
	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {
				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :
						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );
				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = widget_slice.call( arguments, 1 ),
			returnValue = this;

		if ( isMethodCall ) {
			this.each(function() {
				var methodValue,
					instance = $.data( this, fullName );
				if ( options === "instance" ) {
					returnValue = instance;
					return false;
				}
				if ( !instance ) {
					return $.error( "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'" );
				}
				if ( !$.isFunction( instance[options] ) || options.charAt( 0 ) === "_" ) {
					return $.error( "no such method '" + options + "' for " + name + " widget instance" );
				}
				methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue && methodValue.jquery ?
						returnValue.pushStack( methodValue.get() ) :
						methodValue;
					return false;
				}
			});
		} else {

			// Allow multiple hashes to be passed on init
			if ( args.length ) {
				options = $.widget.extend.apply( null, [ options ].concat(args) );
			}

			this.each(function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} );
					if ( instance._init ) {
						instance._init();
					}
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",
	options: {
		disabled: false,

		// callbacks
		create: null
	},
	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = widget_uuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			});
			this.document = $( element.style ?
				// element within the document
				element.ownerDocument :
				// element is window or document
				element.document || element );
			this.window = $( this.document[0].defaultView || this.document[0].parentWindow );
		}

		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this._create();
		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},
	_getCreateOptions: $.noop,
	_getCreateEventData: $.noop,
	_create: $.noop,
	_init: $.noop,

	destroy: function() {
		this._destroy();
		// we can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.unbind( this.eventNamespace )
			.removeData( this.widgetFullName )
			// support: jquery <1.6.3
			// http://bugs.jquery.com/ticket/9413
			.removeData( $.camelCase( this.widgetFullName ) );
		this.widget()
			.unbind( this.eventNamespace )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetFullName + "-disabled " +
				"ui-state-disabled" );

		// clean up events and states
		this.bindings.unbind( this.eventNamespace );
		this.hoverable.removeClass( "ui-state-hover" );
		this.focusable.removeClass( "ui-state-focus" );
	},
	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key,
			parts,
			curOption,
			i;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {
			// handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( arguments.length === 1 ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( arguments.length === 1 ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				.toggleClass( this.widgetFullName + "-disabled", !!value );

			// If the widget is becoming disabled, then nothing is interactive
			if ( value ) {
				this.hoverable.removeClass( "ui-state-hover" );
				this.focusable.removeClass( "ui-state-focus" );
			}
		}

		return this;
	},

	enable: function() {
		return this._setOptions({ disabled: false });
	},
	disable: function() {
		return this._setOptions({ disabled: true });
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement,
			instance = this;

		// no suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// no element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^([\w:-]*)\s*(.*)$/ ),
				eventName = match[1] + instance.eventNamespace,
				selector = match[2];
			if ( selector ) {
				delegateElement.delegate( selector, eventName, handlerProxy );
			} else {
				element.bind( eventName, handlerProxy );
			}
		});
	},

	_off: function( element, eventName ) {
		eventName = (eventName || "").split( " " ).join( this.eventNamespace + " " ) +
			this.eventNamespace;
		element.unbind( eventName ).undelegate( eventName );

		// Clear the stack to avoid memory leaks (#10056)
		this.bindings = $( this.bindings.not( element ).get() );
		this.focusable = $( this.focusable.not( element ).get() );
		this.hoverable = $( this.hoverable.not( element ).get() );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-hover" );
			},
			mouseleave: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-hover" );
			}
		});
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-focus" );
			},
			focusout: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-focus" );
			}
		});
	},

	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[0], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}
		var hasOptions,
			effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;
		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}
		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;
		if ( options.delay ) {
			element.delay( options.delay );
		}
		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue(function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			});
		}
	};
});

return $.widget;

}));
/*!
 * jQuery UI Mouse 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/mouse/
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([
			"jquery",
			"./widget"
		], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

var mouseHandled = false;
$( document ).mouseup( function() {
	mouseHandled = false;
});

return $.widget("ui.mouse", {
	version: "1.11.4",
	options: {
		cancel: "input,textarea,button,select,option",
		distance: 1,
		delay: 0
	},
	_mouseInit: function() {
		var that = this;

		this.element
			.bind("mousedown." + this.widgetName, function(event) {
				return that._mouseDown(event);
			})
			.bind("click." + this.widgetName, function(event) {
				if (true === $.data(event.target, that.widgetName + ".preventClickEvent")) {
					$.removeData(event.target, that.widgetName + ".preventClickEvent");
					event.stopImmediatePropagation();
					return false;
				}
			});

		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.unbind("." + this.widgetName);
		if ( this._mouseMoveDelegate ) {
			this.document
				.unbind("mousemove." + this.widgetName, this._mouseMoveDelegate)
				.unbind("mouseup." + this.widgetName, this._mouseUpDelegate);
		}
	},

	_mouseDown: function(event) {
		// don't let more than one widget handle mouseStart
		if ( mouseHandled ) {
			return;
		}

		this._mouseMoved = false;

		// we may have missed mouseup (out of window)
		(this._mouseStarted && this._mouseUp(event));

		this._mouseDownEvent = event;

		var that = this,
			btnIsLeft = (event.which === 1),
			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = (typeof this.options.cancel === "string" && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false);
		if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if (!this.mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				that.mouseDelayMet = true;
			}, this.options.delay);
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted = (this._mouseStart(event) !== false);
			if (!this._mouseStarted) {
				event.preventDefault();
				return true;
			}
		}

		// Click event may never have fired (Gecko & Opera)
		if (true === $.data(event.target, this.widgetName + ".preventClickEvent")) {
			$.removeData(event.target, this.widgetName + ".preventClickEvent");
		}

		// these delegates are required to keep context
		this._mouseMoveDelegate = function(event) {
			return that._mouseMove(event);
		};
		this._mouseUpDelegate = function(event) {
			return that._mouseUp(event);
		};

		this.document
			.bind( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.bind( "mouseup." + this.widgetName, this._mouseUpDelegate );

		event.preventDefault();

		mouseHandled = true;
		return true;
	},

	_mouseMove: function(event) {
		// Only check for mouseups outside the document if you've moved inside the document
		// at least once. This prevents the firing of mouseup in the case of IE<9, which will
		// fire a mousemove event if content is placed under the cursor. See #7778
		// Support: IE <9
		if ( this._mouseMoved ) {
			// IE mouseup check - mouseup happened when mouse was out of window
			if ($.ui.ie && ( !document.documentMode || document.documentMode < 9 ) && !event.button) {
				return this._mouseUp(event);

			// Iframe mouseup check - mouseup occurred in another document
			} else if ( !event.which ) {
				return this._mouseUp( event );
			}
		}

		if ( event.which || event.button ) {
			this._mouseMoved = true;
		}

		if (this._mouseStarted) {
			this._mouseDrag(event);
			return event.preventDefault();
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted =
				(this._mouseStart(this._mouseDownEvent, event) !== false);
			(this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
		}

		return !this._mouseStarted;
	},

	_mouseUp: function(event) {
		this.document
			.unbind( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.unbind( "mouseup." + this.widgetName, this._mouseUpDelegate );

		if (this._mouseStarted) {
			this._mouseStarted = false;

			if (event.target === this._mouseDownEvent.target) {
				$.data(event.target, this.widgetName + ".preventClickEvent", true);
			}

			this._mouseStop(event);
		}

		mouseHandled = false;
		return false;
	},

	_mouseDistanceMet: function(event) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - event.pageX),
				Math.abs(this._mouseDownEvent.pageY - event.pageY)
			) >= this.options.distance
		);
	},

	_mouseDelayMet: function(/* event */) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function(/* event */) {},
	_mouseDrag: function(/* event */) {},
	_mouseStop: function(/* event */) {},
	_mouseCapture: function(/* event */) { return true; }
});

}));
/*!
 * jQuery UI Slider 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/slider/
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([
			"jquery",
			"./core",
			"./mouse",
			"./widget"
		], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

return $.widget( "ui.slider", $.ui.mouse, {
	version: "1.11.4",
	widgetEventPrefix: "slide",

	options: {
		animate: false,
		distance: 0,
		max: 100,
		min: 0,
		orientation: "horizontal",
		range: false,
		step: 1,
		value: 0,
		values: null,

		// callbacks
		change: null,
		slide: null,
		start: null,
		stop: null
	},

	// number of pages in a slider
	// (how many times can you page up/down to go through the whole range)
	numPages: 5,

	_create: function() {
		this._keySliding = false;
		this._mouseSliding = false;
		this._animateOff = true;
		this._handleIndex = null;
		this._detectOrientation();
		this._mouseInit();
		this._calculateNewMax();

		this.element
			.addClass( "ui-slider" +
				" ui-slider-" + this.orientation +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all");

		this._refresh();
		this._setOption( "disabled", this.options.disabled );

		this._animateOff = false;
	},

	_refresh: function() {
		this._createRange();
		this._createHandles();
		this._setupEvents();
		this._refreshValue();
	},

	_createHandles: function() {
		var i, handleCount,
			options = this.options,
			existingHandles = this.element.find( ".ui-slider-handle" ).addClass( "ui-state-default ui-corner-all" ),
			handle = "<span class='ui-slider-handle ui-state-default ui-corner-all' tabindex='0'></span>",
			handles = [];

		handleCount = ( options.values && options.values.length ) || 1;

		if ( existingHandles.length > handleCount ) {
			existingHandles.slice( handleCount ).remove();
			existingHandles = existingHandles.slice( 0, handleCount );
		}

		for ( i = existingHandles.length; i < handleCount; i++ ) {
			handles.push( handle );
		}

		this.handles = existingHandles.add( $( handles.join( "" ) ).appendTo( this.element ) );

		this.handle = this.handles.eq( 0 );

		this.handles.each(function( i ) {
			$( this ).data( "ui-slider-handle-index", i );
		});
	},

	_createRange: function() {
		var options = this.options,
			classes = "";

		if ( options.range ) {
			if ( options.range === true ) {
				if ( !options.values ) {
					options.values = [ this._valueMin(), this._valueMin() ];
				} else if ( options.values.length && options.values.length !== 2 ) {
					options.values = [ options.values[0], options.values[0] ];
				} else if ( $.isArray( options.values ) ) {
					options.values = options.values.slice(0);
				}
			}

			if ( !this.range || !this.range.length ) {
				this.range = $( "<div></div>" )
					.appendTo( this.element );

				classes = "ui-slider-range" +
				// note: this isn't the most fittingly semantic framework class for this element,
				// but worked best visually with a variety of themes
				" ui-widget-header ui-corner-all";
			} else {
				this.range.removeClass( "ui-slider-range-min ui-slider-range-max" )
					// Handle range switching from true to min/max
					.css({
						"left": "",
						"bottom": ""
					});
			}

			this.range.addClass( classes +
				( ( options.range === "min" || options.range === "max" ) ? " ui-slider-range-" + options.range : "" ) );
		} else {
			if ( this.range ) {
				this.range.remove();
			}
			this.range = null;
		}
	},

	_setupEvents: function() {
		this._off( this.handles );
		this._on( this.handles, this._handleEvents );
		this._hoverable( this.handles );
		this._focusable( this.handles );
	},

	_destroy: function() {
		this.handles.remove();
		if ( this.range ) {
			this.range.remove();
		}

		this.element
			.removeClass( "ui-slider" +
				" ui-slider-horizontal" +
				" ui-slider-vertical" +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all" );

		this._mouseDestroy();
	},

	_mouseCapture: function( event ) {
		var position, normValue, distance, closestHandle, index, allowed, offset, mouseOverHandle,
			that = this,
			o = this.options;

		if ( o.disabled ) {
			return false;
		}

		this.elementSize = {
			width: this.element.outerWidth(),
			height: this.element.outerHeight()
		};
		this.elementOffset = this.element.offset();

		position = { x: event.pageX, y: event.pageY };
		normValue = this._normValueFromMouse( position );
		distance = this._valueMax() - this._valueMin() + 1;
		this.handles.each(function( i ) {
			var thisDistance = Math.abs( normValue - that.values(i) );
			if (( distance > thisDistance ) ||
				( distance === thisDistance &&
					(i === that._lastChangedValue || that.values(i) === o.min ))) {
				distance = thisDistance;
				closestHandle = $( this );
				index = i;
			}
		});

		allowed = this._start( event, index );
		if ( allowed === false ) {
			return false;
		}
		this._mouseSliding = true;

		this._handleIndex = index;

		closestHandle
			.addClass( "ui-state-active" )
			.focus();

		offset = closestHandle.offset();
		mouseOverHandle = !$( event.target ).parents().addBack().is( ".ui-slider-handle" );
		this._clickOffset = mouseOverHandle ? { left: 0, top: 0 } : {
			left: event.pageX - offset.left - ( closestHandle.width() / 2 ),
			top: event.pageY - offset.top -
				( closestHandle.height() / 2 ) -
				( parseInt( closestHandle.css("borderTopWidth"), 10 ) || 0 ) -
				( parseInt( closestHandle.css("borderBottomWidth"), 10 ) || 0) +
				( parseInt( closestHandle.css("marginTop"), 10 ) || 0)
		};

		if ( !this.handles.hasClass( "ui-state-hover" ) ) {
			this._slide( event, index, normValue );
		}
		this._animateOff = true;
		return true;
	},

	_mouseStart: function() {
		return true;
	},

	_mouseDrag: function( event ) {
		var position = { x: event.pageX, y: event.pageY },
			normValue = this._normValueFromMouse( position );

		this._slide( event, this._handleIndex, normValue );

		return false;
	},

	_mouseStop: function( event ) {
		this.handles.removeClass( "ui-state-active" );
		this._mouseSliding = false;

		this._stop( event, this._handleIndex );
		this._change( event, this._handleIndex );

		this._handleIndex = null;
		this._clickOffset = null;
		this._animateOff = false;

		return false;
	},

	_detectOrientation: function() {
		this.orientation = ( this.options.orientation === "vertical" ) ? "vertical" : "horizontal";
	},

	_normValueFromMouse: function( position ) {
		var pixelTotal,
			pixelMouse,
			percentMouse,
			valueTotal,
			valueMouse;

		if ( this.orientation === "horizontal" ) {
			pixelTotal = this.elementSize.width;
			pixelMouse = position.x - this.elementOffset.left - ( this._clickOffset ? this._clickOffset.left : 0 );
		} else {
			pixelTotal = this.elementSize.height;
			pixelMouse = position.y - this.elementOffset.top - ( this._clickOffset ? this._clickOffset.top : 0 );
		}

		percentMouse = ( pixelMouse / pixelTotal );
		if ( percentMouse > 1 ) {
			percentMouse = 1;
		}
		if ( percentMouse < 0 ) {
			percentMouse = 0;
		}
		if ( this.orientation === "vertical" ) {
			percentMouse = 1 - percentMouse;
		}

		valueTotal = this._valueMax() - this._valueMin();
		valueMouse = this._valueMin() + percentMouse * valueTotal;

		return this._trimAlignValue( valueMouse );
	},

	_start: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}
		return this._trigger( "start", event, uiHash );
	},

	_slide: function( event, index, newVal ) {
		var otherVal,
			newValues,
			allowed;

		if ( this.options.values && this.options.values.length ) {
			otherVal = this.values( index ? 0 : 1 );

			if ( ( this.options.values.length === 2 && this.options.range === true ) &&
					( ( index === 0 && newVal > otherVal) || ( index === 1 && newVal < otherVal ) )
				) {
				newVal = otherVal;
			}

			if ( newVal !== this.values( index ) ) {
				newValues = this.values();
				newValues[ index ] = newVal;
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal,
					values: newValues
				} );
				otherVal = this.values( index ? 0 : 1 );
				if ( allowed !== false ) {
					this.values( index, newVal );
				}
			}
		} else {
			if ( newVal !== this.value() ) {
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal
				} );
				if ( allowed !== false ) {
					this.value( newVal );
				}
			}
		}
	},

	_stop: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}

		this._trigger( "stop", event, uiHash );
	},

	_change: function( event, index ) {
		if ( !this._keySliding && !this._mouseSliding ) {
			var uiHash = {
				handle: this.handles[ index ],
				value: this.value()
			};
			if ( this.options.values && this.options.values.length ) {
				uiHash.value = this.values( index );
				uiHash.values = this.values();
			}

			//store the last changed value index for reference when handles overlap
			this._lastChangedValue = index;

			this._trigger( "change", event, uiHash );
		}
	},

	value: function( newValue ) {
		if ( arguments.length ) {
			this.options.value = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, 0 );
			return;
		}

		return this._value();
	},

	values: function( index, newValue ) {
		var vals,
			newValues,
			i;

		if ( arguments.length > 1 ) {
			this.options.values[ index ] = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, index );
			return;
		}

		if ( arguments.length ) {
			if ( $.isArray( arguments[ 0 ] ) ) {
				vals = this.options.values;
				newValues = arguments[ 0 ];
				for ( i = 0; i < vals.length; i += 1 ) {
					vals[ i ] = this._trimAlignValue( newValues[ i ] );
					this._change( null, i );
				}
				this._refreshValue();
			} else {
				if ( this.options.values && this.options.values.length ) {
					return this._values( index );
				} else {
					return this.value();
				}
			}
		} else {
			return this._values();
		}
	},

	_setOption: function( key, value ) {
		var i,
			valsLength = 0;

		if ( key === "range" && this.options.range === true ) {
			if ( value === "min" ) {
				this.options.value = this._values( 0 );
				this.options.values = null;
			} else if ( value === "max" ) {
				this.options.value = this._values( this.options.values.length - 1 );
				this.options.values = null;
			}
		}

		if ( $.isArray( this.options.values ) ) {
			valsLength = this.options.values.length;
		}

		if ( key === "disabled" ) {
			this.element.toggleClass( "ui-state-disabled", !!value );
		}

		this._super( key, value );

		switch ( key ) {
			case "orientation":
				this._detectOrientation();
				this.element
					.removeClass( "ui-slider-horizontal ui-slider-vertical" )
					.addClass( "ui-slider-" + this.orientation );
				this._refreshValue();

				// Reset positioning from previous orientation
				this.handles.css( value === "horizontal" ? "bottom" : "left", "" );
				break;
			case "value":
				this._animateOff = true;
				this._refreshValue();
				this._change( null, 0 );
				this._animateOff = false;
				break;
			case "values":
				this._animateOff = true;
				this._refreshValue();
				for ( i = 0; i < valsLength; i += 1 ) {
					this._change( null, i );
				}
				this._animateOff = false;
				break;
			case "step":
			case "min":
			case "max":
				this._animateOff = true;
				this._calculateNewMax();
				this._refreshValue();
				this._animateOff = false;
				break;
			case "range":
				this._animateOff = true;
				this._refresh();
				this._animateOff = false;
				break;
		}
	},

	//internal value getter
	// _value() returns value trimmed by min and max, aligned by step
	_value: function() {
		var val = this.options.value;
		val = this._trimAlignValue( val );

		return val;
	},

	//internal values getter
	// _values() returns array of values trimmed by min and max, aligned by step
	// _values( index ) returns single value trimmed by min and max, aligned by step
	_values: function( index ) {
		var val,
			vals,
			i;

		if ( arguments.length ) {
			val = this.options.values[ index ];
			val = this._trimAlignValue( val );

			return val;
		} else if ( this.options.values && this.options.values.length ) {
			// .slice() creates a copy of the array
			// this copy gets trimmed by min and max and then returned
			vals = this.options.values.slice();
			for ( i = 0; i < vals.length; i += 1) {
				vals[ i ] = this._trimAlignValue( vals[ i ] );
			}

			return vals;
		} else {
			return [];
		}
	},

	// returns the step-aligned value that val is closest to, between (inclusive) min and max
	_trimAlignValue: function( val ) {
		if ( val <= this._valueMin() ) {
			return this._valueMin();
		}
		if ( val >= this._valueMax() ) {
			return this._valueMax();
		}
		var step = ( this.options.step > 0 ) ? this.options.step : 1,
			valModStep = (val - this._valueMin()) % step,
			alignValue = val - valModStep;

		if ( Math.abs(valModStep) * 2 >= step ) {
			alignValue += ( valModStep > 0 ) ? step : ( -step );
		}

		// Since JavaScript has problems with large floats, round
		// the final value to 5 digits after the decimal point (see #4124)
		return parseFloat( alignValue.toFixed(5) );
	},

	_calculateNewMax: function() {
		var max = this.options.max,
			min = this._valueMin(),
			step = this.options.step,
			aboveMin = Math.floor( ( +( max - min ).toFixed( this._precision() ) ) / step ) * step;
		max = aboveMin + min;
		this.max = parseFloat( max.toFixed( this._precision() ) );
	},

	_precision: function() {
		var precision = this._precisionOf( this.options.step );
		if ( this.options.min !== null ) {
			precision = Math.max( precision, this._precisionOf( this.options.min ) );
		}
		return precision;
	},

	_precisionOf: function( num ) {
		var str = num.toString(),
			decimal = str.indexOf( "." );
		return decimal === -1 ? 0 : str.length - decimal - 1;
	},

	_valueMin: function() {
		return this.options.min;
	},

	_valueMax: function() {
		return this.max;
	},

	_refreshValue: function() {
		var lastValPercent, valPercent, value, valueMin, valueMax,
			oRange = this.options.range,
			o = this.options,
			that = this,
			animate = ( !this._animateOff ) ? o.animate : false,
			_set = {};

		if ( this.options.values && this.options.values.length ) {
			this.handles.each(function( i ) {
				valPercent = ( that.values(i) - that._valueMin() ) / ( that._valueMax() - that._valueMin() ) * 100;
				_set[ that.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
				$( this ).stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );
				if ( that.options.range === true ) {
					if ( that.orientation === "horizontal" ) {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { left: valPercent + "%" }, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( { width: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					} else {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { bottom: ( valPercent ) + "%" }, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( { height: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					}
				}
				lastValPercent = valPercent;
			});
		} else {
			value = this.value();
			valueMin = this._valueMin();
			valueMax = this._valueMax();
			valPercent = ( valueMax !== valueMin ) ?
					( value - valueMin ) / ( valueMax - valueMin ) * 100 :
					0;
			_set[ this.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
			this.handle.stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );

			if ( oRange === "min" && this.orientation === "horizontal" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { width: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "horizontal" ) {
				this.range[ animate ? "animate" : "css" ]( { width: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
			if ( oRange === "min" && this.orientation === "vertical" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { height: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "vertical" ) {
				this.range[ animate ? "animate" : "css" ]( { height: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
		}
	},

	_handleEvents: {
		keydown: function( event ) {
			var allowed, curVal, newVal, step,
				index = $( event.target ).data( "ui-slider-handle-index" );

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
				case $.ui.keyCode.END:
				case $.ui.keyCode.PAGE_UP:
				case $.ui.keyCode.PAGE_DOWN:
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					event.preventDefault();
					if ( !this._keySliding ) {
						this._keySliding = true;
						$( event.target ).addClass( "ui-state-active" );
						allowed = this._start( event, index );
						if ( allowed === false ) {
							return;
						}
					}
					break;
			}

			step = this.options.step;
			if ( this.options.values && this.options.values.length ) {
				curVal = newVal = this.values( index );
			} else {
				curVal = newVal = this.value();
			}

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
					newVal = this._valueMin();
					break;
				case $.ui.keyCode.END:
					newVal = this._valueMax();
					break;
				case $.ui.keyCode.PAGE_UP:
					newVal = this._trimAlignValue(
						curVal + ( ( this._valueMax() - this._valueMin() ) / this.numPages )
					);
					break;
				case $.ui.keyCode.PAGE_DOWN:
					newVal = this._trimAlignValue(
						curVal - ( (this._valueMax() - this._valueMin()) / this.numPages ) );
					break;
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
					if ( curVal === this._valueMax() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal + step );
					break;
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					if ( curVal === this._valueMin() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal - step );
					break;
			}

			this._slide( event, index, newVal );
		},
		keyup: function( event ) {
			var index = $( event.target ).data( "ui-slider-handle-index" );

			if ( this._keySliding ) {
				this._keySliding = false;
				this._stop( event, index );
				this._change( event, index );
				$( event.target ).removeClass( "ui-state-active" );
			}
		}
	}
});

}));

cartodb.moduleLoad('torque', torque);

Profiler = cartodb.core.Profiler

