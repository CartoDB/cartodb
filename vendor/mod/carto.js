!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.carto=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (tree) {

tree.functions = {
    rgb: function (r, g, b) {
        return this.rgba(r, g, b, 1.0);
    },
    rgba: function (r, g, b, a) {
        var rgb = [r, g, b].map(function (c) { return number(c); });
        a = number(a);
        if (rgb.some(isNaN) || isNaN(a)) return null;
        return new tree.Color(rgb, a);
    },
    // Only require val
    stop: function (val) {
        var color, mode;
        if (arguments.length > 1) color = arguments[1];
        if (arguments.length > 2) mode = arguments[2];

        return {
            is: 'tag',
            val: val,
            color: color,
            mode: mode,
            toString: function(env) {
                return '\n\t<stop value="' + val.ev(env) + '"' +
                    (color ? ' color="' + color.ev(env) + '" ' : '') +
                    (mode ? ' mode="' + mode.ev(env) + '" ' : '') +
                    '/>';
            }
        };
    },
    hsl: function (h, s, l) {
        return this.hsla(h, s, l, 1.0);
    },
    hsla: function (h, s, l, a) {
        h = (number(h) % 360) / 360;
        s = number(s); l = number(l); a = number(a);
        if ([h, s, l, a].some(isNaN)) return null;

        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
            m1 = l * 2 - m2;

        return this.rgba(hue(h + 1/3) * 255,
                         hue(h)       * 255,
                         hue(h - 1/3) * 255,
                         a);

        function hue(h) {
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if      (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
            else if (h * 2 < 1) return m2;
            else if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
            else                return m1;
        }
    },
    hue: function (color) {
        if (!('toHSL' in color)) return null;
        return new tree.Dimension(Math.round(color.toHSL().h));
    },
    saturation: function (color) {
        if (!('toHSL' in color)) return null;
        return new tree.Dimension(Math.round(color.toHSL().s * 100), '%');
    },
    lightness: function (color) {
        if (!('toHSL' in color)) return null;
        return new tree.Dimension(Math.round(color.toHSL().l * 100), '%');
    },
    alpha: function (color) {
        if (!('toHSL' in color)) return null;
        return new tree.Dimension(color.toHSL().a);
    },
    saturate: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.s += amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    desaturate: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.s -= amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    lighten: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.l += amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    darken: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.l -= amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    fadein: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.a += amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    fadeout: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();

        hsl.a -= amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    spin: function (color, amount) {
        if (!('toHSL' in color)) return null;
        var hsl = color.toHSL();
        var hue = (hsl.h + amount.value) % 360;

        hsl.h = hue < 0 ? 360 + hue : hue;

        return hsla(hsl);
    },
    replace: function (entity, a, b) {
        if (entity.is === 'field') {
            return entity.toString + '.replace(' + a.toString() + ', ' + b.toString() + ')';
        } else {
            return entity.replace(a, b);
        }
    },
    //
    // Copyright (c) 2006-2009 Hampton Catlin, Nathan Weizenbaum, and Chris Eppstein
    // http://sass-lang.com
    //
    mix: function (color1, color2, weight) {
        var p = weight.value / 100.0;
        var w = p * 2 - 1;
        var a = color1.toHSL().a - color2.toHSL().a;

        var w1 = (((w * a == -1) ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
        var w2 = 1 - w1;

        var rgb = [color1.rgb[0] * w1 + color2.rgb[0] * w2,
                   color1.rgb[1] * w1 + color2.rgb[1] * w2,
                   color1.rgb[2] * w1 + color2.rgb[2] * w2];

        var alpha = color1.alpha * p + color2.alpha * (1 - p);

        return new tree.Color(rgb, alpha);
    },
    greyscale: function (color) {
        return this.desaturate(color, new tree.Dimension(100));
    },
    '%': function (quoted /* arg, arg, ...*/) {
        var args = Array.prototype.slice.call(arguments, 1),
            str = quoted.value;

        for (var i = 0; i < args.length; i++) {
            str = str.replace(/%s/,    args[i].value)
                     .replace(/%[da]/, args[i].toString());
        }
        str = str.replace(/%%/g, '%');
        return new tree.Quoted(str);
    }
};

var image_filter_functors = [
    'emboss', 'blur', 'gray', 'sobel', 'edge-detect',
    'x-gradient', 'y-gradient', 'sharpen'];

for (var i = 0; i < image_filter_functors.length; i++) {
    var f = image_filter_functors[i];
    tree.functions[f] = (function(f) {
        return function() {
            return new tree.ImageFilter(f);
        };
    })(f);
}

tree.functions['agg-stack-blur'] = function(x, y) {
    return new tree.ImageFilter('agg-stack-blur', [x, y]);
};

tree.functions['scale-hsla'] = function(h0,h1,s0,s1,l0,l1,a0,a1) {
    return new tree.ImageFilter('scale-hsla', [h0,h1,s0,s1,l0,l1,a0,a1]);
};

function hsla(h) {
    return tree.functions.hsla(h.h, h.s, h.l, h.a);
}

function number(n) {
    if (n instanceof tree.Dimension) {
        return parseFloat(n.unit == '%' ? n.value / 100 : n.value);
    } else if (typeof(n) === 'number') {
        return n;
    } else {
        return NaN;
    }
}

function clamp(val) {
    return Math.min(1, Math.max(0, val));
}

})(require('./tree'));

},{"./tree":7}],2:[function(require,module,exports){
(function (process,__dirname){
var util = require('util'),
    fs = require('fs'),
    path = require('path');


function getVersion() {
    if (process.browser) {
        return require('../../package.json').version.split('.');
    } else if (parseInt(process.version.split('.')[1], 10) > 4) {
        return require('../../package.json').version.split('.');
    } else {
        // older node
        var package_json = JSON.parse(fs.readFileSync(path.join(__dirname,'../../package.json')));
        return package_json.version.split('.');
    }
}

var carto = {
    version: getVersion(),
    Parser: require('./parser').Parser,
    Renderer: require('./renderer').Renderer,
    tree: require('./tree'),
    RendererJS: require('./renderer_js'),

    // @TODO
    writeError: function(ctx, options) {
        var message = '';
        var extract = ctx.extract;
        var error = [];

        options = options || {};

        if (options.silent) { return; }

        options.indent = options.indent || '';

        if (!('index' in ctx) || !extract) {
            return util.error(options.indent + (ctx.stack || ctx.message));
        }

        if (typeof(extract[0]) === 'string') {
            error.push(stylize((ctx.line - 1) + ' ' + extract[0], 'grey'));
        }

        if (extract[1] === '' && typeof extract[2] === 'undefined') {
            extract[1] = '¶';
        }
        error.push(ctx.line + ' ' + extract[1].slice(0, ctx.column) +
            stylize(stylize(extract[1][ctx.column], 'bold') +
            extract[1].slice(ctx.column + 1), 'yellow'));

        if (typeof(extract[2]) === 'string') {
            error.push(stylize((ctx.line + 1) + ' ' + extract[2], 'grey'));
        }
        error = options.indent + error.join('\n' + options.indent) + '\033[0m\n';

        message = options.indent + message + stylize(ctx.message, 'red');
        if (ctx.filename) (message += stylize(' in ', 'red') + ctx.filename);

        util.error(message, error);

        if (ctx.callLine) {
            util.error(stylize('from ', 'red') + (ctx.filename || ''));
            util.error(stylize(ctx.callLine, 'grey') + ' ' + ctx.callExtract);
        }
        if (ctx.stack) { util.error(stylize(ctx.stack, 'red')); }
    }
};

require('./tree/call');
require('./tree/color');
require('./tree/comment');
require('./tree/definition');
require('./tree/dimension');
require('./tree/element');
require('./tree/expression');
require('./tree/filterset');
require('./tree/filter');
require('./tree/field');
require('./tree/keyword');
require('./tree/layer');
require('./tree/literal');
require('./tree/operation');
require('./tree/quoted');
require('./tree/imagefilter');
require('./tree/reference');
require('./tree/rule');
require('./tree/ruleset');
require('./tree/selector');
require('./tree/style');
require('./tree/url');
require('./tree/value');
require('./tree/variable');
require('./tree/zoom');
require('./tree/invalid');
require('./tree/fontset');
require('./tree/frame_offset');
require('./functions');

for (var k in carto) { exports[k] = carto[k]; }

// Stylize a string
function stylize(str, style) {
    var styles = {
        'bold' : [1, 22],
        'inverse' : [7, 27],
        'underline' : [4, 24],
        'yellow' : [33, 39],
        'green' : [32, 39],
        'red' : [31, 39],
        'grey' : [90, 39]
    };
    return '\033[' + styles[style][0] + 'm' + str +
           '\033[' + styles[style][1] + 'm';
}

}).call(this,require('_process'),"/lib/carto")
},{"../../package.json":45,"./functions":1,"./parser":3,"./renderer":4,"./renderer_js":5,"./tree":7,"./tree/call":8,"./tree/color":9,"./tree/comment":10,"./tree/definition":11,"./tree/dimension":12,"./tree/element":13,"./tree/expression":14,"./tree/field":15,"./tree/filter":16,"./tree/filterset":17,"./tree/fontset":18,"./tree/frame_offset":19,"./tree/imagefilter":20,"./tree/invalid":21,"./tree/keyword":22,"./tree/layer":23,"./tree/literal":24,"./tree/operation":25,"./tree/quoted":26,"./tree/reference":27,"./tree/rule":28,"./tree/ruleset":29,"./tree/selector":30,"./tree/style":31,"./tree/url":32,"./tree/value":33,"./tree/variable":34,"./tree/zoom":35,"_process":40,"fs":36,"path":39,"util":42}],3:[function(require,module,exports){
var carto = exports,
    tree = require('./tree'),
    _ = require('underscore');

//    Token matching is done with the `$` function, which either takes
//    a terminal string or regexp, or a non-terminal function to call.
//    It also takes care of moving all the indices forwards.
carto.Parser = function Parser(env) {
    var input,       // LeSS input string
        i,           // current index in `input`
        j,           // current chunk
        temp,        // temporarily holds a chunk's state, for backtracking
        memo,        // temporarily holds `i`, when backtracking
        furthest,    // furthest index the parser has gone to
        chunks,      // chunkified input
        current,     // index of current chunk, in `input`
        parser;

    var that = this;

    // This function is called after all files
    // have been imported through `@import`.
    var finish = function() {};

    function save()    {
        temp = chunks[j];
        memo = i;
        current = i;
    }
    function restore() {
        chunks[j] = temp;
        i = memo;
        current = i;
    }

    function sync() {
        if (i > current) {
            chunks[j] = chunks[j].slice(i - current);
            current = i;
        }
    }
    //
    // Parse from a token, regexp or string, and move forward if match
    //
    function $(tok) {
        var match, args, length, c, index, endIndex, k;

        // Non-terminal
        if (tok instanceof Function) {
            return tok.call(parser.parsers);
        // Terminal
        // Either match a single character in the input,
        // or match a regexp in the current chunk (chunk[j]).
        } else if (typeof(tok) === 'string') {
            match = input.charAt(i) === tok ? tok : null;
            length = 1;
            sync();
        } else {
            sync();

            match = tok.exec(chunks[j]);
            if (match) {
                length = match[0].length;
            } else {
                return null;
            }
        }

        // The match is confirmed, add the match length to `i`,
        // and consume any extra white-space characters (' ' || '\n')
        // which come after that. The reason for this is that LeSS's
        // grammar is mostly white-space insensitive.
        if (match) {
            var mem = i += length;
            endIndex = i + chunks[j].length - length;

            while (i < endIndex) {
                c = input.charCodeAt(i);
                if (! (c === 32 || c === 10 || c === 9)) { break; }
                i++;
            }
            chunks[j] = chunks[j].slice(length + (i - mem));
            current = i;

            if (chunks[j].length === 0 && j < chunks.length - 1) { j++; }

            if (typeof(match) === 'string') {
                return match;
            } else {
                return match.length === 1 ? match[0] : match;
            }
        }
    }

    // Same as $(), but don't change the state of the parser,
    // just return the match.
    function peek(tok) {
        if (typeof(tok) === 'string') {
            return input.charAt(i) === tok;
        } else {
            return !!tok.test(chunks[j]);
        }
    }

    function extractErrorLine(style, errorIndex) {
        return (style.slice(0, errorIndex).match(/\n/g) || '').length + 1;
    }


    // Make an error object from a passed set of properties.
    // Accepted properties:
    // - `message`: Text of the error message.
    // - `filename`: Filename where the error occurred.
    // - `index`: Char. index where the error occurred.
    function makeError(err) {
        var einput;

        _(err).defaults({
            index: furthest,
            filename: env.filename,
            message: 'Parse error.',
            line: 0,
            column: -1
        });

        if (err.filename && that.env.inputs && that.env.inputs[err.filename]) {
            einput = that.env.inputs[err.filename];
        } else {
            einput = input;
        }

        err.line = extractErrorLine(einput, err.index);
        for (var n = err.index; n >= 0 && einput.charAt(n) !== '\n'; n--) {
            err.column++;
        }

        return new Error(_('<%=filename%>:<%=line%>:<%=column%> <%=message%>').template(err));
    }

    this.env = env = env || {};
    this.env.filename = this.env.filename || null;
    this.env.inputs = this.env.inputs || {};

    // The Parser
    parser = {

        extractErrorLine: extractErrorLine,
        //
        // Parse an input string into an abstract syntax tree.
        // Throws an error on parse errors.
        parse: function(str) {
            var root, start, end, zone, line, lines, buff = [], c, error = null;

            i = j = current = furthest = 0;
            chunks = [];
            input = str.replace(/\r\n/g, '\n');
            if (env.filename) {
                that.env.inputs[env.filename] = input;
            }

            var early_exit = false;

            // Split the input into chunks.
            chunks = (function (chunks) {
                var j = 0,
                    skip = /(?:@\{[\w-]+\}|[^"'`\{\}\/\(\)\\])+/g,
                    comment = /\/\*(?:[^*]|\*+[^\/*])*\*+\/|\/\/.*/g,
                    string = /"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)'|`((?:[^`]|\\.)*)`/g,
                    level = 0,
                    match,
                    chunk = chunks[0],
                    inParam;

                for (var i = 0, c, cc; i < input.length;) {
                    skip.lastIndex = i;
                    if (match = skip.exec(input)) {
                        if (match.index === i) {
                            i += match[0].length;
                            chunk.push(match[0]);
                        }
                    }
                    c = input.charAt(i);
                    comment.lastIndex = string.lastIndex = i;

                    if (match = string.exec(input)) {
                        if (match.index === i) {
                            i += match[0].length;
                            chunk.push(match[0]);
                            continue;
                        }
                    }

                    if (!inParam && c === '/') {
                        cc = input.charAt(i + 1);
                        if (cc === '/' || cc === '*') {
                            if (match = comment.exec(input)) {
                                if (match.index === i) {
                                    i += match[0].length;
                                    chunk.push(match[0]);
                                    continue;
                                }
                            }
                        }
                    }

                    switch (c) {
                        case '{': if (! inParam) { level ++;        chunk.push(c);                           break; }
                        case '}': if (! inParam) { level --;        chunk.push(c); chunks[++j] = chunk = []; break; }
                        case '(': if (! inParam) { inParam = true;  chunk.push(c);                           break; }
                        case ')': if (  inParam) { inParam = false; chunk.push(c);                           break; }
                        default:                                    chunk.push(c);
                    }

                    i++;
                }
                if (level !== 0) {
                    error = {
                        index: i - 1,
                        type: 'Parse',
                        message: (level > 0) ? "missing closing `}`" : "missing opening `{`"
                    };
                }

                return chunks.map(function (c) { return c.join(''); });
            })([[]]);

            if (error) {
                throw makeError(error);
            }

            // Start with the primary rule.
            // The whole syntax tree is held under a Ruleset node,
            // with the `root` property set to true, so no `{}` are
            // output.
            root = new tree.Ruleset([], $(this.parsers.primary));
            root.root = true;

            // Get an array of Ruleset objects, flattened
            // and sorted according to specificitySort
            root.toList = (function() {
                var line, lines, column;
                return function(env) {
                    env.error = function(e) {
                        if (!env.errors) env.errors = new Error('');
                        if (env.errors.message) {
                            env.errors.message += '\n' + makeError(e).message;
                        } else {
                            env.errors.message = makeError(e).message;
                        }
                    };
                    env.frames = env.frames || [];


                    // call populates Invalid-caused errors
                    var definitions = this.flatten([], [], env);
                    definitions.sort(specificitySort);
                    return definitions;
                };
            })();

            // Sort rules by specificity: this function expects selectors to be
            // split already.
            //
            // Written to be used as a .sort(Function);
            // argument.
            //
            // [1, 0, 0, 467] > [0, 0, 1, 520]
            var specificitySort = function(a, b) {
                var as = a.specificity;
                var bs = b.specificity;

                if (as[0] != bs[0]) return bs[0] - as[0];
                if (as[1] != bs[1]) return bs[1] - as[1];
                if (as[2] != bs[2]) return bs[2] - as[2];
                return bs[3] - as[3];
            };

            return root;
        },

        // Here in, the parsing rules/functions
        //
        // The basic structure of the syntax tree generated is as follows:
        //
        //   Ruleset ->  Rule -> Value -> Expression -> Entity
        //
        //  In general, most rules will try to parse a token with the `$()` function, and if the return
        //  value is truly, will return a new node, of the relevant type. Sometimes, we need to check
        //  first, before parsing, that's when we use `peek()`.
        parsers: {
            // The `primary` rule is the *entry* and *exit* point of the parser.
            // The rules here can appear at any level of the parse tree.
            //
            // The recursive nature of the grammar is an interplay between the `block`
            // rule, which represents `{ ... }`, the `ruleset` rule, and this `primary` rule,
            // as represented by this simplified grammar:
            //
            //     primary  →  (ruleset | rule)+
            //     ruleset  →  selector+ block
            //     block    →  '{' primary '}'
            //
            // Only at one point is the primary rule not called from the
            // block rule: at the root level.
            primary: function() {
                var node, root = [];

                while ((node = $(this.rule) || $(this.ruleset) ||
                               $(this.comment)) ||
                               $(/^[\s\n]+/) || (node = $(this.invalid))) {
                    if (node) root.push(node);
                }
                return root;
            },

            invalid: function () {
                var chunk = $(/^[^;\n]*[;\n]/);

                // To fail gracefully, match everything until a semicolon or linebreak.
                if (chunk) {
                    return new tree.Invalid(chunk, memo);
                }
            },

            // We create a Comment node for CSS comments `/* */`,
            // but keep the LeSS comments `//` silent, by just skipping
            // over them.
            comment: function() {
                var comment;

                if (input.charAt(i) !== '/') return;

                if (input.charAt(i + 1) === '/') {
                    return new tree.Comment($(/^\/\/.*/), true);
                } else if (comment = $(/^\/\*(?:[^*]|\*+[^\/*])*\*+\/\n?/)) {
                    return new tree.Comment(comment);
                }
            },

            // Entities are tokens which can be found inside an Expression
            entities: {

                // A string, which supports escaping " and ' "milky way" 'he\'s the one!'
                quoted: function() {
                    if (input.charAt(i) !== '"' && input.charAt(i) !== "'") return;
                    var str = $(/^"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)'/);
                    if (str) {
                        return new tree.Quoted(str[1] || str[2]);
                    }
                },

                // A reference to a Mapnik field, like [NAME]
                // Behind the scenes, this has the same representation, but Carto
                // needs to be careful to warn when unsupported operations are used.
                field: function() {
                    if (! $('[')) return;
                    var field_name = $(/(^[^\]]+)/);
                    if (! $(']')) return;
                    if (field_name) return new tree.Field(field_name[1]);
                },

                // This is a comparison operator
                comparison: function() {
                    var str = $(/^=~|=|!=|<=|>=|<|>/);
                    if (str) {
                        return str;
                    }
                },

                // A catch-all word, such as: hard-light
                // These can start with either a letter or a dash (-),
                // and then contain numbers, underscores, and letters.
                keyword: function() {
                    var k = $(/^[A-Za-z-]+[A-Za-z-0-9_]*/);
                    if (k) { return new tree.Keyword(k); }
                },

                // A function call like rgb(255, 0, 255)
                // The arguments are parsed with the `entities.arguments` parser.
                call: function() {
                    var name, args;

                    if (!(name = /^([\w\-]+|%)\(/.exec(chunks[j]))) return;

                    name = name[1];

                    if (name === 'url') {
                        // url() is handled by the url parser instead
                        return null;
                    } else {
                        i += name.length;
                    }

                    $('('); // Parse the '(' and consume whitespace.

                    args = $(this.entities['arguments']);

                    if (!$(')')) return;

                    if (name) {
                        return new tree.Call(name, args, i);
                    }
                },
                // Arguments are comma-separated expressions
                'arguments': function() {
                    var args = [], arg;

                    while (arg = $(this.expression)) {
                        args.push(arg);
                        if (! $(',')) { break; }
                    }

                    return args;
                },
                literal: function() {
                    return $(this.entities.dimension) ||
                        $(this.entities.keywordcolor) ||
                        $(this.entities.hexcolor) ||
                        $(this.entities.quoted);
                },

                // Parse url() tokens
                //
                // We use a specific rule for urls, because they don't really behave like
                // standard function calls. The difference is that the argument doesn't have
                // to be enclosed within a string, so it can't be parsed as an Expression.
                url: function() {
                    var value;

                    if (input.charAt(i) !== 'u' || !$(/^url\(/)) return;
                    value = $(this.entities.quoted) || $(this.entities.variable) ||
                            $(/^[\-\w%@$\/.&=:;#+?~]+/) || '';
                    if (! $(')')) {
                        return new tree.Invalid(value, memo, 'Missing closing ) in URL.');
                    } else {
                        return new tree.URL((typeof value.value !== 'undefined' ||
                            value instanceof tree.Variable) ?
                            value : new tree.Quoted(value));
                    }
                },

                // A Variable entity, such as `@fink`, in
                //
                //     width: @fink + 2px
                //
                // We use a different parser for variable definitions,
                // see `parsers.variable`.
                variable: function() {
                    var name, index = i;

                    if (input.charAt(i) === '@' && (name = $(/^@[\w-]+/))) {
                        return new tree.Variable(name, index, env.filename);
                    }
                },

                hexcolor: function() {
                    var rgb;
                    if (input.charAt(i) === '#' && (rgb = $(/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/))) {
                        return new tree.Color(rgb[1]);
                    }
                },

                keywordcolor: function() {
                    var rgb = chunks[j].match(/^[a-z]+/);
                    if (rgb && rgb[0] in tree.Reference.data.colors) {
                        return new tree.Color(tree.Reference.data.colors[$(/^[a-z]+/)]);
                    }
                },

                // A Dimension, that is, a number and a unit. The only
                // unit that has an effect is %
                dimension: function() {
                    var c = input.charCodeAt(i);
                    if ((c > 57 || c < 45) || c === 47) return;
                    var value = $(/^(-?\d*\.?\d+(?:[eE][-+]?\d+)?)(\%|\w+)?/);
                    if (value) {
                        return new tree.Dimension(value[1], value[2], memo);
                    }
                }
            },

            // The variable part of a variable definition.
            // Used in the `rule` parser. Like @fink:
            variable: function() {
                var name;

                if (input.charAt(i) === '@' && (name = $(/^(@[\w-]+)\s*:/))) {
                    return name[1];
                }
            },

            // Entities are the smallest recognized token,
            // and can be found inside a rule's value.
            entity: function() {
                return $(this.entities.call) ||
                    $(this.entities.literal) ||
                    $(this.entities.field) ||
                    $(this.entities.variable) ||
                    $(this.entities.url) ||
                    $(this.entities.keyword);
            },

            // A Rule terminator. Note that we use `peek()` to check for '}',
            // because the `block` rule will be expecting it, but we still need to make sure
            // it's there, if ';' was ommitted.
            end: function() {
                return $(';') || peek('}');
            },

            // Elements are the building blocks for Selectors. They consist of
            // an element name, such as a tag a class, or `*`.
            element: function() {
                var e = $(/^(?:[.#][\w\-]+|\*|Map)/);
                if (e) return new tree.Element(e);
            },

            // Attachments allow adding multiple lines, polygons etc. to an
            // object. There can only be one attachment per selector.
            attachment: function() {
                var s = $(/^::([\w\-]+(?:\/[\w\-]+)*)/);
                if (s) return s[1];
            },

            // Selectors are made out of one or more Elements, see above.
            selector: function() {
                var a, attachment,
                    e, elements = [],
                    f, filters = new tree.Filterset(),
                    z, zooms = [],
                    frame_offset = tree.FrameOffset.none;
                    segments = 0, conditions = 0;

                while (
                        (e = $(this.element)) ||
                        (z = $(this.zoom)) ||
                        (fo = $(this.frame_offset)) ||
                        (f = $(this.filter)) ||
                        (a = $(this.attachment))
                    ) {
                    segments++;
                    if (e) {
                        elements.push(e);
                    } else if (z) {
                        zooms.push(z);
                        conditions++;
                    } else if (fo) {
                        frame_offset = fo;
                        conditions++;
                    } else if (f) {
                        var err = filters.add(f);
                        if (err) {
                            throw makeError({
                                message: err,
                                index: i - 1
                            });
                        }
                        conditions++;
                    } else if (attachment) {
                        throw makeError({
                            message: 'Encountered second attachment name.',
                            index: i - 1
                        });
                    } else {
                        attachment = a;
                    }

                    var c = input.charAt(i);
                    if (c === '{' || c === '}' || c === ';' || c === ',') { break; }
                }

                if (segments) {
                    return new tree.Selector(filters, zooms, frame_offset, elements, attachment, conditions, memo);
                }
            },

            filter: function() {
                save();
                var key, op, val;
                if (! $('[')) return;
                if (key = $(/^[a-zA-Z0-9\-_]+/) ||
                    $(this.entities.quoted) ||
                    $(this.entities.variable) ||
                    $(this.entities.keyword) ||
                    $(this.entities.field)) {
                    // TODO: remove at 1.0.0
                    if (key instanceof tree.Quoted) {
                        key = new tree.Field(key.toString());
                    }
                    if ((op = $(this.entities.comparison)) &&
                        (val = $(this.entities.quoted) ||
                             $(this.entities.variable) ||
                             $(this.entities.dimension) ||
                             $(this.entities.keyword) ||
                             $(this.entities.field))) {
                        if (! $(']')) {
                            throw makeError({
                                message: 'Missing closing ] of filter.',
                                index: memo - 1
                            });
                        }
                        if (!key.is) key = new tree.Field(key);
                        return new tree.Filter(key, op, val, memo, env.filename);
                    }
                }
            },

            frame_offset: function() {
                save();
                var op, val;
                if ($(/^\[\s*frame-offset/g) &&
                    (op = $(this.entities.comparison)) &&
                    (val = $(/^\d+/)) &&
                    $(']'))  {
                        return tree.FrameOffset(op, val, memo);
                }
            },

            zoom: function() {
                save();
                var op, val;
                if ($(/^\[\s*zoom/g) &&
                    (op = $(this.entities.comparison)) &&
                    (val = $(this.entities.variable) || $(this.entities.dimension)) && $(']')) {
                        return new tree.Zoom(op, val, memo);
                } else {
                    // backtrack
                    restore();
                }
            },

            // The `block` rule is used by `ruleset`
            // It's a wrapper around the `primary` rule, with added `{}`.
            block: function() {
                var content;

                if ($('{') && (content = $(this.primary)) && $('}')) {
                    return content;
                }
            },

            // div, .class, body > p {...}
            ruleset: function() {
                var selectors = [], s, f, l, rules, filters = [];
                save();

                while (s = $(this.selector)) {
                    selectors.push(s);
                    while ($(this.comment)) {}
                    if (! $(',')) { break; }
                    while ($(this.comment)) {}
                }
                if (s) {
                    while ($(this.comment)) {}
                }

                if (selectors.length > 0 && (rules = $(this.block))) {
                    if (selectors.length === 1 &&
                        selectors[0].elements.length &&
                        selectors[0].elements[0].value === 'Map') {
                        var rs = new tree.Ruleset(selectors, rules);
                        rs.isMap = true;
                        return rs;
                    }
                    return new tree.Ruleset(selectors, rules);
                } else {
                    // Backtrack
                    restore();
                }
            },

            rule: function() {
                var name, value, c = input.charAt(i);
                save();

                if (c === '.' || c === '#') { return; }

                if (name = $(this.variable) || $(this.property)) {
                    value = $(this.value);

                    if (value && $(this.end)) {
                        return new tree.Rule(name, value, memo, env.filename);
                    } else {
                        furthest = i;
                        restore();
                    }
                }
            },

            font: function() {
                var value = [], expression = [], weight, font, e;

                while (e = $(this.entity)) {
                    expression.push(e);
                }

                value.push(new tree.Expression(expression));

                if ($(',')) {
                    while (e = $(this.expression)) {
                        value.push(e);
                        if (! $(',')) { break; }
                    }
                }
                return new tree.Value(value);
            },

            // A Value is a comma-delimited list of Expressions
            // In a Rule, a Value represents everything after the `:`,
            // and before the `;`.
            value: function() {
                var e, expressions = [];

                while (e = $(this.expression)) {
                    expressions.push(e);
                    if (! $(',')) { break; }
                }

                if (expressions.length > 1) {
                    return new tree.Value(expressions.map(function(e) {
                        return e.value[0];
                    }));
                } else if (expressions.length === 1) {
                    return new tree.Value(expressions);
                }
            },
            // A sub-expression, contained by parenthensis
            sub: function() {
                var e;

                if ($('(') && (e = $(this.expression)) && $(')')) {
                    return e;
                }
            },
            // This is a misnomer because it actually handles multiplication
            // and division.
            multiplication: function() {
                var m, a, op, operation;
                if (m = $(this.operand)) {
                    while ((op = ($('/') || $('*') || $('%'))) && (a = $(this.operand))) {
                        operation = new tree.Operation(op, [operation || m, a], memo);
                    }
                    return operation || m;
                }
            },
            addition: function() {
                var m, a, op, operation;
                if (m = $(this.multiplication)) {
                    while ((op = $(/^[-+]\s+/) || (input.charAt(i - 1) != ' ' && ($('+') || $('-')))) &&
                           (a = $(this.multiplication))) {
                        operation = new tree.Operation(op, [operation || m, a], memo);
                    }
                    return operation || m;
                }
            },

            // An operand is anything that can be part of an operation,
            // such as a Color, or a Variable
            operand: function() {
                return $(this.sub) || $(this.entity);
            },

            // Expressions either represent mathematical operations,
            // or white-space delimited Entities.  @var * 2
            expression: function() {
                var e, delim, entities = [], d;

                while (e = $(this.addition) || $(this.entity)) {
                    entities.push(e);
                }

                if (entities.length > 0) {
                    return new tree.Expression(entities);
                }
            },
            property: function() {
                var name = $(/^(([a-z][-a-z_0-9]*\/)?\*?-?[-a-z_0-9]+)\s*:/);
                if (name) return name[1];
            }
        }
    };
    return parser;
};

},{"./tree":7,"underscore":44}],4:[function(require,module,exports){
var _ = require('underscore');
var carto = require('./index');

carto.Renderer = function Renderer(env, options) {
    this.env = env || {};
    this.options = options || {};
    this.options.mapnik_version = this.options.mapnik_version || '3.0.0';
};

/**
 * Prepare a MSS document (given as an string) into a
 * XML Style fragment (mostly useful for debugging)
 *
 * @param {String} data the mss contents as a string.
 */
carto.Renderer.prototype.renderMSS = function render(data) {
    // effects is a container for side-effects, which currently
    // are limited to FontSets.
    var env = _(this.env).defaults({
        benchmark: false,
        validation_data: false,
        effects: []
    });

    if (!carto.tree.Reference.setVersion(this.options.mapnik_version)) {
        throw new Error("Could not set mapnik version to " + this.options.mapnik_version);
    }

    var output = [];
    var styles = [];

    if (env.benchmark) console.time('Parsing MSS');
    var parser = (carto.Parser(env)).parse(data);
    if (env.benchmark) console.timeEnd('Parsing MSS');

    if (env.benchmark) console.time('Rule generation');
    var rule_list = parser.toList(env);
    if (env.benchmark) console.timeEnd('Rule generation');

    if (env.benchmark) console.time('Rule inheritance');
    var rules = inheritDefinitions(rule_list, env);
    if (env.benchmark) console.timeEnd('Rule inheritance');

    if (env.benchmark) console.time('Style sort');
    var sorted = sortStyles(rules,env);
    if (env.benchmark) console.timeEnd('Style sort');

    if (env.benchmark) console.time('Total Style generation');
    for (var k = 0, rule, style_name; k < sorted.length; k++) {
        rule = sorted[k];
        style_name = 'style' + (rule.attachment !== '__default__' ? '-' + rule.attachment : '');
        styles.push(style_name);
        var bench_name = '\tStyle "'+style_name+'" (#'+k+') toXML';
        if (env.benchmark) console.time(bench_name);
        // env.effects can be modified by this call
        output.push(carto.tree.StyleXML(style_name, rule.attachment, rule, env));
        if (env.benchmark) console.timeEnd(bench_name);
    }
    if (env.benchmark) console.timeEnd('Total Style generation');
    if (env.errors) throw env.errors;
    return output.join('\n');
};

/**
 * Prepare a MML document (given as an object) into a
 * fully-localized XML file ready for Mapnik2 consumption
 *
 * @param {String} m - the JSON file as a string.
 */
carto.Renderer.prototype.render = function render(m) {
    // effects is a container for side-effects, which currently
    // are limited to FontSets.
    var env = _(this.env).defaults({
        benchmark: false,
        validation_data: false,
        effects: [],
        ppi: 90.714
    });

    if (!carto.tree.Reference.setVersion(this.options.mapnik_version)) {
        throw new Error("Could not set mapnik version to " + this.options.mapnik_version);
    }

    var output = [];

    // Transform stylesheets into definitions.
    var definitions = _(m.Stylesheet).chain()
        .map(function(s) {
            if (typeof s == 'string') {
                throw new Error("Stylesheet object is expected not a string: '" + s + "'");
            }
            // Passing the environment from stylesheet to stylesheet,
            // allows frames and effects to be maintained.
            env = _(env).extend({filename:s.id});

            var time = +new Date(),
                root = (carto.Parser(env)).parse(s.data);
            if (env.benchmark)
                console.warn('Parsing time: ' + (new Date() - time) + 'ms');
            return root.toList(env);
        })
        .flatten()
        .value();

    function appliesTo(name, classIndex) {
        return function(definition) {
            return definition.appliesTo(l.name, classIndex);
        };
    }

    // Iterate through layers and create styles custom-built
    // for each of them, and apply those styles to the layers.
    var styles, l, classIndex, rules, sorted, matching;
    for (var i = 0; i < m.Layer.length; i++) {
        l = m.Layer[i];
        styles = [];
        classIndex = {};

        if (env.benchmark) console.warn('processing layer: ' + l.id);
        // Classes are given as space-separated alphanumeric strings.
        var classes = (l['class'] || '').split(/\s+/g);
        for (var j = 0; j < classes.length; j++) {
            classIndex[classes[j]] = true;
        }
        matching = definitions.filter(appliesTo(l.name, classIndex));
        rules = inheritDefinitions(matching, env);
        sorted = sortStyles(rules, env);

        for (var k = 0, rule, style_name; k < sorted.length; k++) {
            rule = sorted[k];
            style_name = l.name + (rule.attachment !== '__default__' ? '-' + rule.attachment : '');

            // env.effects can be modified by this call
            var styleXML = carto.tree.StyleXML(style_name, rule.attachment, rule, env);

            if (styleXML) {
                output.push(styleXML);
                styles.push(style_name);
            }
        }

        output.push(carto.tree.LayerXML(l, styles));
    }

    output.unshift(env.effects.map(function(e) {
        return e.toXML(env);
    }).join('\n'));

    var map_properties = getMapProperties(m, definitions, env);

    // Exit on errors.
    if (env.errors) throw env.errors;

    // Pass TileJSON and other custom parameters through to Mapnik XML.
    var parameters = _(m).reduce(function(memo, v, k) {
        if (!v && v !== 0) return memo;

        switch (k) {
        // Known skippable properties.
        case 'srs':
        case 'Layer':
        case 'Stylesheet':
            break;
        // Non URL-bound TileJSON properties.
        case 'bounds':
        case 'center':
        case 'minzoom':
        case 'maxzoom':
        case 'version':
            memo.push('  <Parameter name="' + k + '">' + v + '</Parameter>');
            break;
        // Properties that require CDATA.
        case 'name':
        case 'description':
        case 'legend':
        case 'attribution':
        case 'template':
            memo.push('  <Parameter name="' + k + '"><![CDATA[' + v + ']]></Parameter>');
            break;
        // Mapnik image format.
        case 'format':
            memo.push('  <Parameter name="' + k + '">' + v + '</Parameter>');
            break;
        // Mapnik interactivity settings.
        case 'interactivity':
            memo.push('  <Parameter name="interactivity_layer">' + v.layer + '</Parameter>');
            memo.push('  <Parameter name="interactivity_fields">' + v.fields + '</Parameter>');
            break;
        // Support any additional scalar properties.
        default:
            if ('string' === typeof v) {
                memo.push('  <Parameter name="' + k + '"><![CDATA[' + v + ']]></Parameter>');
            } else if ('number' === typeof v) {
                memo.push('  <Parameter name="' + k + '">' + v + '</Parameter>');
            } else if ('boolean' === typeof v) {
                memo.push('  <Parameter name="' + k + '">' + v + '</Parameter>');
            }
            break;
        }
        return memo;
    }, []);
    if (parameters.length) output.unshift(
        '<Parameters>\n' +
        parameters.join('\n') +
        '\n</Parameters>\n'
    );

    var properties = _(map_properties).map(function(v) { return ' ' + v; }).join('');

    output.unshift(
        '<?xml version="1.0" ' +
        'encoding="utf-8"?>\n' +
        '<!DOCTYPE Map[]>\n' +
        '<Map' + properties +'>\n');
    output.push('</Map>');
    return output.join('\n');
};

/**
 * This function currently modifies 'current'
 * @param {Array}  current  current list of rules
 * @param {Object} definition a Definition object to add to the rules
 * @param {Object} byFilter an object/dictionary of existing filters. This is
 * actually keyed `attachment->filter`
 * @param {Object} env the current environment
*/
function addRules(current, definition, byFilter, env) {
    var newFilters = definition.filters,
        newRules = definition.rules,
        updatedFilters, clone, previous;

    // The current definition might have been split up into
    // multiple definitions already.
    for (var k = 0; k < current.length; k++) {
        updatedFilters = current[k].filters.cloneWith(newFilters);
        if (updatedFilters) {
            previous = byFilter[updatedFilters];
            if (previous) {
                // There's already a definition with those exact
                // filters. Add the current definitions' rules
                // and stop processing it as the existing rule
                // has already gone down the inheritance chain.
                previous.addRules(newRules);
            } else {
                clone = current[k].clone(updatedFilters);
                // Make sure that we're only maintaining the clone
                // when we did actually add rules. If not, there's
                // no need to keep the clone around.
                if (clone.addRules(newRules)) {
                    // We inserted an element before this one, so we need
                    // to make sure that in the next loop iteration, we're
                    // not performing the same task for this element again,
                    // hence the k++.
                    byFilter[updatedFilters] = clone;
                    current.splice(k, 0, clone);
                    k++;
                }
            }
        } else if (updatedFilters === null) {
            // if updatedFilters is null, then adding the filters doesn't
            // invalidate or split the selector, so we addRules to the
            // combined selector

            // Filters can be added, but they don't change the
            // filters. This means we don't have to split the
            // definition.
            //
            // this is cloned here because of shared classes, see
            // sharedclass.mss
            current[k] = current[k].clone();
            current[k].addRules(newRules);
        }
        // if updatedFeatures is false, then the filters split the rule,
        // so they aren't the same inheritance chain
    }
    return current;
}

/**
 * Apply inherited styles from their ancestors to them.
 *
 * called either once per render (in the case of mss) or per layer
 * (for mml)
 *
 * @param {Object} definitions - a list of definitions objects
 *   that contain .rules
 * @param {Object} env - the environment
 * @return {Array<Array>} an array of arrays is returned,
 *   in which each array refers to a specific attachment
 */
function inheritDefinitions(definitions, env) {
    var inheritTime = +new Date();
    // definitions are ordered by specificity,
    // high (index 0) to low
    var byAttachment = {},
        byFilter = {};
    var result = [];
    var current, previous, attachment;

    // Evaluate the filters specified by each definition with the given
    // environment to correctly resolve variable references
    definitions.forEach(function(d) {
        d.filters.ev(env);
    });

    for (var i = 0; i < definitions.length; i++) {

        attachment = definitions[i].attachment;
        current = [definitions[i]];

        if (!byAttachment[attachment]) {
            byAttachment[attachment] = [];
            byAttachment[attachment].attachment = attachment;
            byFilter[attachment] = {};
            result.push(byAttachment[attachment]);
        }

        // Iterate over all subsequent rules.
        for (var j = i + 1; j < definitions.length; j++) {
            if (definitions[j].attachment === attachment) {
                // Only inherit rules from the same attachment.
                current = addRules(current, definitions[j], byFilter[attachment], env);
            }
        }

        for (var k = 0; k < current.length; k++) {
            byFilter[attachment][current[k].filters] = current[k];
            byAttachment[attachment].push(current[k]);
        }
    }

    if (env.benchmark) console.warn('Inheritance time: ' + ((new Date() - inheritTime)) + 'ms');

    return result;

}

// Sort styles by the minimum index of their rules.
// This sorts a slice of the styles, so it returns a sorted
// array but does not change the input.
function sortStylesIndex(a, b) { return b.index - a.index; }
function sortStyles(styles, env) {
    for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        style.index = Infinity;
        for (var b = 0; b < style.length; b++) {
            var rules = style[b].rules;
            for (var r = 0; r < rules.length; r++) {
                var rule = rules[r];
                if (rule.index < style.index) {
                    style.index = rule.index;
                }
            }
        }
    }

    var result = styles.slice();
    result.sort(sortStylesIndex);
    return result;
}

/**
 * Find a rule like Map { background-color: #fff; },
 * if any, and return a list of properties to be inserted
 * into the <Map element of the resulting XML. Translates
 * properties of the mml object at `m` directly into XML
 * properties.
 *
 * @param {Object} m the mml object.
 * @param {Array} definitions the output of toList.
 * @param {Object} env
 * @return {String} rendered properties.
 */
function getMapProperties(m, definitions, env) {
    var rules = {};
    var symbolizers = carto.tree.Reference.data.symbolizers.map;

    _(m).each(function(value, key) {
        if (key in symbolizers) rules[key] = key + '="' + value + '"';
    });

    definitions.filter(function(r) {
        return r.elements.join('') === 'Map';
    }).forEach(function(r) {
        for (var i = 0; i < r.rules.length; i++) {
            var key = r.rules[i].name;
            if (!(key in symbolizers)) {
                env.error({
                    message: 'Rule ' + key + ' not allowed for Map.',
                    index: r.rules[i].index
                });
            }
            rules[key] = r.rules[i].ev(env).toXML(env);
        }
    });
    return rules;
}

module.exports = carto;
module.exports.addRules = addRules;
module.exports.inheritDefinitions = inheritDefinitions;
module.exports.sortStyles = sortStyles;

},{"./index":2,"underscore":44}],5:[function(require,module,exports){
(function(carto) {
var tree = require('./tree');
var _ = require('underscore');


function CartoCSS(style, options) {
  this.options = options || {};
  if(style) {
    this.setStyle(style);
  }
}

CartoCSS.Layer = function(shader, options) {
  this.options = options;
  this.shader = shader;
};


CartoCSS.Layer.prototype = {

  fullName: function() {
    return this.shader.attachment;
  },

  name: function() {
    return this.fullName().split('::')[0];
  },

  // frames this layer need to be rendered
  frames: function() {
    return this.shader.frames;
  },

  attachment: function() {
    return this.fullName().split('::')[1];
  },

  eval: function(prop) {
    var p = this.shader[prop];
    if (!p || !p.style) return;
    return p.style({}, { zoom: 0, 'frame-offset': 0 });
  },

  /*
   * `props`: feature properties
   * `context`: rendering properties, i.e zoom
   */
  getStyle: function(props, context) {
    var style = {};
    for(var i in this.shader) {
      if(i !== 'attachment' && i !== 'zoom' && i !== 'frames' && i !== 'symbolizers') {
        style[i] = this.shader[i].style(props, context);
      }
    }
    return style;
  },

  /**
   * return the symbolizers that need to be rendered with 
   * this style. The order is the rendering order.
   * @returns a list with 3 possible values 'line', 'marker', 'polygon'
   */
  getSymbolizers: function() {
    return this.shader.symbolizers;
  },

  /**
   * returns if the style varies with some feature property.
   * Useful to optimize rendering
   */
  isVariable: function() {
    for(var i in this.shader) {
      if(i !== 'attachment' && i !== 'zoom' && i !== 'frames' && i !== 'symbolizers') {
        if (!this.shader[i].constant) {
          return true;
        }
      }
    }
    return false;
  },

  getShader: function() {
    return this.shader;
  },

  /**
   * returns true if a feature needs to be rendered
   */
  filter: function(featureType, props, context) {
    for(var i in this.shader) {
     var s = this.shader[i](props, context);
     if(s) {
       return true;
     }
    }
    return false;
  },

  //
  // given a geoemtry type returns the transformed one acording the CartoCSS
  // For points there are two kind of types: point and sprite, the first one 
  // is a circle, second one is an image sprite
  //
  // the other geometry types are the same than geojson (polygon, linestring...)
  //
  transformGeometry: function(type) {
    return type;
  },

  transformGeometries: function(geojson) {
    return geojson;
  }

};

CartoCSS.prototype = {

  setStyle: function(style) {
    var layers = this.parse(style);
    if(!layers) {
      throw new Error(this.parse_env.errors);
    }
    this.layers = layers.map(function(shader) {
        return new CartoCSS.Layer(shader);
    });
  },

  getLayers: function() {
    return this.layers;
  },

  getDefault: function() {
    return this.findLayer({ attachment: '__default__' });
  },

  findLayer: function(where) {
    return _.find(this.layers, function(value) {
      for (var key in where) {
        var v = value[key];
        if (typeof(v) === 'function') {
          v = v.call(value);
        }
        if (where[key] !== v) return false;
      }
      return true;
    });
  },

  _createFn: function(ops) {
    var body = ops.join('\n');
    if(this.options.debug) console.log(body);
    return Function("data","ctx", "var _value = null; " +  body + "; return _value; ");
  },

  _compile: function(shader) {
    if(typeof shader === 'string') {
        shader = eval("(function() { return " + shader +"; })()");
    }
    this.shader_src = shader;
    for(var attr in shader) {
        var c = mapper[attr];
        if(c) {
            this.compiled[c] = eval("(function() { return shader[attr]; })();");
        }
    }
  },

  parse: function(cartocss) {
    var parse_env = {
      frames: [],
      errors: [],
      error: function(obj) {
        this.errors.push(obj);
      }
    };
    this.parse_env = parse_env;

    var ruleset = null;
    try {
      ruleset = (new carto.Parser(parse_env)).parse(cartocss);
    } catch(e) {
      // add the style.mss string to match the response from the server
      parse_env.errors.push(e.message);
      return;
    }
    if(ruleset) {

      function defKey(def) {
        return def.elements[0] + "::" + def.attachment;
      }
      var defs = ruleset.toList(parse_env);
      defs.reverse();
      // group by elements[0].value::attachment
      var layers = {};
      for(var i = 0; i < defs.length; ++i) {
        var def = defs[i];
        var key = defKey(def);
        var layer = layers[key] = (layers[key] || {
          symbolizers: []
        });
        layer.frames = [];
        layer.zoom = tree.Zoom.all;
        var props = def.toJS(parse_env);
        if (this.options.debug) console.log("props", props);
        for(var v in props) {
          var lyr = layer[v] = layer[v] || {
            constant: false,
            symbolizer: null,
            js: [],
            index: 0
          };
          // build javascript statements
          lyr.js.push(props[v].map(function(a) { return a.js; }).join('\n'));
          // get symbolizer for prop
          lyr.symbolizer = _.first(props[v].map(function(a) { return a.symbolizer; }));
          // serach the max index to know rendering order
          lyr.index = _.max(props[v].map(function(a) { return a.index; }).concat(lyr.index));
          lyr.constant = !_.any(props[v].map(function(a) { return !a.constant; }));
        }
      }

      var ordered_layers = [];
      if (this.options.debug) console.log(layers);

      var done = {};
      for(var i = 0; i < defs.length; ++i) {
        var def = defs[i];
        var k = defKey(def);
        var layer = layers[k];
        if(!done[k]) {
          if(this.options.debug) console.log("**", k);
          for(var prop in layer) {
            if (prop !== 'zoom' && prop !== 'frames' && prop !== 'symbolizers') {
              if(this.options.debug) console.log("*", prop);
              layer[prop].style = this._createFn(layer[prop].js);
              layer.symbolizers.push(layer[prop].symbolizer);
              layer.symbolizers = _.uniq(layer.symbolizers);
            }
          }
          layer.attachment = k;
          ordered_layers.push(layer);
          done[k] = true;
        }
        layer.zoom |= def.zoom;
        layer.frames.push(def.frame_offset);
      }

      // uniq the frames
      for(i = 0; i < ordered_layers.length; ++i) {
        ordered_layers[i].frames = _.uniq(ordered_layers[i].frames);
      }

      return ordered_layers;

    }
    return null;
  }
};


carto.RendererJS = function (options) {
    this.options = options || {};
    this.options.mapnik_version = this.options.mapnik_version || 'latest';
};

// Prepare a javascript object which contains the layers
carto.RendererJS.prototype.render = function render(cartocss, callback) {
    var reference = require('./torque-reference');
    tree.Reference.setData(reference.version.latest);
    return new CartoCSS(cartocss, this.options);
}

if(typeof(module) !== 'undefined') {
  module.exports = carto.RendererJS;
}


})(require('../carto'));

},{"../carto":2,"./torque-reference":6,"./tree":7,"underscore":44}],6:[function(require,module,exports){
var _mapnik_reference_latest = {
    "version": "2.1.1",
    "style": {
        "filter-mode": {
            "type": [
                "all",
                "first"
            ],
            "doc": "Control the processing behavior of Rule filters within a Style. If 'all' is used then all Rules are processed sequentially independent of whether any previous filters matched. If 'first' is used then it means processing ends after the first match (a positive filter evaluation) and no further Rules in the Style are processed ('first' is usually the default for CSS implementations on top of Mapnik to simplify translation from CSS to Mapnik XML)",
            "default-value": "all",
            "default-meaning": "All Rules in a Style are processed whether they have filters or not and whether or not the filter conditions evaluate to true."
        },
        "image-filters": {
            "css": "image-filters",
            "default-value": "none",
            "default-meaning": "no filters",
            "type": "functions",
            "functions": [
                ["agg-stack-blur", 2],
                ["emboss", 0],
                ["blur", 0],
                ["gray", 0],
                ["sobel", 0],
                ["edge-detect", 0],
                ["x-gradient", 0],
                ["y-gradient", 0],
                ["invert", 0],
                ["sharpen", 0]
            ],
            "doc": "A list of image filters."
        },
        "comp-op": {
            "css": "comp-op",
            "default-value": "src-over",
            "default-meaning": "add the current layer on top of other layers",
            "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
            "type": ["clear",
                "src",
                "dst",
                "src-over",
                "source-over", // added for torque
                "dst-over",
                "src-in",
                "dst-in",
                "src-out",
                "dst-out",
                "src-atop",
                "dst-atop",
                "xor",
                "plus",
                "minus",
                "multiply",
                "screen",
                "overlay",
                "darken",
                "lighten",
                "lighter", // added for torque
                "color-dodge",
                "color-burn",
                "hard-light",
                "soft-light",
                "difference",
                "exclusion",
                "contrast",
                "invert",
                "invert-rgb",
                "grain-merge",
                "grain-extract",
                "hue",
                "saturation",
                "color",
                "value"
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
    "layer" : {
        "name": {
            "default-value": "",
            "type":"string",
            "required" : true,
            "default-meaning": "No layer name has been provided",
            "doc": "The name of a layer. Can be anything you wish and is not strictly validated, but ideally unique  in the map"
        },
        "srs": {
            "default-value": "",
            "type":"string",
            "default-meaning": "No srs value is provided and the value will be inherited from the Map's srs",
            "doc": "The spatial reference system definition for the layer, aka the projection. Can either be a proj4 literal string like '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs' or, if the proper proj4 epsg/nad/etc identifier files are installed, a string that uses an id like: '+init=epsg:4326'"
        },
        "status": {
            "default-value": true,
            "type":"boolean",
            "default-meaning": "This layer will be marked as active and available for processing",
            "doc": "A property that can be set to false to disable this layer from being processed"
        },
        "minzoom": {
            "default-value": "0",
            "type":"float",
            "default-meaning": "The layer will be visible at the minimum possible scale",
            "doc": "The minimum scale denominator that this layer will be visible at. A layer's visibility is determined by whether its status is true and if the Map scale >= minzoom - 1e-6 and scale < maxzoom + 1e-6"
        },
        "maxzoom": {
            "default-value": "1.79769e+308",
            "type":"float",
            "default-meaning": "The layer will be visible at the maximum possible scale",
            "doc": "The maximum scale denominator that this layer will be visible at. The default is the numeric limit of the C++ double type, which may vary slightly by system, but is likely a massive number like 1.79769e+308 and ensures that this layer will always be visible unless the value is reduced. A layer's visibility is determined by whether its status is true and if the Map scale >= minzoom - 1e-6 and scale < maxzoom + 1e-6"
        },
        "queryable": {
            "default-value": false,
            "type":"boolean",
            "default-meaning": "The layer will not be available for the direct querying of data values",
            "doc": "This property was added for GetFeatureInfo/WMS compatibility and is rarely used. It is off by default meaning that in a WMS context the layer will not be able to be queried unless the property is explicitly set to true"
        },
        "clear-label-cache": {
            "default-value": false,
            "type":"boolean",
            "default-meaning": "The renderer's collision detector cache (used for avoiding duplicate labels and overlapping markers) will not be cleared immediately before processing this layer",
            "doc": "This property, by default off, can be enabled to allow a user to clear the collision detector cache before a given layer is processed. This may be desirable to ensure that a given layers data shows up on the map even if it normally would not because of collisions with previously rendered labels or markers"
        },
        "group-by": {
            "default-value": "",
            "type":"string",
            "default-meaning": "No special layer grouping will be used during rendering",
            "doc": "https://github.com/mapnik/mapnik/wiki/Grouped-rendering"
        },
        "buffer-size": {
            "default-value": "0",
            "type":"float",
            "default-meaning": "No buffer will be used",
            "doc": "Extra tolerance around the Layer extent (in pixels) used to when querying and (potentially) clipping the layer data during rendering"
        },
        "maximum-extent": {
            "default-value": "none",
            "type":"bbox",
            "default-meaning": "No clipping extent will be used",
            "doc": "An extent to be used to limit the bounds used to query this specific layer data during rendering. Should be minx, miny, maxx, maxy in the coordinates of the Layer."
        }
    },
    "symbolizers" : {
        "*": {
            "image-filters": {
                "css": "image-filters",
                "default-value": "none",
                "default-meaning": "no filters",
                "type": "functions",
                "functions": [
                    ["agg-stack-blur", 2],
                    ["emboss", 0],
                    ["blur", 0],
                    ["gray", 0],
                    ["sobel", 0],
                    ["edge-detect", 0],
                    ["x-gradient", 0],
                    ["y-gradient", 0],
                    ["invert", 0],
                    ["sharpen", 0]
                ],
                "doc": "A list of image filters."
            },
            "comp-op": {
                "css": "comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current layer on top of other layers",
                "doc": "Composite operation. This defines how this layer should behave relative to layers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "source-over", // added for torque
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "lighter", // added for torque
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
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
        "map": {
            "background-color": {
                "css": "background-color",
                "default-value": "none",
                "default-meaning": "transparent",
                "type": "color",
                "doc": "Map Background color"
            },
            "background-image": {
                "css": "background-image",
                "type": "uri",
                "default-value": "",
                "default-meaning": "transparent",
                "doc": "An image that is repeated below all features on a map as a background.",
                "description": "Map Background image"
            },
            "srs": {
                "css": "srs",
                "type": "string",
                "default-value": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs",
                "default-meaning": "The proj4 literal of EPSG:4326 is assumed to be the Map's spatial reference and all data from layers within this map will be plotted using this coordinate system. If any layers do not declare an srs value then they will be assumed to be in the same srs as the Map and not transformations will be needed to plot them in the Map's coordinate space",
                "doc": "Map spatial reference (proj4 string)"
            },
            "buffer-size": {
                "css": "buffer-size",
                "default-value": "0",
                "type":"float",
                "default-meaning": "No buffer will be used",
                "doc": "Extra tolerance around the map (in pixels) used to ensure labels crossing tile boundaries are equally rendered in each tile (e.g. cut in each tile). Not intended to be used in combination with \"avoid-edges\"."
            },
            "maximum-extent": {
                "css": "",
                "default-value": "none",
                "type":"bbox",
                "default-meaning": "No clipping extent will be used",
                "doc": "An extent to be used to limit the bounds used to query all layers during rendering. Should be minx, miny, maxx, maxy in the coordinates of the Map."
            },
            "base": {
                "css": "base",
                "default-value": "",
                "default-meaning": "This base path defaults to an empty string meaning that any relative paths to files referenced in styles or layers will be interpreted relative to the application process.",
                "type": "string",
                "doc": "Any relative paths used to reference files will be understood as relative to this directory path if the map is loaded from an in memory object rather than from the filesystem. If the map is loaded from the filesystem and this option is not provided it will be set to the directory of the stylesheet."
            },
            "paths-from-xml": {
                "css": "",
                "default-value": true,
                "default-meaning": "Paths read from XML will be interpreted from the location of the XML",
                "type": "boolean",
                "doc": "value to control whether paths in the XML will be interpreted from the location of the XML or from the working directory of the program that calls load_map()"
            },
            "minimum-version": {
                "css": "",
                "default-value": "none",
                "default-meaning": "Mapnik version will not be detected and no error will be thrown about compatibility",
                "type": "string",
                "doc": "The minumum Mapnik version (e.g. 0.7.2) needed to use certain functionality in the stylesheet"
            },
            "font-directory": {
                "css": "font-directory",
                "type": "uri",
                "default-value": "none",
                "default-meaning": "No map-specific fonts will be registered",
                "doc": "Path to a directory which holds fonts which should be registered when the Map is loaded (in addition to any fonts that may be automatically registered)."
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
            },
            "gamma": {
                "css": "polygon-gamma",
                "type": "float",
                "default-value": 1,
                "default-meaning": "fully antialiased",
                "range": "0-1",
                "doc": "Level of antialiasing of polygon edges"
            },
            "gamma-method": {
                "css": "polygon-gamma-method",
                "type": [
                    "power",
                    "linear",
                    "none",
                    "threshold",
                    "multiply"
                ],
                "default-value": "power",
                "default-meaning": "pow(x,gamma) is used to calculate pixel gamma, which produces slightly smoother line and polygon antialiasing than the 'linear' method, while other methods are usually only used to disable AA",
                "doc": "An Antigrain Geometry specific rendering hint to control the quality of antialiasing. Under the hood in Mapnik this method is used in combination with the 'gamma' value (which defaults to 1). The methods are in the AGG source at https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h"
            },
            "clip": {
                "css": "polygon-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "polygon-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "polygon-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "polygon-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
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
            },
            "stroke-gamma": {
                "css": "line-gamma",
                "type": "float",
                "default-value": 1,
                "default-meaning": "fully antialiased",
                "range": "0-1",
                "doc": "Level of antialiasing of stroke line"
            },
            "stroke-gamma-method": {
                "css": "line-gamma-method",
                "type": [
                    "power",
                    "linear",
                    "none",
                    "threshold",
                    "multiply"
                ],
                "default-value": "power",
                "default-meaning": "pow(x,gamma) is used to calculate pixel gamma, which produces slightly smoother line and polygon antialiasing than the 'linear' method, while other methods are usually only used to disable AA",
                "doc": "An Antigrain Geometry specific rendering hint to control the quality of antialiasing. Under the hood in Mapnik this method is used in combination with the 'gamma' value (which defaults to 1). The methods are in the AGG source at https://github.com/mapnik/mapnik/blob/master/deps/agg/include/agg_gamma_functions.h"
            },
            "stroke-dasharray": {
                "css": "line-dasharray",
                "type": "numbers",
                "doc": "A pair of length values [a,b], where (a) is the dash length and (b) is the gap length respectively. More than two values are supported for more complex patterns.",
                "default-value": "none",
                "default-meaning": "solid line"
            },
            "stroke-dashoffset": {
                "css": "line-dash-offset",
                "type": "numbers",
                "doc": "valid parameter but not currently used in renderers (only exists for experimental svg support in Mapnik which is not yet enabled)",
                "default-value": "none",
                "default-meaning": "solid line"
            },
            "stroke-miterlimit": {
                "css": "line-miterlimit",
                "type": "float",
                "doc": "The limit on the ratio of the miter length to the stroke-width. Used to automatically convert miter joins to bevel joins for sharp angles to avoid the miter extending beyond the thickness of the stroking path. Normally will not need to be set, but a larger value can sometimes help avoid jaggy artifacts.",
                "default-value": 4.0,
                "default-meaning": "Will auto-convert miters to bevel line joins when theta is less than 29 degrees as per the SVG spec: 'miterLength / stroke-width = 1 / sin ( theta / 2 )'"
            },
            "clip": {
                "css": "line-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "line-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "offset": {
                "css": "line-offset",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no offset",
                "doc": "Offsets a line a number of pixels parallel to its actual path. Postive values move the line left, negative values move it right (relative to the directionality of the line)."
            },
            "rasterizer": {
                "css": "line-rasterizer",
                "type": [
                    "full",
                    "fast"
                ],
                "default-value": "full",
                "doc": "Exposes an alternate AGG rendering method that sacrifices some accuracy for speed."
            },
            "geometry-transform": {
                "css": "line-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "line-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
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
            "placement": {
                "css": "marker-placement",
                "type": [
                    "point",
                    "line",
                    "interior"
                ],
                "default-value": "point",
                "default-meaning": "Place markers at the center point (centroid) of the geometry",
                "doc": "Attempt to place markers on a point, in the center of a polygon, or if markers-placement:line, then multiple times along a line. 'interior' placement can be used to ensure that points placed on polygons are forced to be inside the polygon interior"
            },
            "multi-policy": {
                "css": "marker-multi-policy",
                "type": [
                    "each",
                    "whole",
                    "largest"
                ],
                "default-value": "each",
                "default-meaning": "If a feature contains multiple geometries and the placement type is either point or interior then a marker will be rendered for each",
                "doc": "A special setting to allow the user to control rendering behavior for 'multi-geometries' (when a feature contains multiple geometries). This setting does not apply to markers placed along lines. The 'each' policy is default and means all geometries will get a marker. The 'whole' policy means that the aggregate centroid between all geometries will be used. The 'largest' policy means that only the largest (by bounding box areas) feature will get a rendered marker (this is how text labeling behaves by default)."
            },
            "marker-type": {
                "css": "marker-type",
                "type": [
                    "arrow",
                    "ellipse",
                    "rectangle"
                ],
                "default-value": "ellipse",
                "doc": "The default marker-type. If a SVG file is not given as the marker-file parameter, the renderer provides either an arrow or an ellipse (a circle if height is equal to width)"
            },
            "width": {
                "css": "marker-width",
                "default-value": 10,
                "doc": "The width of the marker, if using one of the default types.",
                "type": "expression"
            },
            "height": {
                "css": "marker-height",
                "default-value": 10,
                "doc": "The height of the marker, if using one of the default types.",
                "type": "expression"
            },
            "fill": {
                "css": "marker-fill",
                "default-value": "blue",
                "doc": "The color of the area of the marker.",
                "type": "color"
            },
            "allow-overlap": {
                "css": "marker-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping markers are shown or hidden.",
                "default-meaning": "Do not allow makers to overlap with each other - overlapping markers will not be shown."
            },
            "ignore-placement": {
                "css": "marker-ignore-placement",
                "type": "boolean",
                "default-value": false,
                "default-meaning": "do not store the bbox of this geometry in the collision detector cache",
                "doc": "value to control whether the placement of the feature will prevent the placement of other features"
            },
            "spacing": {
                "css": "marker-spacing",
                "doc": "Space between repeated labels",
                "default-value": 100,
                "type": "float"
            },
            "max-error": {
                "css": "marker-max-error",
                "type": "float",
                "default-value": 0.2,
                "doc": "The maximum difference between actual marker placement and the marker-spacing parameter. Setting a high value can allow the renderer to try to resolve placement conflicts with other symbolizers."
            },
            "transform": {
                "css": "marker-transform",
                "type": "functions",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ],
                "default-value": "",
                "default-meaning": "No transformation",
                "doc": "SVG transformation definition"
            },
            "clip": {
                "css": "marker-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "marker-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "marker-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "marker-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "shield": {
            "name": {
                "css": "shield-name",
                "type": "expression",
                "serialization": "content",
                "doc": "Value to use for a shield\"s text label. Data columns are specified using brackets like [column_name]"
            },
            "file": {
                "css": "shield-file",
                "required": true,
                "type": "uri",
                "default-value": "none",
                "doc": "Image file to render behind the shield text"
            },
            "face-name": {
                "css": "shield-face-name",
                "type": "string",
                "validate": "font",
                "doc": "Font name and style to use for the shield text",
                "default-value": "",
                "required": true
            },
            "unlock-image": {
                "css": "shield-unlock-image",
                "type": "boolean",
                "doc": "This parameter should be set to true if you are trying to position text beside rather than on top of the shield image",
                "default-value": false,
                "default-meaning": "text alignment relative to the shield image uses the center of the image as the anchor for text positioning."
            },
            "size": {
                "css": "shield-size",
                "type": "float",
                "doc": "The size of the shield text in pixels"
            },
            "fill": {
                "css": "shield-fill",
                "type": "color",
                "doc": "The color of the shield text"
            },
            "placement": {
                "css": "shield-placement",
                "type": [
                    "point",
                    "line",
                    "vertex",
                    "interior"
                ],
                "default-value": "point",
                "doc": "How this shield should be placed. Point placement attempts to place it on top of points, line places along lines multiple times per feature, vertex places on the vertexes of polygons, and interior attempts to place inside of polygons."
            },
            "avoid-edges": {
                "css": "shield-avoid-edges",
                "doc": "Tell positioning algorithm to avoid labeling near intersection edges.",
                "type": "boolean",
                "default-value": false
            },
            "allow-overlap": {
                "css": "shield-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping shields are shown or hidden.",
                "default-meaning": "Do not allow shields to overlap with other map elements already placed."
            },
            "minimum-distance": {
                "css": "shield-min-distance",
                "type": "float",
                "default-value": 0,
                "doc": "Minimum distance to the next shield symbol, not necessarily the same shield."
            },
            "spacing": {
                "css": "shield-spacing",
                "type": "float",
                "default-value": 0,
                "doc": "The spacing between repeated occurrences of the same shield on a line"
            },
            "minimum-padding": {
                "css": "shield-min-padding",
                "default-value": 0,
                "doc": "Determines the minimum amount of padding that a shield gets relative to other shields",
                "type": "float"
            },
            "wrap-width": {
                "css": "shield-wrap-width",
                "type": "unsigned",
                "default-value": 0,
                "doc": "Length of a chunk of text in characters before wrapping text"
            },
            "wrap-before": {
                "css": "shield-wrap-before",
                "type": "boolean",
                "default-value": false,
                "doc": "Wrap text before wrap-width is reached. If false, wrapped lines will be a bit longer than wrap-width."
            },
            "wrap-character": {
                "css": "shield-wrap-character",
                "type": "string",
                "default-value": " ",
                "doc": "Use this character instead of a space to wrap long names."
            },
            "halo-fill": {
                "css": "shield-halo-fill",
                "type": "color",
                "default-value": "#FFFFFF",
                "default-meaning": "white",
                "doc": "Specifies the color of the halo around the text."
            },
            "halo-radius": {
                "css": "shield-halo-radius",
                "doc": "Specify the radius of the halo in pixels",
                "default-value": 0,
                "default-meaning": "no halo",
                "type": "float"
            },
            "character-spacing": {
                "css": "shield-character-spacing",
                "type": "unsigned",
                "default-value": 0,
                "doc": "Horizontal spacing between characters (in pixels). Currently works for point placement only, not line placement."
            },
            "line-spacing": {
                "css": "shield-line-spacing",
                "doc": "Vertical spacing between lines of multiline labels (in pixels)",
                "type": "unsigned"
            },
            "dx": {
                "css": "shield-text-dx",
                "type": "float",
                "doc": "Displace text within shield by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right",
                "default-value": 0
            },
            "dy": {
                "css": "shield-text-dy",
                "type": "float",
                "doc": "Displace text within shield by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down",
                "default-value": 0
            },
            "shield-dx": {
                "css": "shield-dx",
                "type": "float",
                "doc": "Displace shield by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right",
                "default-value": 0
            },
            "shield-dy": {
                "css": "shield-dy",
                "type": "float",
                "doc": "Displace shield by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down",
                "default-value": 0
            },
            "opacity": {
                "css": "shield-opacity",
                "type": "float",
                "doc": "(Default 1.0) - opacity of the image used for the shield",
                "default-value": 1
            },
            "text-opacity": {
                "css": "shield-text-opacity",
                "type": "float",
                "doc": "(Default 1.0) - opacity of the text placed on top of the shield",
                "default-value": 1
            },
            "horizontal-alignment": {
                "css": "shield-horizontal-alignment",
                "type": [
                    "left",
                    "middle",
                    "right",
                    "auto"
                ],
                "doc": "The shield's horizontal alignment from its centerpoint",
                "default-value": "auto"
            },
            "vertical-alignment": {
                "css": "shield-vertical-alignment",
                "type": [
                    "top",
                    "middle",
                    "bottom",
                    "auto"
                ],
                "doc": "The shield's vertical alignment from its centerpoint",
                "default-value": "middle"
            },
            "text-transform": {
                "css": "shield-text-transform",
                "type": [
                    "none",
                    "uppercase",
                    "lowercase",
                    "capitalize"
                ],
                "doc": "Transform the case of the characters",
                "default-value": "none"
            },
            "justify-alignment": {
                "css": "shield-justify-alignment",
                "type": [
                    "left",
                    "center",
                    "right",
                    "auto"
                ],
                "doc": "Define how text in a shield's label is justified",
                "default-value": "auto"
            },
            "clip": {
                "css": "shield-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "comp-op": {
                "css": "shield-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "line-pattern": {
            "file": {
                "css": "line-pattern-file",
                "type": "uri",
                "default-value": "none",
                "required": true,
                "doc": "An image file to be repeated and warped along a line"
            },
            "clip": {
                "css": "line-pattern-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "line-pattern-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "line-pattern-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "line-pattern-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "polygon-pattern": {
            "file": {
                "css": "polygon-pattern-file",
                "type": "uri",
                "default-value": "none",
                "required": true,
                "doc": "Image to use as a repeated pattern fill within a polygon"
            },
            "alignment": {
                "css": "polygon-pattern-alignment",
                "type": [
                    "local",
                    "global"
                ],
                "default-value": "local",
                "doc": "Specify whether to align pattern fills to the layer or to the map."
            },
            "gamma": {
                "css": "polygon-pattern-gamma",
                "type": "float",
                "default-value": 1,
                "default-meaning": "fully antialiased",
                "range": "0-1",
                "doc": "Level of antialiasing of polygon pattern edges"
            },
            "opacity": {
                "css": "polygon-pattern-opacity",
                "type": "float",
                "doc": "(Default 1.0) - Apply an opacity level to the image used for the pattern",
                "default-value": 1,
                "default-meaning": "The image is rendered without modifications"
            },
            "clip": {
                "css": "polygon-pattern-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "smooth": {
                "css": "polygon-pattern-smooth",
                "type": "float",
                "default-value": 0,
                "default-meaning": "no smoothing",
                "range": "0-1",
                "doc": "Smooths out geometry angles. 0 is no smoothing, 1 is fully smoothed. Values greater than 1 will produce wild, looping geometries."
            },
            "geometry-transform": {
                "css": "polygon-pattern-geometry-transform",
                "type": "functions",
                "default-value": "none",
                "default-meaning": "geometry will not be transformed",
                "doc": "Allows transformation functions to be applied to the geometry.",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ]
            },
            "comp-op": {
                "css": "polygon-pattern-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "raster": {
            "opacity": {
                "css": "raster-opacity",
                "default-value": 1,
                "default-meaning": "opaque",
                "type": "float",
                "doc": "The opacity of the raster symbolizer on top of other symbolizers."
            },
            "filter-factor": {
                "css": "raster-filter-factor",
                "default-value": -1,
                "default-meaning": "Allow the datasource to choose appropriate downscaling.",
                "type": "float",
                "doc": "This is used by the Raster or Gdal datasources to pre-downscale images using overviews. Higher numbers can sometimes cause much better scaled image output, at the cost of speed."
            },
            "scaling": {
                "css": "raster-scaling",
                "type": [
                    "near",
                    "fast",
                    "bilinear",
                    "bilinear8",
                    "bicubic",
                    "spline16",
                    "spline36",
                    "hanning",
                    "hamming",
                    "hermite",
                    "kaiser",
                    "quadric",
                    "catrom",
                    "gaussian",
                    "bessel",
                    "mitchell",
                    "sinc",
                    "lanczos",
                    "blackman"
                ],
                "default-value": "near",
                "doc": "The scaling algorithm used to making different resolution versions of this raster layer. Bilinear is a good compromise between speed and accuracy, while lanczos gives the highest quality."
            },
            "mesh-size": {
                "css": "raster-mesh-size",
                "default-value": 16,
                "default-meaning": "Reprojection mesh will be 1/16 of the resolution of the source image",
                "type": "unsigned",
                "doc": "A reduced resolution mesh is used for raster reprojection, and the total image size is divided by the mesh-size to determine the quality of that mesh. Values for mesh-size larger than the default will result in faster reprojection but might lead to distortion."
            },
            "comp-op": {
                "css": "raster-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
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
            "allow-overlap": {
                "css": "point-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping points are shown or hidden.",
                "default-meaning": "Do not allow points to overlap with each other - overlapping markers will not be shown."
            },
            "ignore-placement": {
                "css": "point-ignore-placement",
                "type": "boolean",
                "default-value": false,
                "default-meaning": "do not store the bbox of this geometry in the collision detector cache",
                "doc": "value to control whether the placement of the feature will prevent the placement of other features"
            },
            "opacity": {
                "css": "point-opacity",
                "type": "float",
                "default-value": 1.0,
                "default-meaning": "Fully opaque",
                "doc": "A value from 0 to 1 to control the opacity of the point"
            },
            "placement": {
                "css": "point-placement",
                "type": [
                    "centroid",
                    "interior"
                ],
                "doc": "How this point should be placed. Centroid calculates the geometric center of a polygon, which can be outside of it, while interior always places inside of a polygon.",
                "default-value": "centroid"
            },
            "transform": {
                "css": "point-transform",
                "type": "functions",
                "functions": [
                    ["matrix", 6],
                    ["translate", 2],
                    ["scale", 2],
                    ["rotate", 3],
                    ["skewX", 1],
                    ["skewY", 1]
                ],
                "default-value": "",
                "default-meaning": "No transformation",
                "doc": "SVG transformation definition"
            },
            "comp-op": {
                "css": "point-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "text": {
            "name": {
                "css": "text-name",
                "type": "expression",
                "required": true,
                "default-value": "",
                "serialization": "content",
                "doc": "Value to use for a text label. Data columns are specified using brackets like [column_name]"
            },
            "face-name": {
                "css": "text-face-name",
                "type": "string",
                "validate": "font",
                "doc": "Font name and style to render a label in",
                "required": true
            },
            "size": {
                "css": "text-size",
                "type": "float",
                "default-value": 10,
                "doc": "Text size in pixels"
            },
            "text-ratio": {
                "css": "text-ratio",
                "doc": "Define the amount of text (of the total) present on successive lines when wrapping occurs",
                "default-value": 0,
                "type": "unsigned"
            },
            "wrap-width": {
                "css": "text-wrap-width",
                "doc": "Length of a chunk of text in characters before wrapping text",
                "default-value": 0,
                "type": "unsigned"
            },
            "wrap-before": {
                "css": "text-wrap-before",
                "type": "boolean",
                "default-value": false,
                "doc": "Wrap text before wrap-width is reached. If false, wrapped lines will be a bit longer than wrap-width."
            },
            "wrap-character": {
                "css": "text-wrap-character",
                "type": "string",
                "default-value": " ",
                "doc": "Use this character instead of a space to wrap long text."
            },
            "spacing": {
                "css": "text-spacing",
                "type": "unsigned",
                "doc": "Distance between repeated text labels on a line (aka. label-spacing)"
            },
            "character-spacing": {
                "css": "text-character-spacing",
                "type": "float",
                "default-value": 0,
                "doc": "Horizontal spacing adjustment between characters in pixels"
            },
            "line-spacing": {
                "css": "text-line-spacing",
                "default-value": 0,
                "type": "unsigned",
                "doc": "Vertical spacing adjustment between lines in pixels"
            },
            "label-position-tolerance": {
                "css": "text-label-position-tolerance",
                "default-value": 0,
                "type": "unsigned",
                "doc": "Allows the label to be displaced from its ideal position by a number of pixels (only works with placement:line)"
            },
            "max-char-angle-delta": {
                "css": "text-max-char-angle-delta",
                "type": "float",
                "default-value": "22.5",
                "doc": "The maximum angle change, in degrees, allowed between adjacent characters in a label. This value internally is converted to radians to the default is 22.5*math.pi/180.0. The higher the value the fewer labels will be placed around around sharp corners."
            },
            "fill": {
                "css": "text-fill",
                "doc": "Specifies the color for the text",
                "default-value": "#000000",
                "type": "color"
            },
            "opacity": {
                "css": "text-opacity",
                "doc": "A number from 0 to 1 specifying the opacity for the text",
                "default-value": 1.0,
                "default-meaning": "Fully opaque",
                "type": "float"
            },
            "halo-fill": {
                "css": "text-halo-fill",
                "type": "color",
                "default-value": "#FFFFFF",
                "default-meaning": "white",
                "doc": "Specifies the color of the halo around the text."
            },
            "halo-radius": {
                "css": "text-halo-radius",
                "doc": "Specify the radius of the halo in pixels",
                "default-value": 0,
                "default-meaning": "no halo",
                "type": "float"
            },
            "dx": {
                "css": "text-dx",
                "type": "float",
                "doc": "Displace text by fixed amount, in pixels, +/- along the X axis.  A positive value will shift the text right",
                "default-value": 0
            },
            "dy": {
                "css": "text-dy",
                "type": "float",
                "doc": "Displace text by fixed amount, in pixels, +/- along the Y axis.  A positive value will shift the text down",
                "default-value": 0
            },
            "vertical-alignment": {
                "css": "text-vertical-alignment",
                "type": [
                  "top",
                  "middle",
                  "bottom",
                  "auto"
                ],
                "doc": "Position of label relative to point position.",
                "default-value": "auto",
                "default-meaning": "Default affected by value of dy; \"bottom\" for dy>0, \"top\" for dy<0."
            },
            "avoid-edges": {
                "css": "text-avoid-edges",
                "doc": "Tell positioning algorithm to avoid labeling near intersection edges.",
                "default-value": false,
                "type": "boolean"
            },
            "minimum-distance": {
                "css": "text-min-distance",
                "doc": "Minimum permitted distance to the next text symbolizer.",
                "type": "float"
            },
            "minimum-padding": {
                "css": "text-min-padding",
                "doc": "Determines the minimum amount of padding that a text symbolizer gets relative to other text",
                "type": "float"
            },
            "minimum-path-length": {
                "css": "text-min-path-length",
                "type": "float",
                "default-value": 0,
                "default-meaning": "place labels on all paths",
                "doc": "Place labels only on paths longer than this value."
            },
            "allow-overlap": {
                "css": "text-allow-overlap",
                "type": "boolean",
                "default-value": false,
                "doc": "Control whether overlapping text is shown or hidden.",
                "default-meaning": "Do not allow text to overlap with other text - overlapping markers will not be shown."
            },
            "orientation": {
                "css": "text-orientation",
                "type": "expression",
                "doc": "Rotate the text."
            },
            "placement": {
                "css": "text-placement",
                "type": [
                    "point",
                    "line",
                    "vertex",
                    "interior"
                ],
                "default-value": "point",
                "doc": "Control the style of placement of a point versus the geometry it is attached to."
            },
            "placement-type": {
                "css": "text-placement-type",
                "doc": "Re-position and/or re-size text to avoid overlaps. \"simple\" for basic algorithm (using text-placements string,) \"dummy\" to turn this feature off.",
                "type": [
                    "dummy",
                    "simple"
                ],
                "default-value": "dummy"
            },
            "placements": {
                "css": "text-placements",
                "type": "string",
                "default-value": "",
                "doc": "If \"placement-type\" is set to \"simple\", use this \"POSITIONS,[SIZES]\" string. An example is `text-placements: \"E,NE,SE,W,NW,SW\";` "
            },
            "text-transform": {
                "css": "text-transform",
                "type": [
                    "none",
                    "uppercase",
                    "lowercase",
                    "capitalize"
                ],
                "doc": "Transform the case of the characters",
                "default-value": "none"
            },
            "horizontal-alignment": {
                "css": "text-horizontal-alignment",
                "type": [
                    "left",
                    "middle",
                    "right",
                    "auto"
                ],
                "doc": "The text's horizontal alignment from its centerpoint",
                "default-value": "auto"
            },
            "justify-alignment": {
                "css": "text-align",
                "type": [
                    "left",
                    "right",
                    "center",
                    "auto"
                ],
                "doc": "Define how text is justified",
                "default-value": "auto",
                "default-meaning": "Auto alignment means that text will be centered by default except when using the `placement-type` parameter - in that case either right or left justification will be used automatically depending on where the text could be fit given the `text-placements` directives"
            },
            "clip": {
                "css": "text-clip",
                "type": "boolean",
                "default-value": true,
                "default-meaning": "geometry will be clipped to map bounds before rendering",
                "doc": "geometries are clipped to map bounds by default for best rendering performance. In some cases users may wish to disable this to avoid rendering artifacts."
            },
            "comp-op": {
                "css": "text-comp-op",
                "default-value": "src-over",
                "default-meaning": "add the current symbolizer on top of other symbolizer",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": ["clear",
                    "src",
                    "dst",
                    "src-over",
                    "dst-over",
                    "src-in",
                    "dst-in",
                    "src-out",
                    "dst-out",
                    "src-atop",
                    "dst-atop",
                    "xor",
                    "plus",
                    "minus",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                    "contrast",
                    "invert",
                    "invert-rgb",
                    "grain-merge",
                    "grain-extract",
                    "hue",
                    "saturation",
                    "color",
                    "value"
                ]
            }
        },
        "building": {
            "fill": {
                "css": "building-fill",
                "default-value": "#FFFFFF",
                "doc": "The color of the buildings walls.",
                "type": "color"
            },
            "fill-opacity": {
                "css": "building-fill-opacity",
                "type": "float",
                "doc": "The opacity of the building as a whole, including all walls.",
                "default-value": 1
            },
            "height": {
                "css": "building-height",
                "doc": "The height of the building in pixels.",
                "type": "expression",
                "default-value": "0"
            }
        },
        "torque": {
          "-torque-frame-count": {
              "css": "-torque-frame-count",
              "default-value": "128",
              "type":"float",
              "default-meaning": "the data is broken into 128 time frames",
              "doc": "Number of animation steps/frames used in the animation. If the data contains a fewere number of total frames, the lesser value will be used."
          },
          "-torque-resolution": {
              "css": "-torque-resolution",
              "default-value": "2",
              "type":"float",
              "default-meaning": "",
              "doc": "Spatial resolution in pixels. A resolution of 1 means no spatial aggregation of the data. Any other resolution of N results in spatial aggregation into cells of NxN pixels. The value N must be power of 2"
          },
          "-torque-animation-duration": {
              "css": "-torque-animation-duration",
              "default-value": "30",
              "type":"float",
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
                "linear",
                "cumulative"
              ],
              "default-meaning": "previous values are discarded",
              "doc": "A linear animation will discard previous values while a cumulative animation will accumulate them until it restarts"
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
    },
    "filter": {
        "value": [
            "true",
            "false",
            "null",
            "point",
            "linestring",
            "polygon",
            "collection"
        ]
    }
}

module.exports = {
  version: {
    latest: _mapnik_reference_latest,
    '2.1.1': _mapnik_reference_latest
  }
};

},{}],7:[function(require,module,exports){
/**
 * TODO: document this. What does this do?
 */
if(typeof(module) !== "undefined") {
  module.exports.find = function (obj, fun) {
      for (var i = 0, r; i < obj.length; i++) {
          if (r = fun.call(obj, obj[i])) { return r; }
      }
      return null;
  };
}

},{}],8:[function(require,module,exports){
(function(tree) {
var _ = require('underscore');
tree.Call = function Call(name, args, index) {
    this.name = name;
    this.args = args;
    this.index = index;
};

tree.Call.prototype = {
    is: 'call',
    // When evuating a function call,
    // we either find the function in `tree.functions` [1],
    // in which case we call it, passing the  evaluated arguments,
    // or we simply print it out as it appeared originally [2].
    // The *functions.js* file contains the built-in functions.
    // The reason why we evaluate the arguments, is in the case where
    // we try to pass a variable to a function, like: `saturate(@color)`.
    // The function should receive the value, not the variable.
    'ev': function(env) {
        var args = this.args.map(function(a) { return a.ev(env); });

        for (var i = 0; i < args.length; i++) {
            if (args[i].is === 'undefined') {
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }
        }

        if (this.name in tree.functions) {
            if (tree.functions[this.name].length <= args.length) {
                var val = tree.functions[this.name].apply(tree.functions, args);
                if (val === null) {
                    env.error({
                        message: 'incorrect arguments given to ' + this.name + '()',
                        index: this.index,
                        type: 'runtime',
                        filename: this.filename
                    });
                    return { is: 'undefined', value: 'undefined' };
                }
                return val;
            } else {
                env.error({
                    message: 'incorrect number of arguments for ' + this.name +
                        '(). ' + tree.functions[this.name].length + ' expected.',
                    index: this.index,
                    type: 'runtime',
                    filename: this.filename
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }
        } else {
            var fn = tree.Reference.mapnikFunctions[this.name];
            if (fn === undefined) {
                var functions = _.pairs(tree.Reference.mapnikFunctions);
                // cheap closest, needs improvement.
                var name = this.name;
                var mean = functions.map(function(f) {
                    return [f[0], tree.Reference.editDistance(name, f[0]), f[1]];
                }).sort(function(a, b) {
                    return a[1] - b[1];
                });
                env.error({
                    message: 'unknown function ' + this.name + '(), did you mean ' +
                        mean[0][0] + '(' + mean[0][2] + ')',
                    index: this.index,
                    type: 'runtime',
                    filename: this.filename
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }
            if (fn !== args.length &&
                !(Array.isArray(fn) && _.include(fn, args.length)) &&
                // support variable-arg functions like `colorize-alpha`
                fn !== -1) {
                env.error({
                    message: 'function ' + this.name + '() takes ' +
                        fn + ' arguments and was given ' + args.length,
                    index: this.index,
                    type: 'runtime',
                    filename: this.filename
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            } else {
                // Save the evaluated versions of arguments
                this.args = args;
                return this;
            }
        }
    },

    toString: function(env, format) {
        if (this.args.length) {
            return this.name + '(' + this.args.join(',') + ')';
        } else {
            return this.name;
        }
    }
};

})(require('../tree'));

},{"../tree":7,"underscore":44}],9:[function(require,module,exports){
(function(tree) {
// RGB Colors - #ff0014, #eee
// can be initialized with a 3 or 6 char string or a 3 or 4 element
// numerical array
tree.Color = function Color(rgb, a) {
    // The end goal here, is to parse the arguments
    // into an integer triplet, such as `128, 255, 0`
    //
    // This facilitates operations and conversions.
    if (Array.isArray(rgb)) {
        this.rgb = rgb.slice(0, 3);
    } else if (rgb.length == 6) {
        this.rgb = rgb.match(/.{2}/g).map(function(c) {
            return parseInt(c, 16);
        });
    } else {
        this.rgb = rgb.split('').map(function(c) {
            return parseInt(c + c, 16);
        });
    }

    if (typeof(a) === 'number') {
        this.alpha = a;
    } else if (rgb.length === 4) {
        this.alpha = rgb[3];
    } else {
        this.alpha = 1;
    }
};

tree.Color.prototype = {
    is: 'color',
    'ev': function() { return this; },

    // If we have some transparency, the only way to represent it
    // is via `rgba`. Otherwise, we use the hex representation,
    // which has better compatibility with older browsers.
    // Values are capped between `0` and `255`, rounded and zero-padded.
    toString: function() {
        if (this.alpha < 1.0) {
            return 'rgba(' + this.rgb.map(function(c) {
                return Math.round(c);
            }).concat(this.alpha).join(', ') + ')';
        } else {
            return '#' + this.rgb.map(function(i) {
                i = Math.round(i);
                i = (i > 255 ? 255 : (i < 0 ? 0 : i)).toString(16);
                return i.length === 1 ? '0' + i : i;
            }).join('');
        }
    },

    // Operations have to be done per-channel, if not,
    // channels will spill onto each other. Once we have
    // our result, in the form of an integer triplet,
    // we create a new Color node to hold the result.
    operate: function(env, op, other) {
        var result = [];

        if (! (other instanceof tree.Color)) {
            other = other.toColor();
        }

        for (var c = 0; c < 3; c++) {
            result[c] = tree.operate(op, this.rgb[c], other.rgb[c]);
        }
        return new tree.Color(result);
    },

    toHSL: function() {
        var r = this.rgb[0] / 255,
            g = this.rgb[1] / 255,
            b = this.rgb[2] / 255,
            a = this.alpha;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2, d = max - min;

        if (max === min) {
            h = s = 0;
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s, l: l, a: a };
    }
};

})(require('../tree'));

},{"../tree":7}],10:[function(require,module,exports){
(function(tree) {

tree.Comment = function Comment(value, silent) {
    this.value = value;
    this.silent = !!silent;
};

tree.Comment.prototype = {
    toString: function(env) {
        return '<!--' + this.value + '-->';
    },
    'ev': function() { return this; }
};

})(require('../tree'));

},{"../tree":7}],11:[function(require,module,exports){
(function(tree) {
var assert = require('assert'),
    _ = require('underscore');

// A definition is the combination of a selector and rules, like
// #foo {
//     polygon-opacity:1.0;
// }
//
// The selector can have filters
tree.Definition = function Definition(selector, rules) {
    this.elements = selector.elements;
    assert.ok(selector.filters instanceof tree.Filterset);
    this.rules = rules;
    this.ruleIndex = {};
    for (var i = 0; i < this.rules.length; i++) {
        if ('zoom' in this.rules[i]) this.rules[i] = this.rules[i].clone();
        this.rules[i].zoom = selector.zoom;
        this.ruleIndex[this.rules[i].updateID()] = true;
    }
    this.filters = selector.filters;
    this.zoom = selector.zoom;
    this.frame_offset = selector.frame_offset;
    this.attachment = selector.attachment || '__default__';
    this.specificity = selector.specificity();
};

tree.Definition.prototype.toString = function() {
    var str = this.filters.toString();
    for (var i = 0; i < this.rules.length; i++) {
        str += '\n    ' + this.rules[i];
    }
    return str;
};

tree.Definition.prototype.clone = function(filters) {
    if (filters) assert.ok(filters instanceof tree.Filterset);
    var clone = Object.create(tree.Definition.prototype);
    clone.rules = this.rules.slice();
    clone.ruleIndex = _.clone(this.ruleIndex);
    clone.filters = filters ? filters : this.filters.clone();
    clone.attachment = this.attachment;
    return clone;
};

tree.Definition.prototype.addRules = function(rules) {
    var added = 0;

    // Add only unique rules.
    for (var i = 0; i < rules.length; i++) {
        if (!this.ruleIndex[rules[i].id]) {
            this.rules.push(rules[i]);
            this.ruleIndex[rules[i].id] = true;
            added++;
        }
    }

    return added;
};

// Determine whether this selector matches a given id
// and array of classes, by determining whether
// all elements it contains match.
tree.Definition.prototype.appliesTo = function(id, classes) {
    for (var i = 0, l = this.elements.length; i < l; i++) {
        var elem = this.elements[i];
        if (!(elem.wildcard ||
            (elem.type === 'class' && classes[elem.clean]) ||
            (elem.type === 'id' && id === elem.clean))) return false;
    }
    return true;
};

function symbolizerName(symbolizer) {
    function capitalize(str) { return str[1].toUpperCase(); }
    return symbolizer.charAt(0).toUpperCase() +
           symbolizer.slice(1).replace(/\-./, capitalize) + 'Symbolizer';
}

// Get a simple list of the symbolizers, in order
function symbolizerList(sym_order) {
    return sym_order.sort(function(a, b) { return a[1] - b[1]; })
        .map(function(v) { return v[0]; });
}

tree.Definition.prototype.symbolizersToXML = function(env, symbolizers, zoom) {
    var xml = zoom.toXML(env).join('') + this.filters.toXML(env);

    // Sort symbolizers by the index of their first property definition
    var sym_order = [], indexes = [];
    for (var key in symbolizers) {
        indexes = [];
        for (var prop in symbolizers[key]) {
            indexes.push(symbolizers[key][prop].index);
        }
        var min_idx = Math.min.apply(Math, indexes);
        sym_order.push([key, min_idx]);
    }

    sym_order = symbolizerList(sym_order);
    var sym_count = 0;

    for (var i = 0; i < sym_order.length; i++) {
        var attributes = symbolizers[sym_order[i]];
        var symbolizer = sym_order[i].split('/').pop();

        // Skip the magical * symbolizer which is used for universal properties
        // which are bubbled up to Style elements intead of Symbolizer elements.
        if (symbolizer === '*') continue;
        sym_count++;

        var fail = tree.Reference.requiredProperties(symbolizer, attributes);
        if (fail) {
            var rule = attributes[Object.keys(attributes).shift()];
            env.error({
                message: fail,
                index: rule.index,
                filename: rule.filename
            });
        }

        var name = symbolizerName(symbolizer);

        var selfclosing = true, tagcontent;
        xml += '    <' + name + ' ';
        for (var j in attributes) {
            if (symbolizer === 'map') env.error({
                message: 'Map properties are not permitted in other rules',
                index: attributes[j].index,
                filename: attributes[j].filename
            });
            var x = tree.Reference.selector(attributes[j].name);
            if (x && x.serialization && x.serialization === 'content') {
                selfclosing = false;
                tagcontent = attributes[j].ev(env).toXML(env, true);
            } else if (x && x.serialization && x.serialization === 'tag') {
                selfclosing = false;
                tagcontent = attributes[j].ev(env).toXML(env, true);
            } else {
                xml += attributes[j].ev(env).toXML(env) + ' ';
            }
        }
        if (selfclosing) {
            xml += '/>\n';
        } else if (typeof tagcontent !== "undefined") {
            if (tagcontent.indexOf('<') != -1) {
                xml += '>' + tagcontent + '</' + name + '>\n';
            } else {
                xml += '><![CDATA[' + tagcontent + ']]></' + name + '>\n';
            }
        }
    }
    if (!sym_count || !xml) return '';
    return '  <Rule>\n' + xml + '  </Rule>\n';
};

// Take a zoom range of zooms and 'i', the index of a rule in this.rules,
// and finds all applicable symbolizers
tree.Definition.prototype.collectSymbolizers = function(zooms, i) {
    var symbolizers = {}, child;

    for (var j = i; j < this.rules.length; j++) {
        child = this.rules[j];
        var key = child.instance + '/' + child.symbolizer;
        if (zooms.current & child.zoom &&
           (!(key in symbolizers) ||
           (!(child.name in symbolizers[key])))) {
            zooms.current &= child.zoom;
            if (!(key in symbolizers)) {
                symbolizers[key] = {};
            }
            symbolizers[key][child.name] = child;
        }
    }

    if (Object.keys(symbolizers).length) {
        zooms.rule &= (zooms.available &= ~zooms.current);
        return symbolizers;
    }
};

// The tree.Zoom.toString function ignores the holes in zoom ranges and outputs
// scaledenominators that cover the whole range from the first to last bit set.
// This algorithm can produces zoom ranges that may have holes. However,
// when using the filter-mode="first", more specific zoom filters will always
// end up before broader ranges. The filter-mode will pick those first before
// resorting to the zoom range with the hole and stop processing further rules.
tree.Definition.prototype.toXML = function(env, existing) {
    var filter = this.filters.toString();
    if (!(filter in existing)) existing[filter] = tree.Zoom.all;

    var available = tree.Zoom.all, xml = '', zoom, symbolizers,
        zooms = { available: tree.Zoom.all };
    for (var i = 0; i < this.rules.length && available; i++) {
        zooms.rule = this.rules[i].zoom;
        if (!(existing[filter] & zooms.rule)) continue;

        while (zooms.current = zooms.rule & available) {
            if (symbolizers = this.collectSymbolizers(zooms, i)) {
                if (!(existing[filter] & zooms.current)) continue;
                xml += this.symbolizersToXML(env, symbolizers,
                    (new tree.Zoom()).setZoom(existing[filter] & zooms.current));
                existing[filter] &= ~zooms.current;
            }
        }
    }

    return xml;
};

tree.Definition.prototype.toJS = function(env) {
  var shaderAttrs = {};

  // merge conditions from filters with zoom condition of the
  // definition
  var zoom = "(" + this.zoom + " & (1 << ctx.zoom))";
  var frame_offset = this.frame_offset;
  var _if = this.filters.toJS(env);
  var filters = [zoom];
  if(_if) filters.push(_if);
  if(frame_offset) filters.push('ctx["frame-offset"] === ' + frame_offset);
  _if = filters.join(" && ");
  _.each(this.rules, function(rule) {
      if(rule instanceof tree.Rule) {
        shaderAttrs[rule.name] = shaderAttrs[rule.name] || [];

        var r = {
          index: rule.index,
          symbolizer: rule.symbolizer
        };

        if (_if) {
          r.js = "if(" + _if + "){" + rule.value.toJS(env) + "}"
        } else {
          r.js = rule.value.toJS(env);
        }

        r.constant = rule.value.ev(env).is !== 'field';
        r.filtered = !!_if;

        shaderAttrs[rule.name].push(r);
      } else {
        throw new Error("Ruleset not supported");
        //if (rule instanceof tree.Ruleset) {
          //var sh = rule.toJS(env);
          //for(var v in sh) {
            //shaderAttrs[v] = shaderAttrs[v] || [];
            //for(var attr in sh[v]) {
              //shaderAttrs[v].push(sh[v][attr]);
            //}
          //}
        //}
      }
  });
  return shaderAttrs;
};


})(require('../tree'));

},{"../tree":7,"assert":37,"underscore":44}],12:[function(require,module,exports){
(function(tree) {
var _ = require('underscore');
//
// A number with a unit
//
tree.Dimension = function Dimension(value, unit, index) {
    this.value = parseFloat(value);
    this.unit = unit || null;
    this.index = index;
};

tree.Dimension.prototype = {
    is: 'float',
    physical_units: ['m', 'cm', 'in', 'mm', 'pt', 'pc'],
    screen_units: ['px', '%'],
    all_units: ['m', 'cm', 'in', 'mm', 'pt', 'pc', 'px', '%'],
    densities: {
        m: 0.0254,
        mm: 25.4,
        cm: 2.54,
        pt: 72,
        pc: 6
    },
    ev: function (env) {
        if (this.unit && !_.contains(this.all_units, this.unit)) {
            env.error({
                message: "Invalid unit: '" + this.unit + "'",
                index: this.index
            });
            return { is: 'undefined', value: 'undefined' };
        }

        // normalize units which are not px or %
        if (this.unit && _.contains(this.physical_units, this.unit)) {
            if (!env.ppi) {
                env.error({
                    message: "ppi is not set, so metric units can't be used",
                    index: this.index
                });
                return { is: 'undefined', value: 'undefined' };
            }
            // convert all units to inch
            // convert inch to px using ppi
            this.value = (this.value / this.densities[this.unit]) * env.ppi;
            this.unit = 'px';
        }

        return this;
    },
    round: function() {
        this.value = Math.round(this.value);
        return this;
    },
    toColor: function() {
        return new tree.Color([this.value, this.value, this.value]);
    },
    round: function() {
        this.value = Math.round(this.value);
        return this;
    },
    toString: function() {
        return this.value.toString();
    },
    operate: function(env, op, other) {
        if (this.unit === '%' && other.unit !== '%') {
            env.error({
                message: 'If two operands differ, the first must not be %',
                index: this.index
            });
            return {
                is: 'undefined',
                value: 'undefined'
            };
        }

        if (this.unit !== '%' && other.unit === '%') {
            if (op === '*' || op === '/' || op === '%') {
                env.error({
                    message: 'Percent values can only be added or subtracted from other values',
                    index: this.index
                });
                return {
                    is: 'undefined',
                    value: 'undefined'
                };
            }

            return new tree.Dimension(tree.operate(op,
                    this.value, this.value * other.value * 0.01),
                this.unit);
        }

        //here the operands are either the same (% or undefined or px), or one is undefined and the other is px
        return new tree.Dimension(tree.operate(op, this.value, other.value),
            this.unit || other.unit);
    }
};

})(require('../tree'));

},{"../tree":7,"underscore":44}],13:[function(require,module,exports){
(function(tree) {

// An element is an id or class selector
tree.Element = function Element(value) {
    this.value = value.trim();
    if (this.value[0] === '#') {
        this.type = 'id';
        this.clean = this.value.replace(/^#/, '');
    }
    if (this.value[0] === '.') {
        this.type = 'class';
        this.clean = this.value.replace(/^\./, '');
    }
    if (this.value.indexOf('*') !== -1) {
        this.type = 'wildcard';
    }
};

// Determine the 'specificity matrix' of this
// specific selector
tree.Element.prototype.specificity = function() {
    return [
        (this.type === 'id') ? 1 : 0, // a
        (this.type === 'class') ? 1 : 0  // b
    ];
};

tree.Element.prototype.toString = function() { return this.value; };

})(require('../tree'));

},{"../tree":7}],14:[function(require,module,exports){
(function(tree) {

tree.Expression = function Expression(value) {
    this.value = value;
};

tree.Expression.prototype = {
    is: 'expression',
    ev: function(env) {
        if (this.value.length > 1) {
            return new tree.Expression(this.value.map(function(e) {
                return e.ev(env);
            }));
        } else {
            return this.value[0].ev(env);
        }
    },

    toString: function(env) {
        return this.value.map(function(e) {
            return e.toString(env);
        }).join(' ');
    }
};

})(require('../tree'));

},{"../tree":7}],15:[function(require,module,exports){
(function(tree) {

tree.Field = function Field(content) {
    this.value = content || '';
};

tree.Field.prototype = {
    is: 'field',
    toString: function() {
        return '[' + this.value + ']';
    },
    'ev': function() {
        return this;
    }
};

})(require('../tree'));

},{"../tree":7}],16:[function(require,module,exports){
(function(tree) {

tree.Filter = function Filter(key, op, val, index, filename) {
    this.key = key;
    this.op = op;
    this.val = val;
    this.index = index;
    this.filename = filename;

    this.id = this.key + this.op + this.val;
};

// xmlsafe, numeric, suffix
var ops = {
    '<': [' &lt; ', 'numeric'],
    '>': [' &gt; ', 'numeric'],
    '=': [' = ', 'both'],
    '!=': [' != ', 'both'],
    '<=': [' &lt;= ', 'numeric'],
    '>=': [' &gt;= ', 'numeric'],
    '=~': ['.match(', 'string', ')']
};

tree.Filter.prototype.ev = function(env) {
    this.key = this.key.ev(env);
    this.val = this.val.ev(env);
    return this;
};

tree.Filter.prototype.toXML = function(env) {
    if (tree.Reference.data.filter) {
        if (this.key.is === 'keyword' && -1 === tree.Reference.data.filter.value.indexOf(this.key.toString())) {
            env.error({
                message: this.key.toString() + ' is not a valid keyword in a filter expression',
                index: this.index,
                filename: this.filename
            });
        }
        if (this.val.is === 'keyword' && -1 === tree.Reference.data.filter.value.indexOf(this.val.toString())) {
            env.error({
                message: this.val.toString() + ' is not a valid keyword in a filter expression',
                index: this.index,
                filename: this.filename
            });
        }
    }
    var key = this.key.toString(false);
    var val = this.val.toString(this.val.is == 'string');

    if (
        (ops[this.op][1] == 'numeric' && isNaN(val) && this.val.is !== 'field') ||
        (ops[this.op][1] == 'string' && (val)[0] != "'")
    ) {
        env.error({
            message: 'Cannot use operator "' + this.op + '" with value ' + this.val,
            index: this.index,
            filename: this.filename
        });
    }

    return key + ops[this.op][0] + val + (ops[this.op][2] || '');
};

tree.Filter.prototype.toString = function() {
    return '[' + this.id + ']';
};

})(require('../tree'));

},{"../tree":7}],17:[function(require,module,exports){
var tree = require('../tree');
var _ = require('underscore');

tree.Filterset = function Filterset() {
    this.filters = {};
};

tree.Filterset.prototype.toXML = function(env) {
    var filters = [];
    for (var id in this.filters) {
        filters.push('(' + this.filters[id].toXML(env).trim() + ')');
    }
    if (filters.length) {
        return '    <Filter>' + filters.join(' and ') + '</Filter>\n';
    } else {
        return '';
    }
};

tree.Filterset.prototype.toString = function() {
    var arr = [];
    for (var id in this.filters) arr.push(this.filters[id].id);
    return arr.sort().join('\t');
};

tree.Filterset.prototype.ev = function(env) {
    for (var i in this.filters) {
        this.filters[i].ev(env);
    }
    return this;
};

tree.Filterset.prototype.clone = function() {
    var clone = new tree.Filterset();
    for (var id in this.filters) {
        clone.filters[id] = this.filters[id];
    }
    return clone;
};

// Note: other has to be a tree.Filterset.
tree.Filterset.prototype.cloneWith = function(other) {
    var additions = [];
    for (var id in other.filters) {
        var status = this.addable(other.filters[id]);
        // status is true, false or null. if it's null we don't fail this
        // clone nor do we add the filter.
        if (status === false) {
            return false;
        }
        if (status === true) {
            // Adding the filter will override another value.
            additions.push(other.filters[id]);
        }
    }

    // Adding the other filters doesn't make this filterset invalid, but it
    // doesn't add anything to it either.
    if (!additions.length) {
        return null;
    }

    // We can successfully add all filters. Now clone the filterset and add the
    // new rules.
    var clone = new tree.Filterset();

    // We can add the rules that are already present without going through the
    // add function as a Filterset is always in it's simplest canonical form.
    for (id in this.filters) {
        clone.filters[id] = this.filters[id];
    }

    // Only add new filters that actually change the filter.
    while (id = additions.shift()) {
        clone.add(id);
    }

    return clone;
};

tree.Filterset.prototype.toJS = function(env) {
  var opMap = {
    '=': '==='
  };
  return _.map(this.filters, function(filter) {
    var op = filter.op;
    if(op in opMap) {
      op = opMap[op];
    }
    var val = filter.val;
    if(filter._val !== undefined) {
      val = filter._val.toString(true);
    }
    var attrs = "data";
    return attrs + "." + filter.key.value  + " " + op + " " + (val.is === 'string' ? "'"+ val +"'" : val);
  }).join(' && ');
};

// Returns true when the new filter can be added, false otherwise.
// It can also return null, and on the other side we test for === true or
// false
tree.Filterset.prototype.addable = function(filter) {
    var key = filter.key.toString(),
        value = filter.val.toString();

    if (value.match(/^[0-9]+(\.[0-9]*)?$/)) value = parseFloat(value);

    switch (filter.op) {
        case '=':
            // if there is already foo= and we're adding foo=
            if (this.filters[key + '='] !== undefined) {
                if (this.filters[key + '='].val.toString() != value) {
                    return false;
                } else {
                    return null;
                }
            }
            if (this.filters[key + '!=' + value] !== undefined) return false;
            if (this.filters[key + '>'] !== undefined && this.filters[key + '>'].val >= value) return false;
            if (this.filters[key + '<'] !== undefined && this.filters[key + '<'].val <= value) return false;
            if (this.filters[key + '>='] !== undefined  && this.filters[key + '>='].val > value) return false;
            if (this.filters[key + '<='] !== undefined  && this.filters[key + '<='].val < value) return false;
            return true;

        case '=~':
            return true;

        case '!=':
            if (this.filters[key + '='] !== undefined) return (this.filters[key + '='].val == value) ? false : null;
            if (this.filters[key + '!=' + value] !== undefined) return null;
            if (this.filters[key + '>'] !== undefined && this.filters[key + '>'].val >= value) return null;
            if (this.filters[key + '<'] !== undefined && this.filters[key + '<'].val <= value) return null;
            if (this.filters[key + '>='] !== undefined && this.filters[key + '>='].val > value) return null;
            if (this.filters[key + '<='] !== undefined && this.filters[key + '<='].val < value) return null;
            return true;

        case '>':
            if (key + '=' in this.filters) {
                if (this.filters[key + '='].val <= value) {
                    return false;
                } else {
                    return null;
                }
            }
            if (this.filters[key + '<'] !== undefined && this.filters[key + '<'].val <= value) return false;
            if (this.filters[key + '<='] !== undefined  && this.filters[key + '<='].val <= value) return false;
            if (this.filters[key + '>'] !== undefined && this.filters[key + '>'].val >= value) return null;
            if (this.filters[key + '>='] !== undefined  && this.filters[key + '>='].val > value) return null;
            return true;

        case '>=':
            if (this.filters[key + '=' ] !== undefined) return (this.filters[key + '='].val < value) ? false : null;
            if (this.filters[key + '<' ] !== undefined && this.filters[key + '<'].val <= value) return false;
            if (this.filters[key + '<='] !== undefined && this.filters[key + '<='].val < value) return false;
            if (this.filters[key + '>' ] !== undefined && this.filters[key + '>'].val >= value) return null;
            if (this.filters[key + '>='] !== undefined && this.filters[key + '>='].val >= value) return null;
            return true;

        case '<':
            if (this.filters[key + '=' ] !== undefined) return (this.filters[key + '='].val >= value) ? false : null;
            if (this.filters[key + '>' ] !== undefined && this.filters[key + '>'].val >= value) return false;
            if (this.filters[key + '>='] !== undefined && this.filters[key + '>='].val >= value) return false;
            if (this.filters[key + '<' ] !== undefined && this.filters[key + '<'].val <= value) return null;
            if (this.filters[key + '<='] !== undefined && this.filters[key + '<='].val < value) return null;
            return true;

        case '<=':
            if (this.filters[key + '=' ] !== undefined) return (this.filters[key + '='].val > value) ? false : null;
            if (this.filters[key + '>' ] !== undefined && this.filters[key + '>'].val >= value) return false;
            if (this.filters[key + '>='] !== undefined && this.filters[key + '>='].val > value) return false;
            if (this.filters[key + '<' ] !== undefined && this.filters[key + '<'].val <= value) return null;
            if (this.filters[key + '<='] !== undefined && this.filters[key + '<='].val <= value) return null;
            return true;
    }
};

// Does the new filter constitute a conflict?
tree.Filterset.prototype.conflict = function(filter) {
    var key = filter.key.toString(),
        value = filter.val.toString();

    if (!isNaN(parseFloat(value))) value = parseFloat(value);

    // if (a=b) && (a=c)
    // if (a=b) && (a!=b)
    // or (a!=b) && (a=b)
    if ((filter.op === '=' && this.filters[key + '='] !== undefined &&
        value != this.filters[key + '='].val.toString()) ||
        (filter.op === '!=' && this.filters[key + '='] !== undefined &&
        value == this.filters[key + '='].val.toString()) ||
        (filter.op === '=' && this.filters[key + '!='] !== undefined &&
        value == this.filters[key + '!='].val.toString())) {
        return filter.toString() + ' added to ' + this.toString() + ' produces an invalid filter';
    }

    return false;
};

// Only call this function for filters that have been cleared by .addable().
tree.Filterset.prototype.add = function(filter, env) {
    var key = filter.key.toString(),
        id,
        op = filter.op,
        conflict = this.conflict(filter),
        numval;

    if (conflict) return conflict;

    if (op === '=') {
        for (var i in this.filters) {
            if (this.filters[i].key == key) delete this.filters[i];
        }
        this.filters[key + '='] = filter;
    } else if (op === '!=') {
        this.filters[key + '!=' + filter.val] = filter;
    } else if (op === '=~') {
        this.filters[key + '=~' + filter.val] = filter;
    } else if (op === '>') {
        // If there are other filters that are also >
        // but are less than this one, they don't matter, so
        // remove them.
        for (var j in this.filters) {
            if (this.filters[j].key == key && this.filters[j].val <= filter.val) {
                delete this.filters[j];
            }
        }
        this.filters[key + '>'] = filter;
    } else if (op === '>=') {
        for (var k in this.filters) {
            numval = (+this.filters[k].val.toString());
            if (this.filters[k].key == key && numval < filter.val) {
                delete this.filters[k];
            }
        }
        if (this.filters[key + '!=' + filter.val] !== undefined) {
            delete this.filters[key + '!=' + filter.val];
            filter.op = '>';
            this.filters[key + '>'] = filter;
        }
        else {
            this.filters[key + '>='] = filter;
        }
    } else if (op === '<') {
        for (var l in this.filters) {
            numval = (+this.filters[l].val.toString());
            if (this.filters[l].key == key && numval >= filter.val) {
                delete this.filters[l];
            }
        }
        this.filters[key + '<'] = filter;
    } else if (op === '<=') {
        for (var m in this.filters) {
            numval = (+this.filters[m].val.toString());
            if (this.filters[m].key == key && numval > filter.val) {
                delete this.filters[m];
            }
        }
        if (this.filters[key + '!=' + filter.val] !== undefined) {
            delete this.filters[key + '!=' + filter.val];
            filter.op = '<';
            this.filters[key + '<'] = filter;
        }
        else {
            this.filters[key + '<='] = filter;
        }
    }
};

},{"../tree":7,"underscore":44}],18:[function(require,module,exports){
(function(tree) {

tree._getFontSet = function(env, fonts) {
    var fontKey = fonts.join('');
    if (env._fontMap && env._fontMap[fontKey]) {
        return env._fontMap[fontKey];
    }

    var new_fontset = new tree.FontSet(env, fonts);
    env.effects.push(new_fontset);
    if (!env._fontMap) env._fontMap = {};
    env._fontMap[fontKey] = new_fontset;
    return new_fontset;
};

tree.FontSet = function FontSet(env, fonts) {
    this.fonts = fonts;
    this.name = 'fontset-' + env.effects.length;
};

tree.FontSet.prototype.toXML = function(env) {
    return '<FontSet name="' +
        this.name +
        '">\n' +
        this.fonts.map(function(f) {
            return '  <Font face-name="' + f +'"/>';
        }).join('\n') +
        '\n</FontSet>';
};

})(require('../tree'));

},{"../tree":7}],19:[function(require,module,exports){
var tree = require('../tree');

// Storage for Frame offset value
// and stores them as bit-sequences so that they can be combined,
// inverted, and compared quickly.
tree.FrameOffset = function(op, value, index) {
    value = parseInt(value, 10);
    if (value > tree.FrameOffset.max || value <= 0) {
        throw {
            message: 'Only frame-offset levels between 1 and ' +
                tree.FrameOffset.max + ' supported.',
            index: index
        };
    }

    if (op !== '=') {
        throw {
            message: 'only = operator is supported for frame-offset',
            index: index
        };
    }
    return value;
};

tree.FrameOffset.max = 32;
tree.FrameOffset.none = 0;


},{"../tree":7}],20:[function(require,module,exports){
(function(tree) {

tree.ImageFilter = function ImageFilter(filter, args) {
    this.filter = filter;
    this.args = args || null;
};

tree.ImageFilter.prototype = {
    is: 'imagefilter',
    ev: function() { return this; },

    toString: function() {
        if (this.args) {
            return this.filter + '(' + this.args.join(',') + ')';
        } else {
            return this.filter;
        }
    }
};


})(require('../tree'));

},{"../tree":7}],21:[function(require,module,exports){
(function (tree) {
tree.Invalid = function Invalid(chunk, index, message) {
    this.chunk = chunk;
    this.index = index;
    this.type = 'syntax';
    this.message = message || "Invalid code: " + this.chunk;
};

tree.Invalid.prototype.is = 'invalid';

tree.Invalid.prototype.ev = function(env) {
    env.error({
        chunk: this.chunk,
        index: this.index,
        type: 'syntax',
        message: this.message || "Invalid code: " + this.chunk
    });
    return {
        is: 'undefined'
    };
};
})(require('../tree'));

},{"../tree":7}],22:[function(require,module,exports){
(function(tree) {

tree.Keyword = function Keyword(value) {
    this.value = value;
    var special = {
        'transparent': 'color',
        'true': 'boolean',
        'false': 'boolean'
    };
    this.is = special[value] ? special[value] : 'keyword';
};
tree.Keyword.prototype = {
    ev: function() { return this; },
    toString: function() { return this.value; }
};

})(require('../tree'));

},{"../tree":7}],23:[function(require,module,exports){
(function(tree) {

tree.LayerXML = function(obj, styles) {
    var dsoptions = [];
    for (var i in obj.Datasource) {
        dsoptions.push('<Parameter name="' + i + '"><![CDATA[' +
            obj.Datasource[i] + ']]></Parameter>');
    }

    var prop_string = '';
    for (var prop in obj.properties) {
        if (prop === 'minzoom') {
            prop_string += '  maxzoom="' + tree.Zoom.ranges[obj.properties[prop]] + '"\n';
        } else if (prop === 'maxzoom') {
            prop_string += '  minzoom="' + tree.Zoom.ranges[obj.properties[prop]+1] + '"\n';
        } else {
            prop_string += '  ' + prop + '="' + obj.properties[prop] + '"\n';
        }
    }

    return '<Layer' +
        ' name="' + obj.name + '"\n' +
        prop_string +
        ((typeof obj.status === 'undefined') ? '' : '  status="' + obj.status + '"\n') +
        ((typeof obj.srs === 'undefined') ? '' : '  srs="' + obj.srs + '"') + '>\n    ' +
        styles.reverse().map(function(s) {
            return '<StyleName>' + s + '</StyleName>';
        }).join('\n    ') +
        (dsoptions.length ?
        '\n    <Datasource>\n       ' +
        dsoptions.join('\n       ') +
        '\n    </Datasource>\n'
        : '') +
        '  </Layer>\n';
};

})(require('../tree'));

},{"../tree":7}],24:[function(require,module,exports){
// A literal is a literal string for Mapnik - the
// result of the combination of a `tree.Field` with any
// other type.
(function(tree) {

tree.Literal = function Field(content) {
    this.value = content || '';
    this.is = 'field';
};

tree.Literal.prototype = {
    toString: function() {
        return this.value;
    },
    'ev': function() {
        return this;
    }
};

})(require('../tree'));

},{"../tree":7}],25:[function(require,module,exports){
// An operation is an expression with an op in between two operands,
// like 2 + 1.
(function(tree) {

tree.Operation = function Operation(op, operands, index) {
    this.op = op.trim();
    this.operands = operands;
    this.index = index;
};

tree.Operation.prototype.is = 'operation';

tree.Operation.prototype.ev = function(env) {
    var a = this.operands[0].ev(env),
        b = this.operands[1].ev(env),
        temp;

    if (a.is === 'undefined' || b.is === 'undefined') {
        return {
            is: 'undefined',
            value: 'undefined'
        };
    }

    if (a instanceof tree.Dimension && b instanceof tree.Color) {
        if (this.op === '*' || this.op === '+') {
            temp = b, b = a, a = temp;
        } else {
            env.error({
                name: "OperationError",
                message: "Can't substract or divide a color from a number",
                index: this.index
            });
        }
    }

    // Only concatenate plain strings, because this is easily
    // pre-processed
    if (a instanceof tree.Quoted && b instanceof tree.Quoted && this.op !== '+') {
        env.error({
           message: "Can't subtract, divide, or multiply strings.",
           index: this.index,
           type: 'runtime',
           filename: this.filename
        });
        return {
            is: 'undefined',
            value: 'undefined'
        };
    }

    // Fields, literals, dimensions, and quoted strings can be combined.
    if (a instanceof tree.Field || b instanceof tree.Field ||
        a instanceof tree.Literal || b instanceof tree.Literal) {
        if (a.is === 'color' || b.is === 'color') {
            env.error({
               message: "Can't subtract, divide, or multiply colors in expressions.",
               index: this.index,
               type: 'runtime',
               filename: this.filename
            });
            return {
                is: 'undefined',
                value: 'undefined'
            };
        } else {
            return new tree.Literal(a.ev(env).toString(true) + this.op + b.ev(env).toString(true));
        }
    }

    if (a.operate === undefined) {
        env.error({
           message: 'Cannot do math with type ' + a.is + '.',
           index: this.index,
           type: 'runtime',
           filename: this.filename
        });
        return {
            is: 'undefined',
            value: 'undefined'
        };
    }

    return a.operate(env, this.op, b);
};

tree.operate = function(op, a, b) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '%': return a % b;
        case '/': return a / b;
    }
};

})(require('../tree'));

},{"../tree":7}],26:[function(require,module,exports){
(function(tree) {

tree.Quoted = function Quoted(content) {
    this.value = content || '';
};

tree.Quoted.prototype = {
    is: 'string',

    toString: function(quotes) {
        var escapedValue = this.value
            .replace(/&/g, '&amp;')
        var xmlvalue = escapedValue
            .replace(/\'/g, '\\\'')
            .replace(/\"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/\>/g, '&gt;');
        return (quotes === true) ? "'" + xmlvalue + "'" : escapedValue;
    },

    'ev': function() {
        return this;
    },

    operate: function(env, op, other) {
        return new tree.Quoted(tree.operate(op, this.toString(), other.toString(this.contains_field)));
    }
};

})(require('../tree'));

},{"../tree":7}],27:[function(require,module,exports){
// Carto pulls in a reference from the `mapnik-reference`
// module. This file builds indexes from that file for its various
// options, and provides validation methods for property: value
// combinations.
(function(tree) {

var _ = require('underscore'),
    ref = {};

ref.setData = function(data) {
    ref.data = data;
    ref.selector_cache = generateSelectorCache(data);
    ref.mapnikFunctions = generateMapnikFunctions(data);

    ref.mapnikFunctions.matrix = [6];
    ref.mapnikFunctions.translate = [1, 2];
    ref.mapnikFunctions.scale = [1, 2];
    ref.mapnikFunctions.rotate = [1, 3];
    ref.mapnikFunctions.skewX = [1];
    ref.mapnikFunctions.skewY = [1];

    ref.required_cache = generateRequiredProperties(data);
};

ref.setVersion = function(version) {
    var mapnik_reference = require('mapnik-reference');
    if (mapnik_reference.version.hasOwnProperty(version)) {
        ref.setData(mapnik_reference.version[version]);
        return true;
    } else {
        return false;
    }
};

ref.selectorData = function(selector, i) {
    if (ref.selector_cache[selector]) return ref.selector_cache[selector][i];
};

ref.validSelector = function(selector) { return !!ref.selector_cache[selector]; };
ref.selectorName = function(selector) { return ref.selectorData(selector, 2); };
ref.selector = function(selector) { return ref.selectorData(selector, 0); };
ref.symbolizer = function(selector) { return ref.selectorData(selector, 1); };

function generateSelectorCache(data) {
    var index = {};
    for (var i in data.symbolizers) {
        for (var j in data.symbolizers[i]) {
            if (data.symbolizers[i][j].hasOwnProperty('css')) {
                index[data.symbolizers[i][j].css] = [data.symbolizers[i][j], i, j];
            }
        }
    }
    return index;
}

function generateMapnikFunctions(data) {
    var functions = {};
    for (var i in data.symbolizers) {
        for (var j in data.symbolizers[i]) {
            if (data.symbolizers[i][j].type === 'functions') {
                for (var k = 0; k < data.symbolizers[i][j].functions.length; k++) {
                    var fn = data.symbolizers[i][j].functions[k];
                    functions[fn[0]] = fn[1];
                }
            }
        }
    }
    return functions;
}

function generateRequiredProperties(data) {
    var cache = {};
    for (var symbolizer_name in data.symbolizers) {
        cache[symbolizer_name] = [];
        for (var j in data.symbolizers[symbolizer_name]) {
            if (data.symbolizers[symbolizer_name][j].required) {
                cache[symbolizer_name].push(data.symbolizers[symbolizer_name][j].css);
            }
        }
    }
    return cache;
}

ref.requiredProperties = function(symbolizer_name, rules) {
    var req = ref.required_cache[symbolizer_name];
    for (var i in req) {
        if (!(req[i] in rules)) {
            return 'Property ' + req[i] + ' required for defining ' +
                symbolizer_name + ' styles.';
        }
    }
};

// TODO: finish implementation - this is dead code
ref._validateValue = {
    'font': function(env, value) {
        if (env.validation_data && env.validation_data.fonts) {
            return env.validation_data.fonts.indexOf(value) != -1;
        } else {
            return true;
        }
    }
};

ref.isFont = function(selector) {
    return ref.selector(selector).validate == 'font';
};

// https://gist.github.com/982927
ref.editDistance = function(a, b){
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    for (var i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (var j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i-1) == a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                    Math.min(matrix[i][j-1] + 1, // insertion
                    matrix[i-1][j] + 1)); // deletion
            }
        }
    }
    return matrix[b.length][a.length];
};

function validateFunctions(value, selector) {
    if (value.value[0].is === 'string') return true;
    for (var i in value.value) {
        for (var j in value.value[i].value) {
            if (value.value[i].value[j].is !== 'call') return false;
            var f = _.find(ref
                .selector(selector).functions, function(x) {
                    return x[0] == value.value[i].value[j].name;
                });
            if (!(f && f[1] == -1)) {
                // This filter is unknown or given an incorrect number of arguments
                if (!f || f[1] !== value.value[i].value[j].args.length) return false;
            }
        }
    }
    return true;
}

function validateKeyword(value, selector) {
    if (typeof ref.selector(selector).type === 'object') {
        return ref.selector(selector).type
            .indexOf(value.value[0].value) !== -1;
    } else {
        // allow unquoted keywords as strings
        return ref.selector(selector).type === 'string';
    }
}

ref.validValue = function(env, selector, value) {
    var i, j;
    // TODO: handle in reusable way
    if (!ref.selector(selector)) {
        return false;
    } else if (value.value[0].is == 'keyword') {
        return validateKeyword(value, selector);
    } else if (value.value[0].is == 'undefined') {
        // caught earlier in the chain - ignore here so that
        // error is not overridden
        return true;
    } else if (ref.selector(selector).type == 'numbers') {
        for (i in value.value) {
            if (value.value[i].is !== 'float') {
                return false;
            }
        }
        return true;
    } else if (ref.selector(selector).type == 'tags') {
        if (!value.value) return false;
        if (!value.value[0].value) {
            return value.value[0].is === 'tag';
        }
        for (i = 0; i < value.value[0].value.length; i++) {
            if (value.value[0].value[i].is !== 'tag') return false;
        }
        return true;
    } else if (ref.selector(selector).type == 'functions') {
        // For backwards compatibility, you can specify a string for `functions`-compatible
        // values, though they will not be validated.
        return validateFunctions(value, selector);
    } else if (ref.selector(selector).type === 'unsigned') {
        if (value.value[0].is === 'float') {
            value.value[0].round();
            return true;
        } else {
            return false;
        }
    } else if ((ref.selector(selector).expression)) {
        return true;
    } else {
        if (ref.selector(selector).validate) {
            var valid = false;
            for (i = 0; i < value.value.length; i++) {
                if (ref.selector(selector).type == value.value[i].is &&
                    ref
                        ._validateValue
                            [ref.selector(selector).validate]
                            (env, value.value[i].value)) {
                    return true;
                }
            }
            return valid;
        } else {
            return ref.selector(selector).type == value.value[0].is;
        }
    }
};

tree.Reference = ref;

})(require('../tree'));

},{"../tree":7,"mapnik-reference":43,"underscore":44}],28:[function(require,module,exports){
(function(tree) {
// a rule is a single property and value combination, or variable
// name and value combination, like
// polygon-opacity: 1.0; or @opacity: 1.0;
tree.Rule = function Rule(name, value, index, filename) {
    var parts = name.split('/');
    this.name = parts.pop();
    this.instance = parts.length ? parts[0] : '__default__';
    this.value = (value instanceof tree.Value) ?
        value : new tree.Value([value]);
    this.index = index;
    this.symbolizer = tree.Reference.symbolizer(this.name);
    this.filename = filename;
    this.variable = (name.charAt(0) === '@');
};

tree.Rule.prototype.is = 'rule';

tree.Rule.prototype.clone = function() {
    var clone = Object.create(tree.Rule.prototype);
    clone.name = this.name;
    clone.value = this.value;
    clone.index = this.index;
    clone.instance = this.instance;
    clone.symbolizer = this.symbolizer;
    clone.filename = this.filename;
    clone.variable = this.variable;
    return clone;
};

tree.Rule.prototype.updateID = function() {
    return this.id = this.zoom + '#' + this.instance + '#' + this.name;
};

tree.Rule.prototype.toString = function() {
    return '[' + tree.Zoom.toString(this.zoom) + '] ' + this.name + ': ' + this.value;
};

function getMean(name) {
    return Object.keys(tree.Reference.selector_cache).map(function(f) {
        return [f, tree.Reference.editDistance(name, f)];
    }).sort(function(a, b) { return a[1] - b[1]; });
}

// second argument, if true, outputs the value of this
// rule without the usual attribute="content" wrapping. Right
// now this is just for the TextSymbolizer, but applies to other
// properties in reference.json which specify serialization=content
tree.Rule.prototype.toXML = function(env, content, sep, format) {
    if (!tree.Reference.validSelector(this.name)) {
        var mean = getMean(this.name);
        var mean_message = '';
        if (mean[0][1] < 3) {
            mean_message = '. Did you mean ' + mean[0][0] + '?';
        }
        return env.error({
            message: "Unrecognized rule: " + this.name + mean_message,
            index: this.index,
            type: 'syntax',
            filename: this.filename
        });
    }

    if ((this.value instanceof tree.Value) &&
        !tree.Reference.validValue(env, this.name, this.value)) {
        if (!tree.Reference.selector(this.name)) {
            return env.error({
                message: 'Unrecognized property: ' +
                    this.name,
                index: this.index,
                type: 'syntax',
                filename: this.filename
            });
        } else {
            var typename;
            if (tree.Reference.selector(this.name).validate) {
                typename = tree.Reference.selector(this.name).validate;
            } else if (typeof tree.Reference.selector(this.name).type === 'object') {
                typename = 'keyword (options: ' + tree.Reference.selector(this.name).type.join(', ') + ')';
            } else {
                typename = tree.Reference.selector(this.name).type;
            }
            return env.error({
                message: 'Invalid value for ' +
                    this.name +
                    ', the type ' + typename +
                    ' is expected. ' + this.value +
                    ' (of type ' + this.value.value[0].is + ') ' +
                    ' was given.',
                index: this.index,
                type: 'syntax',
                filename: this.filename
            });
        }
    }

    if (this.variable) {
        return '';
    } else if (tree.Reference.isFont(this.name) && this.value.value.length > 1) {
        var f = tree._getFontSet(env, this.value.value);
        return 'fontset-name="' + f.name + '"';
    } else if (content) {
        return this.value.toString(env, this.name, sep);
    } else {
        return tree.Reference.selectorName(this.name) +
            '="' +
            this.value.toString(env, this.name) +
            '"';
    }
};

// TODO: Rule ev chain should add fontsets to env.frames
tree.Rule.prototype.ev = function(context) {
    return new tree.Rule(this.name,
        this.value.ev(context),
        this.index,
        this.filename);
};

})(require('../tree'));

},{"../tree":7}],29:[function(require,module,exports){
(function(tree) {

tree.Ruleset = function Ruleset(selectors, rules) {
    this.selectors = selectors;
    this.rules = rules;
    // static cache of find() function
    this._lookups = {};
};
tree.Ruleset.prototype = {
    is: 'ruleset',
    'ev': function(env) {
        var i,
            ruleset = new tree.Ruleset(this.selectors, this.rules.slice(0));
        ruleset.root = this.root;

        // push the current ruleset to the frames stack
        env.frames.unshift(ruleset);

        // Evaluate everything else
        for (i = 0, rule; i < ruleset.rules.length; i++) {
            rule = ruleset.rules[i];
            ruleset.rules[i] = rule.ev ? rule.ev(env) : rule;
        }

        // Pop the stack
        env.frames.shift();

        return ruleset;
    },
    match: function(args) {
        return !args || args.length === 0;
    },
    variables: function() {
        if (this._variables) { return this._variables; }
        else {
            return this._variables = this.rules.reduce(function(hash, r) {
                if (r instanceof tree.Rule && r.variable === true) {
                    hash[r.name] = r;
                }
                return hash;
            }, {});
        }
    },
    variable: function(name) {
        return this.variables()[name];
    },
    rulesets: function() {
        if (this._rulesets) { return this._rulesets; }
        else {
            return this._rulesets = this.rules.filter(function(r) {
                return (r instanceof tree.Ruleset);
            });
        }
    },
    find: function(selector, self) {
        self = self || this;
        var rules = [], rule, match,
            key = selector.toString();

        if (key in this._lookups) { return this._lookups[key]; }

        this.rulesets().forEach(function(rule) {
            if (rule !== self) {
                for (var j = 0; j < rule.selectors.length; j++) {
                    match = selector.match(rule.selectors[j]);
                    if (match) {
                        if (selector.elements.length > 1) {
                            Array.prototype.push.apply(rules, rule.find(
                                new tree.Selector(null, null, null, selector.elements.slice(1)), self));
                        } else {
                            rules.push(rule);
                        }
                        break;
                    }
                }
            }
        });
        return this._lookups[key] = rules;
    },
    // Zooms can use variables. This replaces tree.Zoom objects on selectors
    // with simple bit-arrays that we can compare easily.
    evZooms: function(env) {
        for (var i = 0; i < this.selectors.length; i++) {
            var zval = tree.Zoom.all;
            for (var z = 0; z < this.selectors[i].zoom.length; z++) {
                zval = zval & this.selectors[i].zoom[z].ev(env).zoom;
            }
            this.selectors[i].zoom = zval;
        }
    },
    flatten: function(result, parents, env) {
        var selectors = [], i, j;
        if (this.selectors.length === 0) {
            env.frames = env.frames.concat(this.rules);
        }
        // evaluate zoom variables on this object.
        this.evZooms(env);
        for (i = 0; i < this.selectors.length; i++) {
            var child = this.selectors[i];

            if (!child.filters) {
                // TODO: is this internal inconsistency?
                // This is an invalid filterset.
                continue;
            }

            if (parents.length) {
                for (j = 0; j < parents.length; j++) {
                    var parent = parents[j];

                    var mergedFilters = parent.filters.cloneWith(child.filters);
                    if (mergedFilters === null) {
                        // Filters could be added, but they didn't change the
                        // filters. This means that we only have to clone when
                        // the zoom levels or the attachment is different too.
                        if (parent.zoom === (parent.zoom & child.zoom) &&
                            parent.frame_offset === child.frame_offset &&
                            parent.attachment === child.attachment &&
                            parent.elements.join() === child.elements.join()) {
                            selectors.push(parent);
                            continue;
                        } else {
                            mergedFilters = parent.filters;
                        }
                    } else if (!mergedFilters) {
                        // The merged filters are invalid, that means we don't
                        // have to clone.
                        continue;
                    }

                    var clone = Object.create(tree.Selector.prototype);
                    clone.filters = mergedFilters;
                    clone.zoom = parent.zoom & child.zoom;
                    clone.frame_offset = child.frame_offset;
                    clone.elements = parent.elements.concat(child.elements);
                    if (parent.attachment && child.attachment) {
                        clone.attachment = parent.attachment + '/' + child.attachment;
                    }
                    else clone.attachment = child.attachment || parent.attachment;
                    clone.conditions = parent.conditions + child.conditions;
                    clone.index = child.index;
                    selectors.push(clone);
                }
            } else {
                selectors.push(child);
            }
        }

        var rules = [];
        for (i = 0; i < this.rules.length; i++) {
            var rule = this.rules[i];

            // Recursively flatten any nested rulesets
            if (rule instanceof tree.Ruleset) {
                rule.flatten(result, selectors, env);
            } else if (rule instanceof tree.Rule) {
                rules.push(rule);
            } else if (rule instanceof tree.Invalid) {
                env.error(rule);
            }
        }

        var index = rules.length ? rules[0].index : false;
        for (i = 0; i < selectors.length; i++) {
            // For specificity sort, use the position of the first rule to allow
            // defining attachments that are under current element as a descendant
            // selector.
            if (index !== false) {
                selectors[i].index = index;
            }
            result.push(new tree.Definition(selectors[i], rules.slice()));
        }

        return result;
    }
};
})(require('../tree'));

},{"../tree":7}],30:[function(require,module,exports){
(function(tree) {

tree.Selector = function Selector(filters, zoom, frame_offset, elements, attachment, conditions, index) {
    this.elements = elements || [];
    this.attachment = attachment;
    this.filters = filters || {};
    this.frame_offset = frame_offset;
    this.zoom = typeof zoom !== 'undefined' ? zoom : tree.Zoom.all;
    this.conditions = conditions;
    this.index = index;
};

// Determine the specificity of this selector
// based on the specificity of its elements - calling
// Element.specificity() in order to do so
//
// [ID, Class, Filters, Position in document]
tree.Selector.prototype.specificity = function() {
    return this.elements.reduce(function(memo, e) {
        var spec = e.specificity();
        memo[0] += spec[0];
        memo[1] += spec[1];
        return memo;
    }, [0, 0, this.conditions, this.index]);
};

})(require('../tree'));

},{"../tree":7}],31:[function(require,module,exports){
(function(tree) {
var _ = require('underscore');

// Given a style's name, attachment, definitions, and an environment object,
// return a stringified style for Mapnik
tree.StyleXML = function(name, attachment, definitions, env) {
    var existing = {};
    var image_filters = [], image_filters_inflate = [], direct_image_filters = [], comp_op = [], opacity = [];

    for (var i = 0; i < definitions.length; i++) {
        for (var j = 0; j < definitions[i].rules.length; j++) {
            if (definitions[i].rules[j].name === 'image-filters') {
                image_filters.push(definitions[i].rules[j]);
            }
            if (definitions[i].rules[j].name === 'image-filters-inflate') {
                image_filters_inflate.push(definitions[i].rules[j]);
            }
            if (definitions[i].rules[j].name === 'direct-image-filters') {
                direct_image_filters.push(definitions[i].rules[j]);
            }
            if (definitions[i].rules[j].name === 'comp-op') {
                comp_op.push(definitions[i].rules[j]);
            }
            if (definitions[i].rules[j].name === 'opacity') {
                opacity.push(definitions[i].rules[j]);
            }
        }
    }

    var rules = definitions.map(function(definition) {
        return definition.toXML(env, existing);
    });

    var attrs_xml = '';

    if (image_filters.length) {
        attrs_xml += ' image-filters="' + _.chain(image_filters)
            // prevent identical filters from being duplicated in the style
            .uniq(function(i) { return i.id; }).map(function(f) {
            return f.ev(env).toXML(env, true, ',', 'image-filter');
        }).value().join(',') + '"';
    }

    if (image_filters_inflate.length) {
        attrs_xml += ' image-filters-inflate="' + image_filters_inflate[0].value.ev(env).toString() + '"';
    }

    if (direct_image_filters.length) {
        attrs_xml += ' direct-image-filters="' + _.chain(direct_image_filters)
            // prevent identical filters from being duplicated in the style
            .uniq(function(i) { return i.id; }).map(function(f) {
            return f.ev(env).toXML(env, true, ',', 'direct-image-filter');
        }).value().join(',') + '"';
    }

    if (comp_op.length && comp_op[0].value.ev(env).value != 'src-over') {
        attrs_xml += ' comp-op="' + comp_op[0].value.ev(env).toString() + '"';
    }

    if (opacity.length && opacity[0].value.ev(env).value != 1) {
        attrs_xml += ' opacity="' + opacity[0].value.ev(env).toString() + '"';
    }
    var rule_string = rules.join('');
    if (!attrs_xml && !rule_string) return '';
    return '<Style name="' + name + '" filter-mode="first"' + attrs_xml + '>\n' + rule_string + '</Style>';
};

})(require('../tree'));

},{"../tree":7,"underscore":44}],32:[function(require,module,exports){
(function(tree) {

tree.URL = function URL(val, paths) {
    this.value = val;
    this.paths = paths;
};

tree.URL.prototype = {
    is: 'uri',
    toString: function() {
        return this.value.toString();
    },
    ev: function(ctx) {
        return new tree.URL(this.value.ev(ctx), this.paths);
    }
};

})(require('../tree'));

},{"../tree":7}],33:[function(require,module,exports){
(function(tree) {

tree.Value = function Value(value) {
    this.value = value;
};

tree.Value.prototype = {
    is: 'value',
    ev: function(env) {
        if (this.value.length === 1) {
            return this.value[0].ev(env);
        } else {
            return new tree.Value(this.value.map(function(v) {
                return v.ev(env);
            }));
        }
    },
    toString: function(env, selector, sep, format) {
        return this.value.map(function(e) {
            return e.toString(env, format);
        }).join(sep || ', ');
    },
    clone: function() {
        var obj = Object.create(tree.Value.prototype);
        if (Array.isArray(obj)) obj.value = this.value.slice();
        else obj.value = this.value;
        obj.is = this.is;
        return obj;
    },

    toJS: function(env) {
      //var v = this.value[0].value[0];
      var val = this.ev(env);
      var v = val.toString();
      if(val.is === "color" || val.is === 'uri' || val.is === 'string' || val.is === 'keyword') {
        v = "'" + v + "'";
      } else if (val.is === 'field') {
        // replace [variable] by ctx['variable']
        v = v.replace(/\[(.*)\]/g, "data['$1']");
      }
      return "_value = " + v + ";";
    }

};

})(require('../tree'));

},{"../tree":7}],34:[function(require,module,exports){
(function(tree) {

tree.Variable = function Variable(name, index, filename) {
    this.name = name;
    this.index = index;
    this.filename = filename;
};

tree.Variable.prototype = {
    is: 'variable',
    toString: function() {
        return this.name;
    },
    ev: function(env) {
        var variable,
            v,
            name = this.name;

        if (this._css) return this._css;

        var thisframe = env.frames.filter(function(f) {
            return f.name == this.name;
        }.bind(this));
        if (thisframe.length) {
            return thisframe[0].value.ev(env);
        } else {
            env.error({
                message: 'variable ' + this.name + ' is undefined',
                index: this.index,
                type: 'runtime',
                filename: this.filename
            });
            return {
                is: 'undefined',
                value: 'undefined'
            };
        }
    }
};

})(require('../tree'));

},{"../tree":7}],35:[function(require,module,exports){
var tree = require('../tree');

// Storage for zoom ranges. Only supports continuous ranges,
// and stores them as bit-sequences so that they can be combined,
// inverted, and compared quickly.
tree.Zoom = function(op, value, index) {
    this.op = op;
    this.value = value;
    this.index = index;
};

tree.Zoom.prototype.setZoom = function(zoom) {
    this.zoom = zoom;
    return this;
};

tree.Zoom.prototype.ev = function(env) {
    var start = 0,
        end = Infinity,
        value = parseInt(this.value.ev(env).toString(), 10),
        zoom = 0;

    if (value > tree.Zoom.maxZoom || value < 0) {
        env.error({
            message: 'Only zoom levels between 0 and ' +
                tree.Zoom.maxZoom + ' supported.',
            index: this.index
        });
    }

    switch (this.op) {
        case '=':
            this.zoom = 1 << value;
            return this;
        case '>':
            start = value + 1;
            break;
        case '>=':
            start = value;
            break;
        case '<':
            end = value - 1;
            break;
        case '<=':
            end = value;
            break;
    }
    for (var i = 0; i <= tree.Zoom.maxZoom; i++) {
        if (i >= start && i <= end) {
            zoom |= (1 << i);
        }
    }
    this.zoom = zoom;
    return this;
};

tree.Zoom.prototype.toString = function() {
    return this.zoom;
};

// Covers all zoomlevels from 0 to 22
tree.Zoom.all = 0x7FFFFF;

tree.Zoom.maxZoom = 22;

tree.Zoom.ranges = {
     0: 1000000000,
     1: 500000000,
     2: 200000000,
     3: 100000000,
     4: 50000000,
     5: 25000000,
     6: 12500000,
     7: 6500000,
     8: 3000000,
     9: 1500000,
    10: 750000,
    11: 400000,
    12: 200000,
    13: 100000,
    14: 50000,
    15: 25000,
    16: 12500,
    17: 5000,
    18: 2500,
    19: 1500,
    20: 750,
    21: 500,
    22: 250,
    23: 100
};

// Only works for single range zooms. `[XXX....XXXXX.........]` is invalid.
tree.Zoom.prototype.toXML = function() {
    var conditions = [];
    if (this.zoom != tree.Zoom.all) {
        var start = null, end = null;
        for (var i = 0; i <= tree.Zoom.maxZoom; i++) {
            if (this.zoom & (1 << i)) {
                if (start === null) start = i;
                end = i;
            }
        }
        if (start > 0) conditions.push('    <MaxScaleDenominator>' +
            tree.Zoom.ranges[start] + '</MaxScaleDenominator>\n');
        if (end < 22) conditions.push('    <MinScaleDenominator>' +
            tree.Zoom.ranges[end + 1] + '</MinScaleDenominator>\n');
    }
    return conditions;
};

tree.Zoom.prototype.toString = function() {
    var str = '';
    for (var i = 0; i <= tree.Zoom.maxZoom; i++) {
        str += (this.zoom & (1 << i)) ? 'X' : '.';
    }
    return str;
};

},{"../tree":7}],36:[function(require,module,exports){

},{}],37:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":42}],38:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],39:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":40}],40:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],41:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],42:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":41,"_process":40,"inherits":38}],43:[function(require,module,exports){
(function (__dirname){
var fs = require('fs'),
    path = require('path'),
    existsSync = require('fs').existsSync || require('path').existsSync;

// Load all stated versions into the module exports
module.exports.version = {};

var refs = [
 '2.0.0',
 '2.0.1',
 '2.0.2',
 '2.1.0',
 '2.1.1',
 '2.2.0',
 '2.3.0',
 '3.0.0'
];

refs.map(function(version) {
    module.exports.version[version] = require(path.join(__dirname, version, 'reference.json'));
    var ds_path = path.join(__dirname, version, 'datasources.json');
    if (existsSync(ds_path)) {
        module.exports.version[version].datasources = require(ds_path).datasources;
    }
});

}).call(this,"/node_modules/mapnik-reference")
},{"fs":36,"path":39}],44:[function(require,module,exports){
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

},{}],45:[function(require,module,exports){
module.exports={
  "name": "carto",
  "version": "0.14.0",
  "description": "Mapnik Stylesheet Compiler",
  "url": "https://github.com/mapbox/carto",
  "repository": {
    "type": "git",
    "url": "http://github.com/mapbox/carto.git"
  },
  "author": {
    "name": "Mapbox",
    "url": "http://mapbox.com/",
    "email": "info@mapbox.com"
  },
  "keywords": [
    "mapnik",
    "maps",
    "css",
    "stylesheets"
  ],
  "contributors": [
    "Tom MacWright <macwright@gmail.com>",
    "Konstantin Käfer",
    "Alexis Sellier <self@cloudhead.net>"
  ],
  "licenses": [
    {
      "type": "Apache"
    }
  ],
  "bin": {
    "carto": "./bin/carto"
  },
  "man": "./man/carto.1",
  "main": "./lib/carto/index",
  "engines": {
    "node": ">=0.4.x"
  },
  "dependencies": {
    "underscore": "~1.6.0",
    "mapnik-reference": "~6.0.2",
    "optimist": "~0.6.0"
  },
  "devDependencies": {
    "mocha": "1.12.x",
    "jshint": "0.2.x",
    "sax": "0.1.x",
    "istanbul": "~0.2.14",
    "coveralls": "~2.10.1",
    "browserify": "~7.0.0"
  },
  "scripts": {
    "pretest": "npm install",
    "test": "mocha -R spec",
    "coverage": "istanbul cover ./node_modules/.bin/_mocha && coveralls < ./coverage/lcov.info"
  }
}

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY2FydG8vZnVuY3Rpb25zLmpzIiwibGliL2NhcnRvL2luZGV4LmpzIiwibGliL2NhcnRvL3BhcnNlci5qcyIsImxpYi9jYXJ0by9yZW5kZXJlci5qcyIsImxpYi9jYXJ0by9yZW5kZXJlcl9qcy5qcyIsImxpYi9jYXJ0by90b3JxdWUtcmVmZXJlbmNlLmpzIiwibGliL2NhcnRvL3RyZWUuanMiLCJsaWIvY2FydG8vdHJlZS9jYWxsLmpzIiwibGliL2NhcnRvL3RyZWUvY29sb3IuanMiLCJsaWIvY2FydG8vdHJlZS9jb21tZW50LmpzIiwibGliL2NhcnRvL3RyZWUvZGVmaW5pdGlvbi5qcyIsImxpYi9jYXJ0by90cmVlL2RpbWVuc2lvbi5qcyIsImxpYi9jYXJ0by90cmVlL2VsZW1lbnQuanMiLCJsaWIvY2FydG8vdHJlZS9leHByZXNzaW9uLmpzIiwibGliL2NhcnRvL3RyZWUvZmllbGQuanMiLCJsaWIvY2FydG8vdHJlZS9maWx0ZXIuanMiLCJsaWIvY2FydG8vdHJlZS9maWx0ZXJzZXQuanMiLCJsaWIvY2FydG8vdHJlZS9mb250c2V0LmpzIiwibGliL2NhcnRvL3RyZWUvZnJhbWVfb2Zmc2V0LmpzIiwibGliL2NhcnRvL3RyZWUvaW1hZ2VmaWx0ZXIuanMiLCJsaWIvY2FydG8vdHJlZS9pbnZhbGlkLmpzIiwibGliL2NhcnRvL3RyZWUva2V5d29yZC5qcyIsImxpYi9jYXJ0by90cmVlL2xheWVyLmpzIiwibGliL2NhcnRvL3RyZWUvbGl0ZXJhbC5qcyIsImxpYi9jYXJ0by90cmVlL29wZXJhdGlvbi5qcyIsImxpYi9jYXJ0by90cmVlL3F1b3RlZC5qcyIsImxpYi9jYXJ0by90cmVlL3JlZmVyZW5jZS5qcyIsImxpYi9jYXJ0by90cmVlL3J1bGUuanMiLCJsaWIvY2FydG8vdHJlZS9ydWxlc2V0LmpzIiwibGliL2NhcnRvL3RyZWUvc2VsZWN0b3IuanMiLCJsaWIvY2FydG8vdHJlZS9zdHlsZS5qcyIsImxpYi9jYXJ0by90cmVlL3VybC5qcyIsImxpYi9jYXJ0by90cmVlL3ZhbHVlLmpzIiwibGliL2NhcnRvL3RyZWUvdmFyaWFibGUuanMiLCJsaWIvY2FydG8vdHJlZS96b29tLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbGliL19lbXB0eS5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9tYXBuaWstcmVmZXJlbmNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsInBhY2thZ2UuanNvbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzd3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcjJEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25RQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1a0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKHRyZWUpIHtcblxudHJlZS5mdW5jdGlvbnMgPSB7XG4gICAgcmdiOiBmdW5jdGlvbiAociwgZywgYikge1xuICAgICAgICByZXR1cm4gdGhpcy5yZ2JhKHIsIGcsIGIsIDEuMCk7XG4gICAgfSxcbiAgICByZ2JhOiBmdW5jdGlvbiAociwgZywgYiwgYSkge1xuICAgICAgICB2YXIgcmdiID0gW3IsIGcsIGJdLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gbnVtYmVyKGMpOyB9KTtcbiAgICAgICAgYSA9IG51bWJlcihhKTtcbiAgICAgICAgaWYgKHJnYi5zb21lKGlzTmFOKSB8fCBpc05hTihhKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5Db2xvcihyZ2IsIGEpO1xuICAgIH0sXG4gICAgLy8gT25seSByZXF1aXJlIHZhbFxuICAgIHN0b3A6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdmFyIGNvbG9yLCBtb2RlO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIGNvbG9yID0gYXJndW1lbnRzWzFdO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIG1vZGUgPSBhcmd1bWVudHNbMl07XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzOiAndGFnJyxcbiAgICAgICAgICAgIHZhbDogdmFsLFxuICAgICAgICAgICAgY29sb3I6IGNvbG9yLFxuICAgICAgICAgICAgbW9kZTogbW9kZSxcbiAgICAgICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1xcblxcdDxzdG9wIHZhbHVlPVwiJyArIHZhbC5ldihlbnYpICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgIChjb2xvciA/ICcgY29sb3I9XCInICsgY29sb3IuZXYoZW52KSArICdcIiAnIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgKG1vZGUgPyAnIG1vZGU9XCInICsgbW9kZS5ldihlbnYpICsgJ1wiICcgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgICAnLz4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgaHNsOiBmdW5jdGlvbiAoaCwgcywgbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oc2xhKGgsIHMsIGwsIDEuMCk7XG4gICAgfSxcbiAgICBoc2xhOiBmdW5jdGlvbiAoaCwgcywgbCwgYSkge1xuICAgICAgICBoID0gKG51bWJlcihoKSAlIDM2MCkgLyAzNjA7XG4gICAgICAgIHMgPSBudW1iZXIocyk7IGwgPSBudW1iZXIobCk7IGEgPSBudW1iZXIoYSk7XG4gICAgICAgIGlmIChbaCwgcywgbCwgYV0uc29tZShpc05hTikpIHJldHVybiBudWxsO1xuXG4gICAgICAgIHZhciBtMiA9IGwgPD0gMC41ID8gbCAqIChzICsgMSkgOiBsICsgcyAtIGwgKiBzLFxuICAgICAgICAgICAgbTEgPSBsICogMiAtIG0yO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJnYmEoaHVlKGggKyAxLzMpICogMjU1LFxuICAgICAgICAgICAgICAgICAgICAgICAgIGh1ZShoKSAgICAgICAqIDI1NSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBodWUoaCAtIDEvMykgKiAyNTUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgYSk7XG5cbiAgICAgICAgZnVuY3Rpb24gaHVlKGgpIHtcbiAgICAgICAgICAgIGggPSBoIDwgMCA/IGggKyAxIDogKGggPiAxID8gaCAtIDEgOiBoKTtcbiAgICAgICAgICAgIGlmICAgICAgKGggKiA2IDwgMSkgcmV0dXJuIG0xICsgKG0yIC0gbTEpICogaCAqIDY7XG4gICAgICAgICAgICBlbHNlIGlmIChoICogMiA8IDEpIHJldHVybiBtMjtcbiAgICAgICAgICAgIGVsc2UgaWYgKGggKiAzIDwgMikgcmV0dXJuIG0xICsgKG0yIC0gbTEpICogKDIvMyAtIGgpICogNjtcbiAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgcmV0dXJuIG0xO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBodWU6IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICBpZiAoISgndG9IU0wnIGluIGNvbG9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5EaW1lbnNpb24oTWF0aC5yb3VuZChjb2xvci50b0hTTCgpLmgpKTtcbiAgICB9LFxuICAgIHNhdHVyYXRpb246IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICBpZiAoISgndG9IU0wnIGluIGNvbG9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5EaW1lbnNpb24oTWF0aC5yb3VuZChjb2xvci50b0hTTCgpLnMgKiAxMDApLCAnJScpO1xuICAgIH0sXG4gICAgbGlnaHRuZXNzOiBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuRGltZW5zaW9uKE1hdGgucm91bmQoY29sb3IudG9IU0woKS5sICogMTAwKSwgJyUnKTtcbiAgICB9LFxuICAgIGFscGhhOiBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuRGltZW5zaW9uKGNvbG9yLnRvSFNMKCkuYSk7XG4gICAgfSxcbiAgICBzYXR1cmF0ZTogZnVuY3Rpb24gKGNvbG9yLCBhbW91bnQpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgaHNsID0gY29sb3IudG9IU0woKTtcblxuICAgICAgICBoc2wucyArPSBhbW91bnQudmFsdWUgLyAxMDA7XG4gICAgICAgIGhzbC5zID0gY2xhbXAoaHNsLnMpO1xuICAgICAgICByZXR1cm4gaHNsYShoc2wpO1xuICAgIH0sXG4gICAgZGVzYXR1cmF0ZTogZnVuY3Rpb24gKGNvbG9yLCBhbW91bnQpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgaHNsID0gY29sb3IudG9IU0woKTtcblxuICAgICAgICBoc2wucyAtPSBhbW91bnQudmFsdWUgLyAxMDA7XG4gICAgICAgIGhzbC5zID0gY2xhbXAoaHNsLnMpO1xuICAgICAgICByZXR1cm4gaHNsYShoc2wpO1xuICAgIH0sXG4gICAgbGlnaHRlbjogZnVuY3Rpb24gKGNvbG9yLCBhbW91bnQpIHtcbiAgICAgICAgaWYgKCEoJ3RvSFNMJyBpbiBjb2xvcikpIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgaHNsID0gY29sb3IudG9IU0woKTtcblxuICAgICAgICBoc2wubCArPSBhbW91bnQudmFsdWUgLyAxMDA7XG4gICAgICAgIGhzbC5sID0gY2xhbXAoaHNsLmwpO1xuICAgICAgICByZXR1cm4gaHNsYShoc2wpO1xuICAgIH0sXG4gICAgZGFya2VuOiBmdW5jdGlvbiAoY29sb3IsIGFtb3VudCkge1xuICAgICAgICBpZiAoISgndG9IU0wnIGluIGNvbG9yKSkgcmV0dXJuIG51bGw7XG4gICAgICAgIHZhciBoc2wgPSBjb2xvci50b0hTTCgpO1xuXG4gICAgICAgIGhzbC5sIC09IGFtb3VudC52YWx1ZSAvIDEwMDtcbiAgICAgICAgaHNsLmwgPSBjbGFtcChoc2wubCk7XG4gICAgICAgIHJldHVybiBoc2xhKGhzbCk7XG4gICAgfSxcbiAgICBmYWRlaW46IGZ1bmN0aW9uIChjb2xvciwgYW1vdW50KSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGhzbCA9IGNvbG9yLnRvSFNMKCk7XG5cbiAgICAgICAgaHNsLmEgKz0gYW1vdW50LnZhbHVlIC8gMTAwO1xuICAgICAgICBoc2wuYSA9IGNsYW1wKGhzbC5hKTtcbiAgICAgICAgcmV0dXJuIGhzbGEoaHNsKTtcbiAgICB9LFxuICAgIGZhZGVvdXQ6IGZ1bmN0aW9uIChjb2xvciwgYW1vdW50KSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGhzbCA9IGNvbG9yLnRvSFNMKCk7XG5cbiAgICAgICAgaHNsLmEgLT0gYW1vdW50LnZhbHVlIC8gMTAwO1xuICAgICAgICBoc2wuYSA9IGNsYW1wKGhzbC5hKTtcbiAgICAgICAgcmV0dXJuIGhzbGEoaHNsKTtcbiAgICB9LFxuICAgIHNwaW46IGZ1bmN0aW9uIChjb2xvciwgYW1vdW50KSB7XG4gICAgICAgIGlmICghKCd0b0hTTCcgaW4gY29sb3IpKSByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGhzbCA9IGNvbG9yLnRvSFNMKCk7XG4gICAgICAgIHZhciBodWUgPSAoaHNsLmggKyBhbW91bnQudmFsdWUpICUgMzYwO1xuXG4gICAgICAgIGhzbC5oID0gaHVlIDwgMCA/IDM2MCArIGh1ZSA6IGh1ZTtcblxuICAgICAgICByZXR1cm4gaHNsYShoc2wpO1xuICAgIH0sXG4gICAgcmVwbGFjZTogZnVuY3Rpb24gKGVudGl0eSwgYSwgYikge1xuICAgICAgICBpZiAoZW50aXR5LmlzID09PSAnZmllbGQnKSB7XG4gICAgICAgICAgICByZXR1cm4gZW50aXR5LnRvU3RyaW5nICsgJy5yZXBsYWNlKCcgKyBhLnRvU3RyaW5nKCkgKyAnLCAnICsgYi50b1N0cmluZygpICsgJyknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGVudGl0eS5yZXBsYWNlKGEsIGIpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvL1xuICAgIC8vIENvcHlyaWdodCAoYykgMjAwNi0yMDA5IEhhbXB0b24gQ2F0bGluLCBOYXRoYW4gV2VpemVuYmF1bSwgYW5kIENocmlzIEVwcHN0ZWluXG4gICAgLy8gaHR0cDovL3Nhc3MtbGFuZy5jb21cbiAgICAvL1xuICAgIG1peDogZnVuY3Rpb24gKGNvbG9yMSwgY29sb3IyLCB3ZWlnaHQpIHtcbiAgICAgICAgdmFyIHAgPSB3ZWlnaHQudmFsdWUgLyAxMDAuMDtcbiAgICAgICAgdmFyIHcgPSBwICogMiAtIDE7XG4gICAgICAgIHZhciBhID0gY29sb3IxLnRvSFNMKCkuYSAtIGNvbG9yMi50b0hTTCgpLmE7XG5cbiAgICAgICAgdmFyIHcxID0gKCgodyAqIGEgPT0gLTEpID8gdyA6ICh3ICsgYSkgLyAoMSArIHcgKiBhKSkgKyAxKSAvIDIuMDtcbiAgICAgICAgdmFyIHcyID0gMSAtIHcxO1xuXG4gICAgICAgIHZhciByZ2IgPSBbY29sb3IxLnJnYlswXSAqIHcxICsgY29sb3IyLnJnYlswXSAqIHcyLFxuICAgICAgICAgICAgICAgICAgIGNvbG9yMS5yZ2JbMV0gKiB3MSArIGNvbG9yMi5yZ2JbMV0gKiB3MixcbiAgICAgICAgICAgICAgICAgICBjb2xvcjEucmdiWzJdICogdzEgKyBjb2xvcjIucmdiWzJdICogdzJdO1xuXG4gICAgICAgIHZhciBhbHBoYSA9IGNvbG9yMS5hbHBoYSAqIHAgKyBjb2xvcjIuYWxwaGEgKiAoMSAtIHApO1xuXG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5Db2xvcihyZ2IsIGFscGhhKTtcbiAgICB9LFxuICAgIGdyZXlzY2FsZTogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlc2F0dXJhdGUoY29sb3IsIG5ldyB0cmVlLkRpbWVuc2lvbigxMDApKTtcbiAgICB9LFxuICAgICclJzogZnVuY3Rpb24gKHF1b3RlZCAvKiBhcmcsIGFyZywgLi4uKi8pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxuICAgICAgICAgICAgc3RyID0gcXVvdGVkLnZhbHVlO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoLyVzLywgICAgYXJnc1tpXS52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8lW2RhXS8sIGFyZ3NbaV0udG9TdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoLyUlL2csICclJyk7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5RdW90ZWQoc3RyKTtcbiAgICB9XG59O1xuXG52YXIgaW1hZ2VfZmlsdGVyX2Z1bmN0b3JzID0gW1xuICAgICdlbWJvc3MnLCAnYmx1cicsICdncmF5JywgJ3NvYmVsJywgJ2VkZ2UtZGV0ZWN0JyxcbiAgICAneC1ncmFkaWVudCcsICd5LWdyYWRpZW50JywgJ3NoYXJwZW4nXTtcblxuZm9yICh2YXIgaSA9IDA7IGkgPCBpbWFnZV9maWx0ZXJfZnVuY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZiA9IGltYWdlX2ZpbHRlcl9mdW5jdG9yc1tpXTtcbiAgICB0cmVlLmZ1bmN0aW9uc1tmXSA9IChmdW5jdGlvbihmKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5JbWFnZUZpbHRlcihmKTtcbiAgICAgICAgfTtcbiAgICB9KShmKTtcbn1cblxudHJlZS5mdW5jdGlvbnNbJ2FnZy1zdGFjay1ibHVyJ10gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgcmV0dXJuIG5ldyB0cmVlLkltYWdlRmlsdGVyKCdhZ2ctc3RhY2stYmx1cicsIFt4LCB5XSk7XG59O1xuXG50cmVlLmZ1bmN0aW9uc1snc2NhbGUtaHNsYSddID0gZnVuY3Rpb24oaDAsaDEsczAsczEsbDAsbDEsYTAsYTEpIHtcbiAgICByZXR1cm4gbmV3IHRyZWUuSW1hZ2VGaWx0ZXIoJ3NjYWxlLWhzbGEnLCBbaDAsaDEsczAsczEsbDAsbDEsYTAsYTFdKTtcbn07XG5cbmZ1bmN0aW9uIGhzbGEoaCkge1xuICAgIHJldHVybiB0cmVlLmZ1bmN0aW9ucy5oc2xhKGguaCwgaC5zLCBoLmwsIGguYSk7XG59XG5cbmZ1bmN0aW9uIG51bWJlcihuKSB7XG4gICAgaWYgKG4gaW5zdGFuY2VvZiB0cmVlLkRpbWVuc2lvbikge1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChuLnVuaXQgPT0gJyUnID8gbi52YWx1ZSAvIDEwMCA6IG4udmFsdWUpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mKG4pID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gbjtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTmFOO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xhbXAodmFsKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKDEsIE1hdGgubWF4KDAsIHZhbCkpO1xufVxuXG59KShyZXF1aXJlKCcuL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3MsX19kaXJuYW1lKXtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIGZzID0gcmVxdWlyZSgnZnMnKSxcbiAgICBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG5cbmZ1bmN0aW9uIGdldFZlcnNpb24oKSB7XG4gICAgaWYgKHByb2Nlc3MuYnJvd3Nlcikge1xuICAgICAgICByZXR1cm4gcmVxdWlyZSgnLi4vLi4vcGFja2FnZS5qc29uJykudmVyc2lvbi5zcGxpdCgnLicpO1xuICAgIH0gZWxzZSBpZiAocGFyc2VJbnQocHJvY2Vzcy52ZXJzaW9uLnNwbGl0KCcuJylbMV0sIDEwKSA+IDQpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoJy4uLy4uL3BhY2thZ2UuanNvbicpLnZlcnNpb24uc3BsaXQoJy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvbGRlciBub2RlXG4gICAgICAgIHZhciBwYWNrYWdlX2pzb24gPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCcuLi8uLi9wYWNrYWdlLmpzb24nKSkpO1xuICAgICAgICByZXR1cm4gcGFja2FnZV9qc29uLnZlcnNpb24uc3BsaXQoJy4nKTtcbiAgICB9XG59XG5cbnZhciBjYXJ0byA9IHtcbiAgICB2ZXJzaW9uOiBnZXRWZXJzaW9uKCksXG4gICAgUGFyc2VyOiByZXF1aXJlKCcuL3BhcnNlcicpLlBhcnNlcixcbiAgICBSZW5kZXJlcjogcmVxdWlyZSgnLi9yZW5kZXJlcicpLlJlbmRlcmVyLFxuICAgIHRyZWU6IHJlcXVpcmUoJy4vdHJlZScpLFxuICAgIFJlbmRlcmVySlM6IHJlcXVpcmUoJy4vcmVuZGVyZXJfanMnKSxcblxuICAgIC8vIEBUT0RPXG4gICAgd3JpdGVFcnJvcjogZnVuY3Rpb24oY3R4LCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gJyc7XG4gICAgICAgIHZhciBleHRyYWN0ID0gY3R4LmV4dHJhY3Q7XG4gICAgICAgIHZhciBlcnJvciA9IFtdO1xuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIGlmIChvcHRpb25zLnNpbGVudCkgeyByZXR1cm47IH1cblxuICAgICAgICBvcHRpb25zLmluZGVudCA9IG9wdGlvbnMuaW5kZW50IHx8ICcnO1xuXG4gICAgICAgIGlmICghKCdpbmRleCcgaW4gY3R4KSB8fCAhZXh0cmFjdCkge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWwuZXJyb3Iob3B0aW9ucy5pbmRlbnQgKyAoY3R4LnN0YWNrIHx8IGN0eC5tZXNzYWdlKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mKGV4dHJhY3RbMF0pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZXJyb3IucHVzaChzdHlsaXplKChjdHgubGluZSAtIDEpICsgJyAnICsgZXh0cmFjdFswXSwgJ2dyZXknKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXh0cmFjdFsxXSA9PT0gJycgJiYgdHlwZW9mIGV4dHJhY3RbMl0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBleHRyYWN0WzFdID0gJ8K2JztcbiAgICAgICAgfVxuICAgICAgICBlcnJvci5wdXNoKGN0eC5saW5lICsgJyAnICsgZXh0cmFjdFsxXS5zbGljZSgwLCBjdHguY29sdW1uKSArXG4gICAgICAgICAgICBzdHlsaXplKHN0eWxpemUoZXh0cmFjdFsxXVtjdHguY29sdW1uXSwgJ2JvbGQnKSArXG4gICAgICAgICAgICBleHRyYWN0WzFdLnNsaWNlKGN0eC5jb2x1bW4gKyAxKSwgJ3llbGxvdycpKTtcblxuICAgICAgICBpZiAodHlwZW9mKGV4dHJhY3RbMl0pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZXJyb3IucHVzaChzdHlsaXplKChjdHgubGluZSArIDEpICsgJyAnICsgZXh0cmFjdFsyXSwgJ2dyZXknKSk7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IgPSBvcHRpb25zLmluZGVudCArIGVycm9yLmpvaW4oJ1xcbicgKyBvcHRpb25zLmluZGVudCkgKyAnXFwwMzNbMG1cXG4nO1xuXG4gICAgICAgIG1lc3NhZ2UgPSBvcHRpb25zLmluZGVudCArIG1lc3NhZ2UgKyBzdHlsaXplKGN0eC5tZXNzYWdlLCAncmVkJyk7XG4gICAgICAgIGlmIChjdHguZmlsZW5hbWUpIChtZXNzYWdlICs9IHN0eWxpemUoJyBpbiAnLCAncmVkJykgKyBjdHguZmlsZW5hbWUpO1xuXG4gICAgICAgIHV0aWwuZXJyb3IobWVzc2FnZSwgZXJyb3IpO1xuXG4gICAgICAgIGlmIChjdHguY2FsbExpbmUpIHtcbiAgICAgICAgICAgIHV0aWwuZXJyb3Ioc3R5bGl6ZSgnZnJvbSAnLCAncmVkJykgKyAoY3R4LmZpbGVuYW1lIHx8ICcnKSk7XG4gICAgICAgICAgICB1dGlsLmVycm9yKHN0eWxpemUoY3R4LmNhbGxMaW5lLCAnZ3JleScpICsgJyAnICsgY3R4LmNhbGxFeHRyYWN0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY3R4LnN0YWNrKSB7IHV0aWwuZXJyb3Ioc3R5bGl6ZShjdHguc3RhY2ssICdyZWQnKSk7IH1cbiAgICB9XG59O1xuXG5yZXF1aXJlKCcuL3RyZWUvY2FsbCcpO1xucmVxdWlyZSgnLi90cmVlL2NvbG9yJyk7XG5yZXF1aXJlKCcuL3RyZWUvY29tbWVudCcpO1xucmVxdWlyZSgnLi90cmVlL2RlZmluaXRpb24nKTtcbnJlcXVpcmUoJy4vdHJlZS9kaW1lbnNpb24nKTtcbnJlcXVpcmUoJy4vdHJlZS9lbGVtZW50Jyk7XG5yZXF1aXJlKCcuL3RyZWUvZXhwcmVzc2lvbicpO1xucmVxdWlyZSgnLi90cmVlL2ZpbHRlcnNldCcpO1xucmVxdWlyZSgnLi90cmVlL2ZpbHRlcicpO1xucmVxdWlyZSgnLi90cmVlL2ZpZWxkJyk7XG5yZXF1aXJlKCcuL3RyZWUva2V5d29yZCcpO1xucmVxdWlyZSgnLi90cmVlL2xheWVyJyk7XG5yZXF1aXJlKCcuL3RyZWUvbGl0ZXJhbCcpO1xucmVxdWlyZSgnLi90cmVlL29wZXJhdGlvbicpO1xucmVxdWlyZSgnLi90cmVlL3F1b3RlZCcpO1xucmVxdWlyZSgnLi90cmVlL2ltYWdlZmlsdGVyJyk7XG5yZXF1aXJlKCcuL3RyZWUvcmVmZXJlbmNlJyk7XG5yZXF1aXJlKCcuL3RyZWUvcnVsZScpO1xucmVxdWlyZSgnLi90cmVlL3J1bGVzZXQnKTtcbnJlcXVpcmUoJy4vdHJlZS9zZWxlY3RvcicpO1xucmVxdWlyZSgnLi90cmVlL3N0eWxlJyk7XG5yZXF1aXJlKCcuL3RyZWUvdXJsJyk7XG5yZXF1aXJlKCcuL3RyZWUvdmFsdWUnKTtcbnJlcXVpcmUoJy4vdHJlZS92YXJpYWJsZScpO1xucmVxdWlyZSgnLi90cmVlL3pvb20nKTtcbnJlcXVpcmUoJy4vdHJlZS9pbnZhbGlkJyk7XG5yZXF1aXJlKCcuL3RyZWUvZm9udHNldCcpO1xucmVxdWlyZSgnLi90cmVlL2ZyYW1lX29mZnNldCcpO1xucmVxdWlyZSgnLi9mdW5jdGlvbnMnKTtcblxuZm9yICh2YXIgayBpbiBjYXJ0bykgeyBleHBvcnRzW2tdID0gY2FydG9ba107IH1cblxuLy8gU3R5bGl6ZSBhIHN0cmluZ1xuZnVuY3Rpb24gc3R5bGl6ZShzdHIsIHN0eWxlKSB7XG4gICAgdmFyIHN0eWxlcyA9IHtcbiAgICAgICAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgICAgICAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgICAgICAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAgICAgICAneWVsbG93JyA6IFszMywgMzldLFxuICAgICAgICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICAgICAgICdyZWQnIDogWzMxLCAzOV0sXG4gICAgICAgICdncmV5JyA6IFs5MCwgMzldXG4gICAgfTtcbiAgICByZXR1cm4gJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzFdICsgJ20nO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSxcIi9saWIvY2FydG9cIikiLCJ2YXIgY2FydG8gPSBleHBvcnRzLFxuICAgIHRyZWUgPSByZXF1aXJlKCcuL3RyZWUnKSxcbiAgICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG4vLyAgICBUb2tlbiBtYXRjaGluZyBpcyBkb25lIHdpdGggdGhlIGAkYCBmdW5jdGlvbiwgd2hpY2ggZWl0aGVyIHRha2VzXG4vLyAgICBhIHRlcm1pbmFsIHN0cmluZyBvciByZWdleHAsIG9yIGEgbm9uLXRlcm1pbmFsIGZ1bmN0aW9uIHRvIGNhbGwuXG4vLyAgICBJdCBhbHNvIHRha2VzIGNhcmUgb2YgbW92aW5nIGFsbCB0aGUgaW5kaWNlcyBmb3J3YXJkcy5cbmNhcnRvLlBhcnNlciA9IGZ1bmN0aW9uIFBhcnNlcihlbnYpIHtcbiAgICB2YXIgaW5wdXQsICAgICAgIC8vIExlU1MgaW5wdXQgc3RyaW5nXG4gICAgICAgIGksICAgICAgICAgICAvLyBjdXJyZW50IGluZGV4IGluIGBpbnB1dGBcbiAgICAgICAgaiwgICAgICAgICAgIC8vIGN1cnJlbnQgY2h1bmtcbiAgICAgICAgdGVtcCwgICAgICAgIC8vIHRlbXBvcmFyaWx5IGhvbGRzIGEgY2h1bmsncyBzdGF0ZSwgZm9yIGJhY2t0cmFja2luZ1xuICAgICAgICBtZW1vLCAgICAgICAgLy8gdGVtcG9yYXJpbHkgaG9sZHMgYGlgLCB3aGVuIGJhY2t0cmFja2luZ1xuICAgICAgICBmdXJ0aGVzdCwgICAgLy8gZnVydGhlc3QgaW5kZXggdGhlIHBhcnNlciBoYXMgZ29uZSB0b1xuICAgICAgICBjaHVua3MsICAgICAgLy8gY2h1bmtpZmllZCBpbnB1dFxuICAgICAgICBjdXJyZW50LCAgICAgLy8gaW5kZXggb2YgY3VycmVudCBjaHVuaywgaW4gYGlucHV0YFxuICAgICAgICBwYXJzZXI7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhZnRlciBhbGwgZmlsZXNcbiAgICAvLyBoYXZlIGJlZW4gaW1wb3J0ZWQgdGhyb3VnaCBgQGltcG9ydGAuXG4gICAgdmFyIGZpbmlzaCA9IGZ1bmN0aW9uKCkge307XG5cbiAgICBmdW5jdGlvbiBzYXZlKCkgICAge1xuICAgICAgICB0ZW1wID0gY2h1bmtzW2pdO1xuICAgICAgICBtZW1vID0gaTtcbiAgICAgICAgY3VycmVudCA9IGk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlc3RvcmUoKSB7XG4gICAgICAgIGNodW5rc1tqXSA9IHRlbXA7XG4gICAgICAgIGkgPSBtZW1vO1xuICAgICAgICBjdXJyZW50ID0gaTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzeW5jKCkge1xuICAgICAgICBpZiAoaSA+IGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGNodW5rc1tqXSA9IGNodW5rc1tqXS5zbGljZShpIC0gY3VycmVudCk7XG4gICAgICAgICAgICBjdXJyZW50ID0gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvL1xuICAgIC8vIFBhcnNlIGZyb20gYSB0b2tlbiwgcmVnZXhwIG9yIHN0cmluZywgYW5kIG1vdmUgZm9yd2FyZCBpZiBtYXRjaFxuICAgIC8vXG4gICAgZnVuY3Rpb24gJCh0b2spIHtcbiAgICAgICAgdmFyIG1hdGNoLCBhcmdzLCBsZW5ndGgsIGMsIGluZGV4LCBlbmRJbmRleCwgaztcblxuICAgICAgICAvLyBOb24tdGVybWluYWxcbiAgICAgICAgaWYgKHRvayBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdG9rLmNhbGwocGFyc2VyLnBhcnNlcnMpO1xuICAgICAgICAvLyBUZXJtaW5hbFxuICAgICAgICAvLyBFaXRoZXIgbWF0Y2ggYSBzaW5nbGUgY2hhcmFjdGVyIGluIHRoZSBpbnB1dCxcbiAgICAgICAgLy8gb3IgbWF0Y2ggYSByZWdleHAgaW4gdGhlIGN1cnJlbnQgY2h1bmsgKGNodW5rW2pdKS5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YodG9rKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG1hdGNoID0gaW5wdXQuY2hhckF0KGkpID09PSB0b2sgPyB0b2sgOiBudWxsO1xuICAgICAgICAgICAgbGVuZ3RoID0gMTtcbiAgICAgICAgICAgIHN5bmMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN5bmMoKTtcblxuICAgICAgICAgICAgbWF0Y2ggPSB0b2suZXhlYyhjaHVua3Nbal0pO1xuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBtYXRjaCBpcyBjb25maXJtZWQsIGFkZCB0aGUgbWF0Y2ggbGVuZ3RoIHRvIGBpYCxcbiAgICAgICAgLy8gYW5kIGNvbnN1bWUgYW55IGV4dHJhIHdoaXRlLXNwYWNlIGNoYXJhY3RlcnMgKCcgJyB8fCAnXFxuJylcbiAgICAgICAgLy8gd2hpY2ggY29tZSBhZnRlciB0aGF0LiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgTGVTUydzXG4gICAgICAgIC8vIGdyYW1tYXIgaXMgbW9zdGx5IHdoaXRlLXNwYWNlIGluc2Vuc2l0aXZlLlxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIHZhciBtZW0gPSBpICs9IGxlbmd0aDtcbiAgICAgICAgICAgIGVuZEluZGV4ID0gaSArIGNodW5rc1tqXS5sZW5ndGggLSBsZW5ndGg7XG5cbiAgICAgICAgICAgIHdoaWxlIChpIDwgZW5kSW5kZXgpIHtcbiAgICAgICAgICAgICAgICBjID0gaW5wdXQuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgICAgICBpZiAoISAoYyA9PT0gMzIgfHwgYyA9PT0gMTAgfHwgYyA9PT0gOSkpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaHVua3Nbal0gPSBjaHVua3Nbal0uc2xpY2UobGVuZ3RoICsgKGkgLSBtZW0pKTtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBpO1xuXG4gICAgICAgICAgICBpZiAoY2h1bmtzW2pdLmxlbmd0aCA9PT0gMCAmJiBqIDwgY2h1bmtzLmxlbmd0aCAtIDEpIHsgaisrOyB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YobWF0Y2gpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoLmxlbmd0aCA9PT0gMSA/IG1hdGNoWzBdIDogbWF0Y2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTYW1lIGFzICQoKSwgYnV0IGRvbid0IGNoYW5nZSB0aGUgc3RhdGUgb2YgdGhlIHBhcnNlcixcbiAgICAvLyBqdXN0IHJldHVybiB0aGUgbWF0Y2guXG4gICAgZnVuY3Rpb24gcGVlayh0b2spIHtcbiAgICAgICAgaWYgKHR5cGVvZih0b2spID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LmNoYXJBdChpKSA9PT0gdG9rO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICEhdG9rLnRlc3QoY2h1bmtzW2pdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4dHJhY3RFcnJvckxpbmUoc3R5bGUsIGVycm9ySW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIChzdHlsZS5zbGljZSgwLCBlcnJvckluZGV4KS5tYXRjaCgvXFxuL2cpIHx8ICcnKS5sZW5ndGggKyAxO1xuICAgIH1cblxuXG4gICAgLy8gTWFrZSBhbiBlcnJvciBvYmplY3QgZnJvbSBhIHBhc3NlZCBzZXQgb2YgcHJvcGVydGllcy5cbiAgICAvLyBBY2NlcHRlZCBwcm9wZXJ0aWVzOlxuICAgIC8vIC0gYG1lc3NhZ2VgOiBUZXh0IG9mIHRoZSBlcnJvciBtZXNzYWdlLlxuICAgIC8vIC0gYGZpbGVuYW1lYDogRmlsZW5hbWUgd2hlcmUgdGhlIGVycm9yIG9jY3VycmVkLlxuICAgIC8vIC0gYGluZGV4YDogQ2hhci4gaW5kZXggd2hlcmUgdGhlIGVycm9yIG9jY3VycmVkLlxuICAgIGZ1bmN0aW9uIG1ha2VFcnJvcihlcnIpIHtcbiAgICAgICAgdmFyIGVpbnB1dDtcblxuICAgICAgICBfKGVycikuZGVmYXVsdHMoe1xuICAgICAgICAgICAgaW5kZXg6IGZ1cnRoZXN0LFxuICAgICAgICAgICAgZmlsZW5hbWU6IGVudi5maWxlbmFtZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdQYXJzZSBlcnJvci4nLFxuICAgICAgICAgICAgbGluZTogMCxcbiAgICAgICAgICAgIGNvbHVtbjogLTFcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGVyci5maWxlbmFtZSAmJiB0aGF0LmVudi5pbnB1dHMgJiYgdGhhdC5lbnYuaW5wdXRzW2Vyci5maWxlbmFtZV0pIHtcbiAgICAgICAgICAgIGVpbnB1dCA9IHRoYXQuZW52LmlucHV0c1tlcnIuZmlsZW5hbWVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWlucHV0ID0gaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBlcnIubGluZSA9IGV4dHJhY3RFcnJvckxpbmUoZWlucHV0LCBlcnIuaW5kZXgpO1xuICAgICAgICBmb3IgKHZhciBuID0gZXJyLmluZGV4OyBuID49IDAgJiYgZWlucHV0LmNoYXJBdChuKSAhPT0gJ1xcbic7IG4tLSkge1xuICAgICAgICAgICAgZXJyLmNvbHVtbisrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihfKCc8JT1maWxlbmFtZSU+OjwlPWxpbmUlPjo8JT1jb2x1bW4lPiA8JT1tZXNzYWdlJT4nKS50ZW1wbGF0ZShlcnIpKTtcbiAgICB9XG5cbiAgICB0aGlzLmVudiA9IGVudiA9IGVudiB8fCB7fTtcbiAgICB0aGlzLmVudi5maWxlbmFtZSA9IHRoaXMuZW52LmZpbGVuYW1lIHx8IG51bGw7XG4gICAgdGhpcy5lbnYuaW5wdXRzID0gdGhpcy5lbnYuaW5wdXRzIHx8IHt9O1xuXG4gICAgLy8gVGhlIFBhcnNlclxuICAgIHBhcnNlciA9IHtcblxuICAgICAgICBleHRyYWN0RXJyb3JMaW5lOiBleHRyYWN0RXJyb3JMaW5lLFxuICAgICAgICAvL1xuICAgICAgICAvLyBQYXJzZSBhbiBpbnB1dCBzdHJpbmcgaW50byBhbiBhYnN0cmFjdCBzeW50YXggdHJlZS5cbiAgICAgICAgLy8gVGhyb3dzIGFuIGVycm9yIG9uIHBhcnNlIGVycm9ycy5cbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgdmFyIHJvb3QsIHN0YXJ0LCBlbmQsIHpvbmUsIGxpbmUsIGxpbmVzLCBidWZmID0gW10sIGMsIGVycm9yID0gbnVsbDtcblxuICAgICAgICAgICAgaSA9IGogPSBjdXJyZW50ID0gZnVydGhlc3QgPSAwO1xuICAgICAgICAgICAgY2h1bmtzID0gW107XG4gICAgICAgICAgICBpbnB1dCA9IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpO1xuICAgICAgICAgICAgaWYgKGVudi5maWxlbmFtZSkge1xuICAgICAgICAgICAgICAgIHRoYXQuZW52LmlucHV0c1tlbnYuZmlsZW5hbWVdID0gaW5wdXQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBlYXJseV9leGl0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIFNwbGl0IHRoZSBpbnB1dCBpbnRvIGNodW5rcy5cbiAgICAgICAgICAgIGNodW5rcyA9IChmdW5jdGlvbiAoY2h1bmtzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGogPSAwLFxuICAgICAgICAgICAgICAgICAgICBza2lwID0gLyg/OkBcXHtbXFx3LV0rXFx9fFteXCInYFxce1xcfVxcL1xcKFxcKVxcXFxdKSsvZyxcbiAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9IC9cXC9cXCooPzpbXipdfFxcKitbXlxcLypdKSpcXCorXFwvfFxcL1xcLy4qL2csXG4gICAgICAgICAgICAgICAgICAgIHN0cmluZyA9IC9cIigoPzpbXlwiXFxcXFxcclxcbl18XFxcXC4pKilcInwnKCg/OlteJ1xcXFxcXHJcXG5dfFxcXFwuKSopJ3xgKCg/OlteYF18XFxcXC4pKilgL2csXG4gICAgICAgICAgICAgICAgICAgIGxldmVsID0gMCxcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgIGNodW5rID0gY2h1bmtzWzBdLFxuICAgICAgICAgICAgICAgICAgICBpblBhcmFtO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGMsIGNjOyBpIDwgaW5wdXQubGVuZ3RoOykge1xuICAgICAgICAgICAgICAgICAgICBza2lwLmxhc3RJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaCA9IHNraXAuZXhlYyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaC5pbmRleCA9PT0gaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rLnB1c2gobWF0Y2hbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGMgPSBpbnB1dC5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQubGFzdEluZGV4ID0gc3RyaW5nLmxhc3RJbmRleCA9IGk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoID0gc3RyaW5nLmV4ZWMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2guaW5kZXggPT09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpICs9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaHVuay5wdXNoKG1hdGNoWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5QYXJhbSAmJiBjID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjID0gaW5wdXQuY2hhckF0KGkgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYyA9PT0gJy8nIHx8IGNjID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2ggPSBjb21tZW50LmV4ZWMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaC5pbmRleCA9PT0gaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSArPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaHVuay5wdXNoKG1hdGNoWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd7JzogaWYgKCEgaW5QYXJhbSkgeyBsZXZlbCArKzsgICAgICAgIGNodW5rLnB1c2goYyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ30nOiBpZiAoISBpblBhcmFtKSB7IGxldmVsIC0tOyAgICAgICAgY2h1bmsucHVzaChjKTsgY2h1bmtzWysral0gPSBjaHVuayA9IFtdOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnKCc6IGlmICghIGluUGFyYW0pIHsgaW5QYXJhbSA9IHRydWU7ICBjaHVuay5wdXNoKGMpOyAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICcpJzogaWYgKCAgaW5QYXJhbSkgeyBpblBhcmFtID0gZmFsc2U7IGNodW5rLnB1c2goYyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsucHVzaChjKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxldmVsICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGkgLSAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1BhcnNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IChsZXZlbCA+IDApID8gXCJtaXNzaW5nIGNsb3NpbmcgYH1gXCIgOiBcIm1pc3Npbmcgb3BlbmluZyBge2BcIlxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjaHVua3MubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmpvaW4oJycpOyB9KTtcbiAgICAgICAgICAgIH0pKFtbXV0pO1xuXG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBtYWtlRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTdGFydCB3aXRoIHRoZSBwcmltYXJ5IHJ1bGUuXG4gICAgICAgICAgICAvLyBUaGUgd2hvbGUgc3ludGF4IHRyZWUgaXMgaGVsZCB1bmRlciBhIFJ1bGVzZXQgbm9kZSxcbiAgICAgICAgICAgIC8vIHdpdGggdGhlIGByb290YCBwcm9wZXJ0eSBzZXQgdG8gdHJ1ZSwgc28gbm8gYHt9YCBhcmVcbiAgICAgICAgICAgIC8vIG91dHB1dC5cbiAgICAgICAgICAgIHJvb3QgPSBuZXcgdHJlZS5SdWxlc2V0KFtdLCAkKHRoaXMucGFyc2Vycy5wcmltYXJ5KSk7XG4gICAgICAgICAgICByb290LnJvb3QgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyBHZXQgYW4gYXJyYXkgb2YgUnVsZXNldCBvYmplY3RzLCBmbGF0dGVuZWRcbiAgICAgICAgICAgIC8vIGFuZCBzb3J0ZWQgYWNjb3JkaW5nIHRvIHNwZWNpZmljaXR5U29ydFxuICAgICAgICAgICAgcm9vdC50b0xpc3QgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmUsIGxpbmVzLCBjb2x1bW47XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGVudikge1xuICAgICAgICAgICAgICAgICAgICBlbnYuZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVudi5lcnJvcnMpIGVudi5lcnJvcnMgPSBuZXcgRXJyb3IoJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVudi5lcnJvcnMubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudi5lcnJvcnMubWVzc2FnZSArPSAnXFxuJyArIG1ha2VFcnJvcihlKS5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnYuZXJyb3JzLm1lc3NhZ2UgPSBtYWtlRXJyb3IoZSkubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZW52LmZyYW1lcyA9IGVudi5mcmFtZXMgfHwgW107XG5cblxuICAgICAgICAgICAgICAgICAgICAvLyBjYWxsIHBvcHVsYXRlcyBJbnZhbGlkLWNhdXNlZCBlcnJvcnNcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmluaXRpb25zID0gdGhpcy5mbGF0dGVuKFtdLCBbXSwgZW52KTtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5pdGlvbnMuc29ydChzcGVjaWZpY2l0eVNvcnQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmaW5pdGlvbnM7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIC8vIFNvcnQgcnVsZXMgYnkgc3BlY2lmaWNpdHk6IHRoaXMgZnVuY3Rpb24gZXhwZWN0cyBzZWxlY3RvcnMgdG8gYmVcbiAgICAgICAgICAgIC8vIHNwbGl0IGFscmVhZHkuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV3JpdHRlbiB0byBiZSB1c2VkIGFzIGEgLnNvcnQoRnVuY3Rpb24pO1xuICAgICAgICAgICAgLy8gYXJndW1lbnQuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gWzEsIDAsIDAsIDQ2N10gPiBbMCwgMCwgMSwgNTIwXVxuICAgICAgICAgICAgdmFyIHNwZWNpZmljaXR5U29ydCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXMgPSBhLnNwZWNpZmljaXR5O1xuICAgICAgICAgICAgICAgIHZhciBicyA9IGIuc3BlY2lmaWNpdHk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXNbMF0gIT0gYnNbMF0pIHJldHVybiBic1swXSAtIGFzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChhc1sxXSAhPSBic1sxXSkgcmV0dXJuIGJzWzFdIC0gYXNbMV07XG4gICAgICAgICAgICAgICAgaWYgKGFzWzJdICE9IGJzWzJdKSByZXR1cm4gYnNbMl0gLSBhc1syXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYnNbM10gLSBhc1szXTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiByb290O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEhlcmUgaW4sIHRoZSBwYXJzaW5nIHJ1bGVzL2Z1bmN0aW9uc1xuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgYmFzaWMgc3RydWN0dXJlIG9mIHRoZSBzeW50YXggdHJlZSBnZW5lcmF0ZWQgaXMgYXMgZm9sbG93czpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICBSdWxlc2V0IC0+ICBSdWxlIC0+IFZhbHVlIC0+IEV4cHJlc3Npb24gLT4gRW50aXR5XG4gICAgICAgIC8vXG4gICAgICAgIC8vICBJbiBnZW5lcmFsLCBtb3N0IHJ1bGVzIHdpbGwgdHJ5IHRvIHBhcnNlIGEgdG9rZW4gd2l0aCB0aGUgYCQoKWAgZnVuY3Rpb24sIGFuZCBpZiB0aGUgcmV0dXJuXG4gICAgICAgIC8vICB2YWx1ZSBpcyB0cnVseSwgd2lsbCByZXR1cm4gYSBuZXcgbm9kZSwgb2YgdGhlIHJlbGV2YW50IHR5cGUuIFNvbWV0aW1lcywgd2UgbmVlZCB0byBjaGVja1xuICAgICAgICAvLyAgZmlyc3QsIGJlZm9yZSBwYXJzaW5nLCB0aGF0J3Mgd2hlbiB3ZSB1c2UgYHBlZWsoKWAuXG4gICAgICAgIHBhcnNlcnM6IHtcbiAgICAgICAgICAgIC8vIFRoZSBgcHJpbWFyeWAgcnVsZSBpcyB0aGUgKmVudHJ5KiBhbmQgKmV4aXQqIHBvaW50IG9mIHRoZSBwYXJzZXIuXG4gICAgICAgICAgICAvLyBUaGUgcnVsZXMgaGVyZSBjYW4gYXBwZWFyIGF0IGFueSBsZXZlbCBvZiB0aGUgcGFyc2UgdHJlZS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUaGUgcmVjdXJzaXZlIG5hdHVyZSBvZiB0aGUgZ3JhbW1hciBpcyBhbiBpbnRlcnBsYXkgYmV0d2VlbiB0aGUgYGJsb2NrYFxuICAgICAgICAgICAgLy8gcnVsZSwgd2hpY2ggcmVwcmVzZW50cyBgeyAuLi4gfWAsIHRoZSBgcnVsZXNldGAgcnVsZSwgYW5kIHRoaXMgYHByaW1hcnlgIHJ1bGUsXG4gICAgICAgICAgICAvLyBhcyByZXByZXNlbnRlZCBieSB0aGlzIHNpbXBsaWZpZWQgZ3JhbW1hcjpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAgICAgcHJpbWFyeSAg4oaSICAocnVsZXNldCB8IHJ1bGUpK1xuICAgICAgICAgICAgLy8gICAgIHJ1bGVzZXQgIOKGkiAgc2VsZWN0b3IrIGJsb2NrXG4gICAgICAgICAgICAvLyAgICAgYmxvY2sgICAg4oaSICAneycgcHJpbWFyeSAnfSdcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBPbmx5IGF0IG9uZSBwb2ludCBpcyB0aGUgcHJpbWFyeSBydWxlIG5vdCBjYWxsZWQgZnJvbSB0aGVcbiAgICAgICAgICAgIC8vIGJsb2NrIHJ1bGU6IGF0IHRoZSByb290IGxldmVsLlxuICAgICAgICAgICAgcHJpbWFyeTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUsIHJvb3QgPSBbXTtcblxuICAgICAgICAgICAgICAgIHdoaWxlICgobm9kZSA9ICQodGhpcy5ydWxlKSB8fCAkKHRoaXMucnVsZXNldCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMuY29tbWVudCkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgvXltcXHNcXG5dKy8pIHx8IChub2RlID0gJCh0aGlzLmludmFsaWQpKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZSkgcm9vdC5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGludmFsaWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2h1bmsgPSAkKC9eW147XFxuXSpbO1xcbl0vKTtcblxuICAgICAgICAgICAgICAgIC8vIFRvIGZhaWwgZ3JhY2VmdWxseSwgbWF0Y2ggZXZlcnl0aGluZyB1bnRpbCBhIHNlbWljb2xvbiBvciBsaW5lYnJlYWsuXG4gICAgICAgICAgICAgICAgaWYgKGNodW5rKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5JbnZhbGlkKGNodW5rLCBtZW1vKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBXZSBjcmVhdGUgYSBDb21tZW50IG5vZGUgZm9yIENTUyBjb21tZW50cyBgLyogKi9gLFxuICAgICAgICAgICAgLy8gYnV0IGtlZXAgdGhlIExlU1MgY29tbWVudHMgYC8vYCBzaWxlbnQsIGJ5IGp1c3Qgc2tpcHBpbmdcbiAgICAgICAgICAgIC8vIG92ZXIgdGhlbS5cbiAgICAgICAgICAgIGNvbW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb21tZW50O1xuXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJBdChpKSAhPT0gJy8nKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckF0KGkgKyAxKSA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5Db21tZW50KCQoL15cXC9cXC8uKi8pLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1lbnQgPSAkKC9eXFwvXFwqKD86W14qXXxcXCorW15cXC8qXSkqXFwqK1xcL1xcbj8vKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29tbWVudChjb21tZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBFbnRpdGllcyBhcmUgdG9rZW5zIHdoaWNoIGNhbiBiZSBmb3VuZCBpbnNpZGUgYW4gRXhwcmVzc2lvblxuICAgICAgICAgICAgZW50aXRpZXM6IHtcblxuICAgICAgICAgICAgICAgIC8vIEEgc3RyaW5nLCB3aGljaCBzdXBwb3J0cyBlc2NhcGluZyBcIiBhbmQgJyBcIm1pbGt5IHdheVwiICdoZVxcJ3MgdGhlIG9uZSEnXG4gICAgICAgICAgICAgICAgcXVvdGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJBdChpKSAhPT0gJ1wiJyAmJiBpbnB1dC5jaGFyQXQoaSkgIT09IFwiJ1wiKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdHIgPSAkKC9eXCIoKD86W15cIlxcXFxcXHJcXG5dfFxcXFwuKSopXCJ8JygoPzpbXidcXFxcXFxyXFxuXXxcXFxcLikqKScvKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlF1b3RlZChzdHJbMV0gfHwgc3RyWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBBIHJlZmVyZW5jZSB0byBhIE1hcG5payBmaWVsZCwgbGlrZSBbTkFNRV1cbiAgICAgICAgICAgICAgICAvLyBCZWhpbmQgdGhlIHNjZW5lcywgdGhpcyBoYXMgdGhlIHNhbWUgcmVwcmVzZW50YXRpb24sIGJ1dCBDYXJ0b1xuICAgICAgICAgICAgICAgIC8vIG5lZWRzIHRvIGJlIGNhcmVmdWwgdG8gd2FybiB3aGVuIHVuc3VwcG9ydGVkIG9wZXJhdGlvbnMgYXJlIHVzZWQuXG4gICAgICAgICAgICAgICAgZmllbGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoISAkKCdbJykpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkX25hbWUgPSAkKC8oXlteXFxdXSspLyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghICQoJ10nKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGRfbmFtZSkgcmV0dXJuIG5ldyB0cmVlLkZpZWxkKGZpZWxkX25hbWVbMV0pO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgY29tcGFyaXNvbiBvcGVyYXRvclxuICAgICAgICAgICAgICAgIGNvbXBhcmlzb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RyID0gJCgvXj1+fD18IT18PD18Pj18PHw+Lyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gQSBjYXRjaC1hbGwgd29yZCwgc3VjaCBhczogaGFyZC1saWdodFxuICAgICAgICAgICAgICAgIC8vIFRoZXNlIGNhbiBzdGFydCB3aXRoIGVpdGhlciBhIGxldHRlciBvciBhIGRhc2ggKC0pLFxuICAgICAgICAgICAgICAgIC8vIGFuZCB0aGVuIGNvbnRhaW4gbnVtYmVycywgdW5kZXJzY29yZXMsIGFuZCBsZXR0ZXJzLlxuICAgICAgICAgICAgICAgIGtleXdvcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgayA9ICQoL15bQS1aYS16LV0rW0EtWmEtei0wLTlfXSovKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGspIHsgcmV0dXJuIG5ldyB0cmVlLktleXdvcmQoayk7IH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gQSBmdW5jdGlvbiBjYWxsIGxpa2UgcmdiKDI1NSwgMCwgMjU1KVxuICAgICAgICAgICAgICAgIC8vIFRoZSBhcmd1bWVudHMgYXJlIHBhcnNlZCB3aXRoIHRoZSBgZW50aXRpZXMuYXJndW1lbnRzYCBwYXJzZXIuXG4gICAgICAgICAgICAgICAgY2FsbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lLCBhcmdzO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghKG5hbWUgPSAvXihbXFx3XFwtXSt8JSlcXCgvLmV4ZWMoY2h1bmtzW2pdKSkpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gbmFtZVsxXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gJ3VybCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVybCgpIGlzIGhhbmRsZWQgYnkgdGhlIHVybCBwYXJzZXIgaW5zdGVhZFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpICs9IG5hbWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgJCgnKCcpOyAvLyBQYXJzZSB0aGUgJygnIGFuZCBjb25zdW1lIHdoaXRlc3BhY2UuXG5cbiAgICAgICAgICAgICAgICAgICAgYXJncyA9ICQodGhpcy5lbnRpdGllc1snYXJndW1lbnRzJ10pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghJCgnKScpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5DYWxsKG5hbWUsIGFyZ3MsIGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBBcmd1bWVudHMgYXJlIGNvbW1hLXNlcGFyYXRlZCBleHByZXNzaW9uc1xuICAgICAgICAgICAgICAgICdhcmd1bWVudHMnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXSwgYXJnO1xuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChhcmcgPSAkKHRoaXMuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChhcmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnLCcpKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJncztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGxpdGVyYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJCh0aGlzLmVudGl0aWVzLmRpbWVuc2lvbikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5rZXl3b3JkY29sb3IpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMuaGV4Y29sb3IpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMucXVvdGVkKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgdXJsKCkgdG9rZW5zXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBXZSB1c2UgYSBzcGVjaWZpYyBydWxlIGZvciB1cmxzLCBiZWNhdXNlIHRoZXkgZG9uJ3QgcmVhbGx5IGJlaGF2ZSBsaWtlXG4gICAgICAgICAgICAgICAgLy8gc3RhbmRhcmQgZnVuY3Rpb24gY2FsbHMuIFRoZSBkaWZmZXJlbmNlIGlzIHRoYXQgdGhlIGFyZ3VtZW50IGRvZXNuJ3QgaGF2ZVxuICAgICAgICAgICAgICAgIC8vIHRvIGJlIGVuY2xvc2VkIHdpdGhpbiBhIHN0cmluZywgc28gaXQgY2FuJ3QgYmUgcGFyc2VkIGFzIGFuIEV4cHJlc3Npb24uXG4gICAgICAgICAgICAgICAgdXJsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQXQoaSkgIT09ICd1JyB8fCAhJCgvXnVybFxcKC8pKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gJCh0aGlzLmVudGl0aWVzLnF1b3RlZCkgfHwgJCh0aGlzLmVudGl0aWVzLnZhcmlhYmxlKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoL15bXFwtXFx3JUAkXFwvLiY9OjsjKz9+XSsvKSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnKScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuSW52YWxpZCh2YWx1ZSwgbWVtbywgJ01pc3NpbmcgY2xvc2luZyApIGluIFVSTC4nKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5VUkwoKHR5cGVvZiB2YWx1ZS52YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIHRyZWUuVmFyaWFibGUpID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA6IG5ldyB0cmVlLlF1b3RlZCh2YWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIC8vIEEgVmFyaWFibGUgZW50aXR5LCBzdWNoIGFzIGBAZmlua2AsIGluXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyAgICAgd2lkdGg6IEBmaW5rICsgMnB4XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBXZSB1c2UgYSBkaWZmZXJlbnQgcGFyc2VyIGZvciB2YXJpYWJsZSBkZWZpbml0aW9ucyxcbiAgICAgICAgICAgICAgICAvLyBzZWUgYHBhcnNlcnMudmFyaWFibGVgLlxuICAgICAgICAgICAgICAgIHZhcmlhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUsIGluZGV4ID0gaTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckF0KGkpID09PSAnQCcgJiYgKG5hbWUgPSAkKC9eQFtcXHctXSsvKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYXJpYWJsZShuYW1lLCBpbmRleCwgZW52LmZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBoZXhjb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZ2I7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQXQoaSkgPT09ICcjJyAmJiAocmdiID0gJCgvXiMoW2EtZkEtRjAtOV17Nn18W2EtZkEtRjAtOV17M30pLykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29sb3IocmdiWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBrZXl3b3JkY29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmdiID0gY2h1bmtzW2pdLm1hdGNoKC9eW2Etel0rLyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZ2IgJiYgcmdiWzBdIGluIHRyZWUuUmVmZXJlbmNlLmRhdGEuY29sb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29sb3IodHJlZS5SZWZlcmVuY2UuZGF0YS5jb2xvcnNbJCgvXlthLXpdKy8pXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gQSBEaW1lbnNpb24sIHRoYXQgaXMsIGEgbnVtYmVyIGFuZCBhIHVuaXQuIFRoZSBvbmx5XG4gICAgICAgICAgICAgICAgLy8gdW5pdCB0aGF0IGhhcyBhbiBlZmZlY3QgaXMgJVxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gaW5wdXQuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChjID4gNTcgfHwgYyA8IDQ1KSB8fCBjID09PSA0NykgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAkKC9eKC0/XFxkKlxcLj9cXGQrKD86W2VFXVstK10/XFxkKyk/KShcXCV8XFx3Kyk/Lyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkRpbWVuc2lvbih2YWx1ZVsxXSwgdmFsdWVbMl0sIG1lbW8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gVGhlIHZhcmlhYmxlIHBhcnQgb2YgYSB2YXJpYWJsZSBkZWZpbml0aW9uLlxuICAgICAgICAgICAgLy8gVXNlZCBpbiB0aGUgYHJ1bGVgIHBhcnNlci4gTGlrZSBAZmluazpcbiAgICAgICAgICAgIHZhcmlhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZTtcblxuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQXQoaSkgPT09ICdAJyAmJiAobmFtZSA9ICQoL14oQFtcXHctXSspXFxzKjovKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5hbWVbMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gRW50aXRpZXMgYXJlIHRoZSBzbWFsbGVzdCByZWNvZ25pemVkIHRva2VuLFxuICAgICAgICAgICAgLy8gYW5kIGNhbiBiZSBmb3VuZCBpbnNpZGUgYSBydWxlJ3MgdmFsdWUuXG4gICAgICAgICAgICBlbnRpdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkKHRoaXMuZW50aXRpZXMuY2FsbCkgfHxcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmxpdGVyYWwpIHx8XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5maWVsZCkgfHxcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLnZhcmlhYmxlKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMudXJsKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMua2V5d29yZCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBBIFJ1bGUgdGVybWluYXRvci4gTm90ZSB0aGF0IHdlIHVzZSBgcGVlaygpYCB0byBjaGVjayBmb3IgJ30nLFxuICAgICAgICAgICAgLy8gYmVjYXVzZSB0aGUgYGJsb2NrYCBydWxlIHdpbGwgYmUgZXhwZWN0aW5nIGl0LCBidXQgd2Ugc3RpbGwgbmVlZCB0byBtYWtlIHN1cmVcbiAgICAgICAgICAgIC8vIGl0J3MgdGhlcmUsIGlmICc7JyB3YXMgb21taXR0ZWQuXG4gICAgICAgICAgICBlbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkKCc7JykgfHwgcGVlaygnfScpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gRWxlbWVudHMgYXJlIHRoZSBidWlsZGluZyBibG9ja3MgZm9yIFNlbGVjdG9ycy4gVGhleSBjb25zaXN0IG9mXG4gICAgICAgICAgICAvLyBhbiBlbGVtZW50IG5hbWUsIHN1Y2ggYXMgYSB0YWcgYSBjbGFzcywgb3IgYCpgLlxuICAgICAgICAgICAgZWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSAkKC9eKD86Wy4jXVtcXHdcXC1dK3xcXCp8TWFwKS8pO1xuICAgICAgICAgICAgICAgIGlmIChlKSByZXR1cm4gbmV3IHRyZWUuRWxlbWVudChlKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEF0dGFjaG1lbnRzIGFsbG93IGFkZGluZyBtdWx0aXBsZSBsaW5lcywgcG9seWdvbnMgZXRjLiB0byBhblxuICAgICAgICAgICAgLy8gb2JqZWN0LiBUaGVyZSBjYW4gb25seSBiZSBvbmUgYXR0YWNobWVudCBwZXIgc2VsZWN0b3IuXG4gICAgICAgICAgICBhdHRhY2htZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9ICQoL146OihbXFx3XFwtXSsoPzpcXC9bXFx3XFwtXSspKikvKTtcbiAgICAgICAgICAgICAgICBpZiAocykgcmV0dXJuIHNbMV07XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBTZWxlY3RvcnMgYXJlIG1hZGUgb3V0IG9mIG9uZSBvciBtb3JlIEVsZW1lbnRzLCBzZWUgYWJvdmUuXG4gICAgICAgICAgICBzZWxlY3RvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEsIGF0dGFjaG1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGUsIGVsZW1lbnRzID0gW10sXG4gICAgICAgICAgICAgICAgICAgIGYsIGZpbHRlcnMgPSBuZXcgdHJlZS5GaWx0ZXJzZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgeiwgem9vbXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVfb2Zmc2V0ID0gdHJlZS5GcmFtZU9mZnNldC5ub25lO1xuICAgICAgICAgICAgICAgICAgICBzZWdtZW50cyA9IDAsIGNvbmRpdGlvbnMgPSAwO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKFxuICAgICAgICAgICAgICAgICAgICAgICAgKGUgPSAkKHRoaXMuZWxlbWVudCkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoeiA9ICQodGhpcy56b29tKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChmbyA9ICQodGhpcy5mcmFtZV9vZmZzZXQpKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGYgPSAkKHRoaXMuZmlsdGVyKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChhID0gJCh0aGlzLmF0dGFjaG1lbnQpKVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VnbWVudHMrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeikge1xuICAgICAgICAgICAgICAgICAgICAgICAgem9vbXMucHVzaCh6KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbnMrKztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWVfb2Zmc2V0ID0gZm87XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb25zKys7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IGZpbHRlcnMuYWRkKGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG1ha2VFcnJvcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGkgLSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb25zKys7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0YWNobWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbWFrZUVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRW5jb3VudGVyZWQgc2Vjb25kIGF0dGFjaG1lbnQgbmFtZS4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBpIC0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRhY2htZW50ID0gYTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gaW5wdXQuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJ3snIHx8IGMgPT09ICd9JyB8fCBjID09PSAnOycgfHwgYyA9PT0gJywnKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNlZ21lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5TZWxlY3RvcihmaWx0ZXJzLCB6b29tcywgZnJhbWVfb2Zmc2V0LCBlbGVtZW50cywgYXR0YWNobWVudCwgY29uZGl0aW9ucywgbWVtbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZmlsdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzYXZlKCk7XG4gICAgICAgICAgICAgICAgdmFyIGtleSwgb3AsIHZhbDtcbiAgICAgICAgICAgICAgICBpZiAoISAkKCdbJykpIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID0gJCgvXlthLXpBLVowLTlcXC1fXSsvKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMucXVvdGVkKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMudmFyaWFibGUpIHx8XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5rZXl3b3JkKSB8fFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMuZW50aXRpZXMuZmllbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHJlbW92ZSBhdCAxLjAuMFxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5IGluc3RhbmNlb2YgdHJlZS5RdW90ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IG5ldyB0cmVlLkZpZWxkKGtleS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoKG9wID0gJCh0aGlzLmVudGl0aWVzLmNvbXBhcmlzb24pKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKHZhbCA9ICQodGhpcy5lbnRpdGllcy5xdW90ZWQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy52YXJpYWJsZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmRpbWVuc2lvbikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVudGl0aWVzLmtleXdvcmQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcy5lbnRpdGllcy5maWVsZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISAkKCddJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBtYWtlRXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnTWlzc2luZyBjbG9zaW5nIF0gb2YgZmlsdGVyLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBtZW1vIC0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFrZXkuaXMpIGtleSA9IG5ldyB0cmVlLkZpZWxkKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuRmlsdGVyKGtleSwgb3AsIHZhbCwgbWVtbywgZW52LmZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZyYW1lX29mZnNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2F2ZSgpO1xuICAgICAgICAgICAgICAgIHZhciBvcCwgdmFsO1xuICAgICAgICAgICAgICAgIGlmICgkKC9eXFxbXFxzKmZyYW1lLW9mZnNldC9nKSAmJlxuICAgICAgICAgICAgICAgICAgICAob3AgPSAkKHRoaXMuZW50aXRpZXMuY29tcGFyaXNvbikpICYmXG4gICAgICAgICAgICAgICAgICAgICh2YWwgPSAkKC9eXFxkKy8pKSAmJlxuICAgICAgICAgICAgICAgICAgICAkKCddJykpICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJlZS5GcmFtZU9mZnNldChvcCwgdmFsLCBtZW1vKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB6b29tOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzYXZlKCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wLCB2YWw7XG4gICAgICAgICAgICAgICAgaWYgKCQoL15cXFtcXHMqem9vbS9nKSAmJlxuICAgICAgICAgICAgICAgICAgICAob3AgPSAkKHRoaXMuZW50aXRpZXMuY29tcGFyaXNvbikpICYmXG4gICAgICAgICAgICAgICAgICAgICh2YWwgPSAkKHRoaXMuZW50aXRpZXMudmFyaWFibGUpIHx8ICQodGhpcy5lbnRpdGllcy5kaW1lbnNpb24pKSAmJiAkKCddJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5ab29tKG9wLCB2YWwsIG1lbW8pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGJhY2t0cmFja1xuICAgICAgICAgICAgICAgICAgICByZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gVGhlIGBibG9ja2AgcnVsZSBpcyB1c2VkIGJ5IGBydWxlc2V0YFxuICAgICAgICAgICAgLy8gSXQncyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBgcHJpbWFyeWAgcnVsZSwgd2l0aCBhZGRlZCBge31gLlxuICAgICAgICAgICAgYmxvY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50O1xuXG4gICAgICAgICAgICAgICAgaWYgKCQoJ3snKSAmJiAoY29udGVudCA9ICQodGhpcy5wcmltYXJ5KSkgJiYgJCgnfScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIGRpdiwgLmNsYXNzLCBib2R5ID4gcCB7Li4ufVxuICAgICAgICAgICAgcnVsZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdG9ycyA9IFtdLCBzLCBmLCBsLCBydWxlcywgZmlsdGVycyA9IFtdO1xuICAgICAgICAgICAgICAgIHNhdmUoKTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChzID0gJCh0aGlzLnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnMucHVzaChzKTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCQodGhpcy5jb21tZW50KSkge31cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgJCgnLCcpKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgkKHRoaXMuY29tbWVudCkpIHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgkKHRoaXMuY29tbWVudCkpIHt9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9ycy5sZW5ndGggPiAwICYmIChydWxlcyA9ICQodGhpcy5ibG9jaykpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvcnMubGVuZ3RoID09PSAxICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnNbMF0uZWxlbWVudHMubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnNbMF0uZWxlbWVudHNbMF0udmFsdWUgPT09ICdNYXAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcnMgPSBuZXcgdHJlZS5SdWxlc2V0KHNlbGVjdG9ycywgcnVsZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcnMuaXNNYXAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5SdWxlc2V0KHNlbGVjdG9ycywgcnVsZXMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEJhY2t0cmFja1xuICAgICAgICAgICAgICAgICAgICByZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcnVsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUsIHZhbHVlLCBjID0gaW5wdXQuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgIHNhdmUoKTtcblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnLicgfHwgYyA9PT0gJyMnKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPSAkKHRoaXMudmFyaWFibGUpIHx8ICQodGhpcy5wcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAkKHRoaXMudmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiAkKHRoaXMuZW5kKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlJ1bGUobmFtZSwgdmFsdWUsIG1lbW8sIGVudi5maWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmdXJ0aGVzdCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBmb250OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBbXSwgZXhwcmVzc2lvbiA9IFtdLCB3ZWlnaHQsIGZvbnQsIGU7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoZSA9ICQodGhpcy5lbnRpdHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb24ucHVzaChlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YWx1ZS5wdXNoKG5ldyB0cmVlLkV4cHJlc3Npb24oZXhwcmVzc2lvbikpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCQoJywnKSkge1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZSA9ICQodGhpcy5leHByZXNzaW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUucHVzaChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghICQoJywnKSkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYWx1ZSh2YWx1ZSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBBIFZhbHVlIGlzIGEgY29tbWEtZGVsaW1pdGVkIGxpc3Qgb2YgRXhwcmVzc2lvbnNcbiAgICAgICAgICAgIC8vIEluIGEgUnVsZSwgYSBWYWx1ZSByZXByZXNlbnRzIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGA6YCxcbiAgICAgICAgICAgIC8vIGFuZCBiZWZvcmUgdGhlIGA7YC5cbiAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSwgZXhwcmVzc2lvbnMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChlID0gJCh0aGlzLmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghICQoJywnKSkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChleHByZXNzaW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdHJlZS5WYWx1ZShleHByZXNzaW9ucy5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGUudmFsdWVbMF07XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4cHJlc3Npb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuVmFsdWUoZXhwcmVzc2lvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBBIHN1Yi1leHByZXNzaW9uLCBjb250YWluZWQgYnkgcGFyZW50aGVuc2lzXG4gICAgICAgICAgICBzdWI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBlO1xuXG4gICAgICAgICAgICAgICAgaWYgKCQoJygnKSAmJiAoZSA9ICQodGhpcy5leHByZXNzaW9uKSkgJiYgJCgnKScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgbWlzbm9tZXIgYmVjYXVzZSBpdCBhY3R1YWxseSBoYW5kbGVzIG11bHRpcGxpY2F0aW9uXG4gICAgICAgICAgICAvLyBhbmQgZGl2aXNpb24uXG4gICAgICAgICAgICBtdWx0aXBsaWNhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIG0sIGEsIG9wLCBvcGVyYXRpb247XG4gICAgICAgICAgICAgICAgaWYgKG0gPSAkKHRoaXMub3BlcmFuZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChvcCA9ICgkKCcvJykgfHwgJCgnKicpIHx8ICQoJyUnKSkpICYmIChhID0gJCh0aGlzLm9wZXJhbmQpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uID0gbmV3IHRyZWUuT3BlcmF0aW9uKG9wLCBbb3BlcmF0aW9uIHx8IG0sIGFdLCBtZW1vKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3BlcmF0aW9uIHx8IG07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZGl0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbSwgYSwgb3AsIG9wZXJhdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAobSA9ICQodGhpcy5tdWx0aXBsaWNhdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChvcCA9ICQoL15bLStdXFxzKy8pIHx8IChpbnB1dC5jaGFyQXQoaSAtIDEpICE9ICcgJyAmJiAoJCgnKycpIHx8ICQoJy0nKSkpKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKGEgPSAkKHRoaXMubXVsdGlwbGljYXRpb24pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uID0gbmV3IHRyZWUuT3BlcmF0aW9uKG9wLCBbb3BlcmF0aW9uIHx8IG0sIGFdLCBtZW1vKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3BlcmF0aW9uIHx8IG07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gQW4gb3BlcmFuZCBpcyBhbnl0aGluZyB0aGF0IGNhbiBiZSBwYXJ0IG9mIGFuIG9wZXJhdGlvbixcbiAgICAgICAgICAgIC8vIHN1Y2ggYXMgYSBDb2xvciwgb3IgYSBWYXJpYWJsZVxuICAgICAgICAgICAgb3BlcmFuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcy5zdWIpIHx8ICQodGhpcy5lbnRpdHkpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gRXhwcmVzc2lvbnMgZWl0aGVyIHJlcHJlc2VudCBtYXRoZW1hdGljYWwgb3BlcmF0aW9ucyxcbiAgICAgICAgICAgIC8vIG9yIHdoaXRlLXNwYWNlIGRlbGltaXRlZCBFbnRpdGllcy4gIEB2YXIgKiAyXG4gICAgICAgICAgICBleHByZXNzaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSwgZGVsaW0sIGVudGl0aWVzID0gW10sIGQ7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoZSA9ICQodGhpcy5hZGRpdGlvbikgfHwgJCh0aGlzLmVudGl0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZW50aXRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuRXhwcmVzc2lvbihlbnRpdGllcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb3BlcnR5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9ICQoL14oKFthLXpdWy1hLXpfMC05XSpcXC8pP1xcKj8tP1stYS16XzAtOV0rKVxccyo6Lyk7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUpIHJldHVybiBuYW1lWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gcGFyc2VyO1xufTtcbiIsInZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIGNhcnRvID0gcmVxdWlyZSgnLi9pbmRleCcpO1xuXG5jYXJ0by5SZW5kZXJlciA9IGZ1bmN0aW9uIFJlbmRlcmVyKGVudiwgb3B0aW9ucykge1xuICAgIHRoaXMuZW52ID0gZW52IHx8IHt9O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uID0gdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uIHx8ICczLjAuMCc7XG59O1xuXG4vKipcbiAqIFByZXBhcmUgYSBNU1MgZG9jdW1lbnQgKGdpdmVuIGFzIGFuIHN0cmluZykgaW50byBhXG4gKiBYTUwgU3R5bGUgZnJhZ21lbnQgKG1vc3RseSB1c2VmdWwgZm9yIGRlYnVnZ2luZylcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGF0YSB0aGUgbXNzIGNvbnRlbnRzIGFzIGEgc3RyaW5nLlxuICovXG5jYXJ0by5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyTVNTID0gZnVuY3Rpb24gcmVuZGVyKGRhdGEpIHtcbiAgICAvLyBlZmZlY3RzIGlzIGEgY29udGFpbmVyIGZvciBzaWRlLWVmZmVjdHMsIHdoaWNoIGN1cnJlbnRseVxuICAgIC8vIGFyZSBsaW1pdGVkIHRvIEZvbnRTZXRzLlxuICAgIHZhciBlbnYgPSBfKHRoaXMuZW52KS5kZWZhdWx0cyh7XG4gICAgICAgIGJlbmNobWFyazogZmFsc2UsXG4gICAgICAgIHZhbGlkYXRpb25fZGF0YTogZmFsc2UsXG4gICAgICAgIGVmZmVjdHM6IFtdXG4gICAgfSk7XG5cbiAgICBpZiAoIWNhcnRvLnRyZWUuUmVmZXJlbmNlLnNldFZlcnNpb24odGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3Qgc2V0IG1hcG5payB2ZXJzaW9uIHRvIFwiICsgdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uKTtcbiAgICB9XG5cbiAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgdmFyIHN0eWxlcyA9IFtdO1xuXG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZSgnUGFyc2luZyBNU1MnKTtcbiAgICB2YXIgcGFyc2VyID0gKGNhcnRvLlBhcnNlcihlbnYpKS5wYXJzZShkYXRhKTtcbiAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lRW5kKCdQYXJzaW5nIE1TUycpO1xuXG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZSgnUnVsZSBnZW5lcmF0aW9uJyk7XG4gICAgdmFyIHJ1bGVfbGlzdCA9IHBhcnNlci50b0xpc3QoZW52KTtcbiAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lRW5kKCdSdWxlIGdlbmVyYXRpb24nKTtcblxuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWUoJ1J1bGUgaW5oZXJpdGFuY2UnKTtcbiAgICB2YXIgcnVsZXMgPSBpbmhlcml0RGVmaW5pdGlvbnMocnVsZV9saXN0LCBlbnYpO1xuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWVFbmQoJ1J1bGUgaW5oZXJpdGFuY2UnKTtcblxuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWUoJ1N0eWxlIHNvcnQnKTtcbiAgICB2YXIgc29ydGVkID0gc29ydFN0eWxlcyhydWxlcyxlbnYpO1xuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWVFbmQoJ1N0eWxlIHNvcnQnKTtcblxuICAgIGlmIChlbnYuYmVuY2htYXJrKSBjb25zb2xlLnRpbWUoJ1RvdGFsIFN0eWxlIGdlbmVyYXRpb24nKTtcbiAgICBmb3IgKHZhciBrID0gMCwgcnVsZSwgc3R5bGVfbmFtZTsgayA8IHNvcnRlZC5sZW5ndGg7IGsrKykge1xuICAgICAgICBydWxlID0gc29ydGVkW2tdO1xuICAgICAgICBzdHlsZV9uYW1lID0gJ3N0eWxlJyArIChydWxlLmF0dGFjaG1lbnQgIT09ICdfX2RlZmF1bHRfXycgPyAnLScgKyBydWxlLmF0dGFjaG1lbnQgOiAnJyk7XG4gICAgICAgIHN0eWxlcy5wdXNoKHN0eWxlX25hbWUpO1xuICAgICAgICB2YXIgYmVuY2hfbmFtZSA9ICdcXHRTdHlsZSBcIicrc3R5bGVfbmFtZSsnXCIgKCMnK2srJykgdG9YTUwnO1xuICAgICAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS50aW1lKGJlbmNoX25hbWUpO1xuICAgICAgICAvLyBlbnYuZWZmZWN0cyBjYW4gYmUgbW9kaWZpZWQgYnkgdGhpcyBjYWxsXG4gICAgICAgIG91dHB1dC5wdXNoKGNhcnRvLnRyZWUuU3R5bGVYTUwoc3R5bGVfbmFtZSwgcnVsZS5hdHRhY2htZW50LCBydWxlLCBlbnYpKTtcbiAgICAgICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZUVuZChiZW5jaF9uYW1lKTtcbiAgICB9XG4gICAgaWYgKGVudi5iZW5jaG1hcmspIGNvbnNvbGUudGltZUVuZCgnVG90YWwgU3R5bGUgZ2VuZXJhdGlvbicpO1xuICAgIGlmIChlbnYuZXJyb3JzKSB0aHJvdyBlbnYuZXJyb3JzO1xuICAgIHJldHVybiBvdXRwdXQuam9pbignXFxuJyk7XG59O1xuXG4vKipcbiAqIFByZXBhcmUgYSBNTUwgZG9jdW1lbnQgKGdpdmVuIGFzIGFuIG9iamVjdCkgaW50byBhXG4gKiBmdWxseS1sb2NhbGl6ZWQgWE1MIGZpbGUgcmVhZHkgZm9yIE1hcG5pazIgY29uc3VtcHRpb25cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbSAtIHRoZSBKU09OIGZpbGUgYXMgYSBzdHJpbmcuXG4gKi9cbmNhcnRvLlJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIobSkge1xuICAgIC8vIGVmZmVjdHMgaXMgYSBjb250YWluZXIgZm9yIHNpZGUtZWZmZWN0cywgd2hpY2ggY3VycmVudGx5XG4gICAgLy8gYXJlIGxpbWl0ZWQgdG8gRm9udFNldHMuXG4gICAgdmFyIGVudiA9IF8odGhpcy5lbnYpLmRlZmF1bHRzKHtcbiAgICAgICAgYmVuY2htYXJrOiBmYWxzZSxcbiAgICAgICAgdmFsaWRhdGlvbl9kYXRhOiBmYWxzZSxcbiAgICAgICAgZWZmZWN0czogW10sXG4gICAgICAgIHBwaTogOTAuNzE0XG4gICAgfSk7XG5cbiAgICBpZiAoIWNhcnRvLnRyZWUuUmVmZXJlbmNlLnNldFZlcnNpb24odGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3Qgc2V0IG1hcG5payB2ZXJzaW9uIHRvIFwiICsgdGhpcy5vcHRpb25zLm1hcG5pa192ZXJzaW9uKTtcbiAgICB9XG5cbiAgICB2YXIgb3V0cHV0ID0gW107XG5cbiAgICAvLyBUcmFuc2Zvcm0gc3R5bGVzaGVldHMgaW50byBkZWZpbml0aW9ucy5cbiAgICB2YXIgZGVmaW5pdGlvbnMgPSBfKG0uU3R5bGVzaGVldCkuY2hhaW4oKVxuICAgICAgICAubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcyA9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlN0eWxlc2hlZXQgb2JqZWN0IGlzIGV4cGVjdGVkIG5vdCBhIHN0cmluZzogJ1wiICsgcyArIFwiJ1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFBhc3NpbmcgdGhlIGVudmlyb25tZW50IGZyb20gc3R5bGVzaGVldCB0byBzdHlsZXNoZWV0LFxuICAgICAgICAgICAgLy8gYWxsb3dzIGZyYW1lcyBhbmQgZWZmZWN0cyB0byBiZSBtYWludGFpbmVkLlxuICAgICAgICAgICAgZW52ID0gXyhlbnYpLmV4dGVuZCh7ZmlsZW5hbWU6cy5pZH0pO1xuXG4gICAgICAgICAgICB2YXIgdGltZSA9ICtuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgIHJvb3QgPSAoY2FydG8uUGFyc2VyKGVudikpLnBhcnNlKHMuZGF0YSk7XG4gICAgICAgICAgICBpZiAoZW52LmJlbmNobWFyaylcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1BhcnNpbmcgdGltZTogJyArIChuZXcgRGF0ZSgpIC0gdGltZSkgKyAnbXMnKTtcbiAgICAgICAgICAgIHJldHVybiByb290LnRvTGlzdChlbnYpO1xuICAgICAgICB9KVxuICAgICAgICAuZmxhdHRlbigpXG4gICAgICAgIC52YWx1ZSgpO1xuXG4gICAgZnVuY3Rpb24gYXBwbGllc1RvKG5hbWUsIGNsYXNzSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRlZmluaXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZpbml0aW9uLmFwcGxpZXNUbyhsLm5hbWUsIGNsYXNzSW5kZXgpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBsYXllcnMgYW5kIGNyZWF0ZSBzdHlsZXMgY3VzdG9tLWJ1aWx0XG4gICAgLy8gZm9yIGVhY2ggb2YgdGhlbSwgYW5kIGFwcGx5IHRob3NlIHN0eWxlcyB0byB0aGUgbGF5ZXJzLlxuICAgIHZhciBzdHlsZXMsIGwsIGNsYXNzSW5kZXgsIHJ1bGVzLCBzb3J0ZWQsIG1hdGNoaW5nO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbS5MYXllci5sZW5ndGg7IGkrKykge1xuICAgICAgICBsID0gbS5MYXllcltpXTtcbiAgICAgICAgc3R5bGVzID0gW107XG4gICAgICAgIGNsYXNzSW5kZXggPSB7fTtcblxuICAgICAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS53YXJuKCdwcm9jZXNzaW5nIGxheWVyOiAnICsgbC5pZCk7XG4gICAgICAgIC8vIENsYXNzZXMgYXJlIGdpdmVuIGFzIHNwYWNlLXNlcGFyYXRlZCBhbHBoYW51bWVyaWMgc3RyaW5ncy5cbiAgICAgICAgdmFyIGNsYXNzZXMgPSAobFsnY2xhc3MnXSB8fCAnJykuc3BsaXQoL1xccysvZyk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2xhc3Nlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY2xhc3NJbmRleFtjbGFzc2VzW2pdXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbWF0Y2hpbmcgPSBkZWZpbml0aW9ucy5maWx0ZXIoYXBwbGllc1RvKGwubmFtZSwgY2xhc3NJbmRleCkpO1xuICAgICAgICBydWxlcyA9IGluaGVyaXREZWZpbml0aW9ucyhtYXRjaGluZywgZW52KTtcbiAgICAgICAgc29ydGVkID0gc29ydFN0eWxlcyhydWxlcywgZW52KTtcblxuICAgICAgICBmb3IgKHZhciBrID0gMCwgcnVsZSwgc3R5bGVfbmFtZTsgayA8IHNvcnRlZC5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgcnVsZSA9IHNvcnRlZFtrXTtcbiAgICAgICAgICAgIHN0eWxlX25hbWUgPSBsLm5hbWUgKyAocnVsZS5hdHRhY2htZW50ICE9PSAnX19kZWZhdWx0X18nID8gJy0nICsgcnVsZS5hdHRhY2htZW50IDogJycpO1xuXG4gICAgICAgICAgICAvLyBlbnYuZWZmZWN0cyBjYW4gYmUgbW9kaWZpZWQgYnkgdGhpcyBjYWxsXG4gICAgICAgICAgICB2YXIgc3R5bGVYTUwgPSBjYXJ0by50cmVlLlN0eWxlWE1MKHN0eWxlX25hbWUsIHJ1bGUuYXR0YWNobWVudCwgcnVsZSwgZW52KTtcblxuICAgICAgICAgICAgaWYgKHN0eWxlWE1MKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goc3R5bGVYTUwpO1xuICAgICAgICAgICAgICAgIHN0eWxlcy5wdXNoKHN0eWxlX25hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgb3V0cHV0LnB1c2goY2FydG8udHJlZS5MYXllclhNTChsLCBzdHlsZXMpKTtcbiAgICB9XG5cbiAgICBvdXRwdXQudW5zaGlmdChlbnYuZWZmZWN0cy5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICByZXR1cm4gZS50b1hNTChlbnYpO1xuICAgIH0pLmpvaW4oJ1xcbicpKTtcblxuICAgIHZhciBtYXBfcHJvcGVydGllcyA9IGdldE1hcFByb3BlcnRpZXMobSwgZGVmaW5pdGlvbnMsIGVudik7XG5cbiAgICAvLyBFeGl0IG9uIGVycm9ycy5cbiAgICBpZiAoZW52LmVycm9ycykgdGhyb3cgZW52LmVycm9ycztcblxuICAgIC8vIFBhc3MgVGlsZUpTT04gYW5kIG90aGVyIGN1c3RvbSBwYXJhbWV0ZXJzIHRocm91Z2ggdG8gTWFwbmlrIFhNTC5cbiAgICB2YXIgcGFyYW1ldGVycyA9IF8obSkucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIHYsIGspIHtcbiAgICAgICAgaWYgKCF2ICYmIHYgIT09IDApIHJldHVybiBtZW1vO1xuXG4gICAgICAgIHN3aXRjaCAoaykge1xuICAgICAgICAvLyBLbm93biBza2lwcGFibGUgcHJvcGVydGllcy5cbiAgICAgICAgY2FzZSAnc3JzJzpcbiAgICAgICAgY2FzZSAnTGF5ZXInOlxuICAgICAgICBjYXNlICdTdHlsZXNoZWV0JzpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBOb24gVVJMLWJvdW5kIFRpbGVKU09OIHByb3BlcnRpZXMuXG4gICAgICAgIGNhc2UgJ2JvdW5kcyc6XG4gICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgIGNhc2UgJ21pbnpvb20nOlxuICAgICAgICBjYXNlICdtYXh6b29tJzpcbiAgICAgICAgY2FzZSAndmVyc2lvbic6XG4gICAgICAgICAgICBtZW1vLnB1c2goJyAgPFBhcmFtZXRlciBuYW1lPVwiJyArIGsgKyAnXCI+JyArIHYgKyAnPC9QYXJhbWV0ZXI+Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gUHJvcGVydGllcyB0aGF0IHJlcXVpcmUgQ0RBVEEuXG4gICAgICAgIGNhc2UgJ25hbWUnOlxuICAgICAgICBjYXNlICdkZXNjcmlwdGlvbic6XG4gICAgICAgIGNhc2UgJ2xlZ2VuZCc6XG4gICAgICAgIGNhc2UgJ2F0dHJpYnV0aW9uJzpcbiAgICAgICAgY2FzZSAndGVtcGxhdGUnOlxuICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cIicgKyBrICsgJ1wiPjwhW0NEQVRBWycgKyB2ICsgJ11dPjwvUGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIE1hcG5payBpbWFnZSBmb3JtYXQuXG4gICAgICAgIGNhc2UgJ2Zvcm1hdCc6XG4gICAgICAgICAgICBtZW1vLnB1c2goJyAgPFBhcmFtZXRlciBuYW1lPVwiJyArIGsgKyAnXCI+JyArIHYgKyAnPC9QYXJhbWV0ZXI+Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gTWFwbmlrIGludGVyYWN0aXZpdHkgc2V0dGluZ3MuXG4gICAgICAgIGNhc2UgJ2ludGVyYWN0aXZpdHknOlxuICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cImludGVyYWN0aXZpdHlfbGF5ZXJcIj4nICsgdi5sYXllciArICc8L1BhcmFtZXRlcj4nKTtcbiAgICAgICAgICAgIG1lbW8ucHVzaCgnICA8UGFyYW1ldGVyIG5hbWU9XCJpbnRlcmFjdGl2aXR5X2ZpZWxkc1wiPicgKyB2LmZpZWxkcyArICc8L1BhcmFtZXRlcj4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBTdXBwb3J0IGFueSBhZGRpdGlvbmFsIHNjYWxhciBwcm9wZXJ0aWVzLlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2Ygdikge1xuICAgICAgICAgICAgICAgIG1lbW8ucHVzaCgnICA8UGFyYW1ldGVyIG5hbWU9XCInICsgayArICdcIj48IVtDREFUQVsnICsgdiArICddXT48L1BhcmFtZXRlcj4nKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoJ251bWJlcicgPT09IHR5cGVvZiB2KSB7XG4gICAgICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cIicgKyBrICsgJ1wiPicgKyB2ICsgJzwvUGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgnYm9vbGVhbicgPT09IHR5cGVvZiB2KSB7XG4gICAgICAgICAgICAgICAgbWVtby5wdXNoKCcgIDxQYXJhbWV0ZXIgbmFtZT1cIicgKyBrICsgJ1wiPicgKyB2ICsgJzwvUGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgfSwgW10pO1xuICAgIGlmIChwYXJhbWV0ZXJzLmxlbmd0aCkgb3V0cHV0LnVuc2hpZnQoXG4gICAgICAgICc8UGFyYW1ldGVycz5cXG4nICtcbiAgICAgICAgcGFyYW1ldGVycy5qb2luKCdcXG4nKSArXG4gICAgICAgICdcXG48L1BhcmFtZXRlcnM+XFxuJ1xuICAgICk7XG5cbiAgICB2YXIgcHJvcGVydGllcyA9IF8obWFwX3Byb3BlcnRpZXMpLm1hcChmdW5jdGlvbih2KSB7IHJldHVybiAnICcgKyB2OyB9KS5qb2luKCcnKTtcblxuICAgIG91dHB1dC51bnNoaWZ0KFxuICAgICAgICAnPD94bWwgdmVyc2lvbj1cIjEuMFwiICcgK1xuICAgICAgICAnZW5jb2Rpbmc9XCJ1dGYtOFwiPz5cXG4nICtcbiAgICAgICAgJzwhRE9DVFlQRSBNYXBbXT5cXG4nICtcbiAgICAgICAgJzxNYXAnICsgcHJvcGVydGllcyArJz5cXG4nKTtcbiAgICBvdXRwdXQucHVzaCgnPC9NYXA+Jyk7XG4gICAgcmV0dXJuIG91dHB1dC5qb2luKCdcXG4nKTtcbn07XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjdXJyZW50bHkgbW9kaWZpZXMgJ2N1cnJlbnQnXG4gKiBAcGFyYW0ge0FycmF5fSAgY3VycmVudCAgY3VycmVudCBsaXN0IG9mIHJ1bGVzXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvbiBhIERlZmluaXRpb24gb2JqZWN0IHRvIGFkZCB0byB0aGUgcnVsZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBieUZpbHRlciBhbiBvYmplY3QvZGljdGlvbmFyeSBvZiBleGlzdGluZyBmaWx0ZXJzLiBUaGlzIGlzXG4gKiBhY3R1YWxseSBrZXllZCBgYXR0YWNobWVudC0+ZmlsdGVyYFxuICogQHBhcmFtIHtPYmplY3R9IGVudiB0aGUgY3VycmVudCBlbnZpcm9ubWVudFxuKi9cbmZ1bmN0aW9uIGFkZFJ1bGVzKGN1cnJlbnQsIGRlZmluaXRpb24sIGJ5RmlsdGVyLCBlbnYpIHtcbiAgICB2YXIgbmV3RmlsdGVycyA9IGRlZmluaXRpb24uZmlsdGVycyxcbiAgICAgICAgbmV3UnVsZXMgPSBkZWZpbml0aW9uLnJ1bGVzLFxuICAgICAgICB1cGRhdGVkRmlsdGVycywgY2xvbmUsIHByZXZpb3VzO1xuXG4gICAgLy8gVGhlIGN1cnJlbnQgZGVmaW5pdGlvbiBtaWdodCBoYXZlIGJlZW4gc3BsaXQgdXAgaW50b1xuICAgIC8vIG11bHRpcGxlIGRlZmluaXRpb25zIGFscmVhZHkuXG4gICAgZm9yICh2YXIgayA9IDA7IGsgPCBjdXJyZW50Lmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHVwZGF0ZWRGaWx0ZXJzID0gY3VycmVudFtrXS5maWx0ZXJzLmNsb25lV2l0aChuZXdGaWx0ZXJzKTtcbiAgICAgICAgaWYgKHVwZGF0ZWRGaWx0ZXJzKSB7XG4gICAgICAgICAgICBwcmV2aW91cyA9IGJ5RmlsdGVyW3VwZGF0ZWRGaWx0ZXJzXTtcbiAgICAgICAgICAgIGlmIChwcmV2aW91cykge1xuICAgICAgICAgICAgICAgIC8vIFRoZXJlJ3MgYWxyZWFkeSBhIGRlZmluaXRpb24gd2l0aCB0aG9zZSBleGFjdFxuICAgICAgICAgICAgICAgIC8vIGZpbHRlcnMuIEFkZCB0aGUgY3VycmVudCBkZWZpbml0aW9ucycgcnVsZXNcbiAgICAgICAgICAgICAgICAvLyBhbmQgc3RvcCBwcm9jZXNzaW5nIGl0IGFzIHRoZSBleGlzdGluZyBydWxlXG4gICAgICAgICAgICAgICAgLy8gaGFzIGFscmVhZHkgZ29uZSBkb3duIHRoZSBpbmhlcml0YW5jZSBjaGFpbi5cbiAgICAgICAgICAgICAgICBwcmV2aW91cy5hZGRSdWxlcyhuZXdSdWxlcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsb25lID0gY3VycmVudFtrXS5jbG9uZSh1cGRhdGVkRmlsdGVycyk7XG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgd2UncmUgb25seSBtYWludGFpbmluZyB0aGUgY2xvbmVcbiAgICAgICAgICAgICAgICAvLyB3aGVuIHdlIGRpZCBhY3R1YWxseSBhZGQgcnVsZXMuIElmIG5vdCwgdGhlcmUnc1xuICAgICAgICAgICAgICAgIC8vIG5vIG5lZWQgdG8ga2VlcCB0aGUgY2xvbmUgYXJvdW5kLlxuICAgICAgICAgICAgICAgIGlmIChjbG9uZS5hZGRSdWxlcyhuZXdSdWxlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgaW5zZXJ0ZWQgYW4gZWxlbWVudCBiZWZvcmUgdGhpcyBvbmUsIHNvIHdlIG5lZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gbWFrZSBzdXJlIHRoYXQgaW4gdGhlIG5leHQgbG9vcCBpdGVyYXRpb24sIHdlJ3JlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdCBwZXJmb3JtaW5nIHRoZSBzYW1lIHRhc2sgZm9yIHRoaXMgZWxlbWVudCBhZ2FpbixcbiAgICAgICAgICAgICAgICAgICAgLy8gaGVuY2UgdGhlIGsrKy5cbiAgICAgICAgICAgICAgICAgICAgYnlGaWx0ZXJbdXBkYXRlZEZpbHRlcnNdID0gY2xvbmU7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQuc3BsaWNlKGssIDAsIGNsb25lKTtcbiAgICAgICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh1cGRhdGVkRmlsdGVycyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gaWYgdXBkYXRlZEZpbHRlcnMgaXMgbnVsbCwgdGhlbiBhZGRpbmcgdGhlIGZpbHRlcnMgZG9lc24ndFxuICAgICAgICAgICAgLy8gaW52YWxpZGF0ZSBvciBzcGxpdCB0aGUgc2VsZWN0b3IsIHNvIHdlIGFkZFJ1bGVzIHRvIHRoZVxuICAgICAgICAgICAgLy8gY29tYmluZWQgc2VsZWN0b3JcblxuICAgICAgICAgICAgLy8gRmlsdGVycyBjYW4gYmUgYWRkZWQsIGJ1dCB0aGV5IGRvbid0IGNoYW5nZSB0aGVcbiAgICAgICAgICAgIC8vIGZpbHRlcnMuIFRoaXMgbWVhbnMgd2UgZG9uJ3QgaGF2ZSB0byBzcGxpdCB0aGVcbiAgICAgICAgICAgIC8vIGRlZmluaXRpb24uXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gdGhpcyBpcyBjbG9uZWQgaGVyZSBiZWNhdXNlIG9mIHNoYXJlZCBjbGFzc2VzLCBzZWVcbiAgICAgICAgICAgIC8vIHNoYXJlZGNsYXNzLm1zc1xuICAgICAgICAgICAgY3VycmVudFtrXSA9IGN1cnJlbnRba10uY2xvbmUoKTtcbiAgICAgICAgICAgIGN1cnJlbnRba10uYWRkUnVsZXMobmV3UnVsZXMpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIHVwZGF0ZWRGZWF0dXJlcyBpcyBmYWxzZSwgdGhlbiB0aGUgZmlsdGVycyBzcGxpdCB0aGUgcnVsZSxcbiAgICAgICAgLy8gc28gdGhleSBhcmVuJ3QgdGhlIHNhbWUgaW5oZXJpdGFuY2UgY2hhaW5cbiAgICB9XG4gICAgcmV0dXJuIGN1cnJlbnQ7XG59XG5cbi8qKlxuICogQXBwbHkgaW5oZXJpdGVkIHN0eWxlcyBmcm9tIHRoZWlyIGFuY2VzdG9ycyB0byB0aGVtLlxuICpcbiAqIGNhbGxlZCBlaXRoZXIgb25jZSBwZXIgcmVuZGVyIChpbiB0aGUgY2FzZSBvZiBtc3MpIG9yIHBlciBsYXllclxuICogKGZvciBtbWwpXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRlZmluaXRpb25zIC0gYSBsaXN0IG9mIGRlZmluaXRpb25zIG9iamVjdHNcbiAqICAgdGhhdCBjb250YWluIC5ydWxlc1xuICogQHBhcmFtIHtPYmplY3R9IGVudiAtIHRoZSBlbnZpcm9ubWVudFxuICogQHJldHVybiB7QXJyYXk8QXJyYXk+fSBhbiBhcnJheSBvZiBhcnJheXMgaXMgcmV0dXJuZWQsXG4gKiAgIGluIHdoaWNoIGVhY2ggYXJyYXkgcmVmZXJzIHRvIGEgc3BlY2lmaWMgYXR0YWNobWVudFxuICovXG5mdW5jdGlvbiBpbmhlcml0RGVmaW5pdGlvbnMoZGVmaW5pdGlvbnMsIGVudikge1xuICAgIHZhciBpbmhlcml0VGltZSA9ICtuZXcgRGF0ZSgpO1xuICAgIC8vIGRlZmluaXRpb25zIGFyZSBvcmRlcmVkIGJ5IHNwZWNpZmljaXR5LFxuICAgIC8vIGhpZ2ggKGluZGV4IDApIHRvIGxvd1xuICAgIHZhciBieUF0dGFjaG1lbnQgPSB7fSxcbiAgICAgICAgYnlGaWx0ZXIgPSB7fTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIGN1cnJlbnQsIHByZXZpb3VzLCBhdHRhY2htZW50O1xuXG4gICAgLy8gRXZhbHVhdGUgdGhlIGZpbHRlcnMgc3BlY2lmaWVkIGJ5IGVhY2ggZGVmaW5pdGlvbiB3aXRoIHRoZSBnaXZlblxuICAgIC8vIGVudmlyb25tZW50IHRvIGNvcnJlY3RseSByZXNvbHZlIHZhcmlhYmxlIHJlZmVyZW5jZXNcbiAgICBkZWZpbml0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZC5maWx0ZXJzLmV2KGVudik7XG4gICAgfSk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmluaXRpb25zLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgYXR0YWNobWVudCA9IGRlZmluaXRpb25zW2ldLmF0dGFjaG1lbnQ7XG4gICAgICAgIGN1cnJlbnQgPSBbZGVmaW5pdGlvbnNbaV1dO1xuXG4gICAgICAgIGlmICghYnlBdHRhY2htZW50W2F0dGFjaG1lbnRdKSB7XG4gICAgICAgICAgICBieUF0dGFjaG1lbnRbYXR0YWNobWVudF0gPSBbXTtcbiAgICAgICAgICAgIGJ5QXR0YWNobWVudFthdHRhY2htZW50XS5hdHRhY2htZW50ID0gYXR0YWNobWVudDtcbiAgICAgICAgICAgIGJ5RmlsdGVyW2F0dGFjaG1lbnRdID0ge307XG4gICAgICAgICAgICByZXN1bHQucHVzaChieUF0dGFjaG1lbnRbYXR0YWNobWVudF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCBzdWJzZXF1ZW50IHJ1bGVzLlxuICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBkZWZpbml0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGRlZmluaXRpb25zW2pdLmF0dGFjaG1lbnQgPT09IGF0dGFjaG1lbnQpIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGluaGVyaXQgcnVsZXMgZnJvbSB0aGUgc2FtZSBhdHRhY2htZW50LlxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBhZGRSdWxlcyhjdXJyZW50LCBkZWZpbml0aW9uc1tqXSwgYnlGaWx0ZXJbYXR0YWNobWVudF0sIGVudik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGN1cnJlbnQubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgIGJ5RmlsdGVyW2F0dGFjaG1lbnRdW2N1cnJlbnRba10uZmlsdGVyc10gPSBjdXJyZW50W2tdO1xuICAgICAgICAgICAgYnlBdHRhY2htZW50W2F0dGFjaG1lbnRdLnB1c2goY3VycmVudFtrXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW52LmJlbmNobWFyaykgY29uc29sZS53YXJuKCdJbmhlcml0YW5jZSB0aW1lOiAnICsgKChuZXcgRGF0ZSgpIC0gaW5oZXJpdFRpbWUpKSArICdtcycpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcblxufVxuXG4vLyBTb3J0IHN0eWxlcyBieSB0aGUgbWluaW11bSBpbmRleCBvZiB0aGVpciBydWxlcy5cbi8vIFRoaXMgc29ydHMgYSBzbGljZSBvZiB0aGUgc3R5bGVzLCBzbyBpdCByZXR1cm5zIGEgc29ydGVkXG4vLyBhcnJheSBidXQgZG9lcyBub3QgY2hhbmdlIHRoZSBpbnB1dC5cbmZ1bmN0aW9uIHNvcnRTdHlsZXNJbmRleChhLCBiKSB7IHJldHVybiBiLmluZGV4IC0gYS5pbmRleDsgfVxuZnVuY3Rpb24gc29ydFN0eWxlcyhzdHlsZXMsIGVudikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3R5bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHN0eWxlc1tpXTtcbiAgICAgICAgc3R5bGUuaW5kZXggPSBJbmZpbml0eTtcbiAgICAgICAgZm9yICh2YXIgYiA9IDA7IGIgPCBzdHlsZS5sZW5ndGg7IGIrKykge1xuICAgICAgICAgICAgdmFyIHJ1bGVzID0gc3R5bGVbYl0ucnVsZXM7XG4gICAgICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IHJ1bGVzLmxlbmd0aDsgcisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJ1bGUgPSBydWxlc1tyXTtcbiAgICAgICAgICAgICAgICBpZiAocnVsZS5pbmRleCA8IHN0eWxlLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLmluZGV4ID0gcnVsZS5pbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gc3R5bGVzLnNsaWNlKCk7XG4gICAgcmVzdWx0LnNvcnQoc29ydFN0eWxlc0luZGV4KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEZpbmQgYSBydWxlIGxpa2UgTWFwIHsgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjsgfSxcbiAqIGlmIGFueSwgYW5kIHJldHVybiBhIGxpc3Qgb2YgcHJvcGVydGllcyB0byBiZSBpbnNlcnRlZFxuICogaW50byB0aGUgPE1hcCBlbGVtZW50IG9mIHRoZSByZXN1bHRpbmcgWE1MLiBUcmFuc2xhdGVzXG4gKiBwcm9wZXJ0aWVzIG9mIHRoZSBtbWwgb2JqZWN0IGF0IGBtYCBkaXJlY3RseSBpbnRvIFhNTFxuICogcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbSB0aGUgbW1sIG9iamVjdC5cbiAqIEBwYXJhbSB7QXJyYXl9IGRlZmluaXRpb25zIHRoZSBvdXRwdXQgb2YgdG9MaXN0LlxuICogQHBhcmFtIHtPYmplY3R9IGVudlxuICogQHJldHVybiB7U3RyaW5nfSByZW5kZXJlZCBwcm9wZXJ0aWVzLlxuICovXG5mdW5jdGlvbiBnZXRNYXBQcm9wZXJ0aWVzKG0sIGRlZmluaXRpb25zLCBlbnYpIHtcbiAgICB2YXIgcnVsZXMgPSB7fTtcbiAgICB2YXIgc3ltYm9saXplcnMgPSBjYXJ0by50cmVlLlJlZmVyZW5jZS5kYXRhLnN5bWJvbGl6ZXJzLm1hcDtcblxuICAgIF8obSkuZWFjaChmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIGlmIChrZXkgaW4gc3ltYm9saXplcnMpIHJ1bGVzW2tleV0gPSBrZXkgKyAnPVwiJyArIHZhbHVlICsgJ1wiJztcbiAgICB9KTtcblxuICAgIGRlZmluaXRpb25zLmZpbHRlcihmdW5jdGlvbihyKSB7XG4gICAgICAgIHJldHVybiByLmVsZW1lbnRzLmpvaW4oJycpID09PSAnTWFwJztcbiAgICB9KS5mb3JFYWNoKGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByLnJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gci5ydWxlc1tpXS5uYW1lO1xuICAgICAgICAgICAgaWYgKCEoa2V5IGluIHN5bWJvbGl6ZXJzKSkge1xuICAgICAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdSdWxlICcgKyBrZXkgKyAnIG5vdCBhbGxvd2VkIGZvciBNYXAuJyxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHIucnVsZXNbaV0uaW5kZXhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJ1bGVzW2tleV0gPSByLnJ1bGVzW2ldLmV2KGVudikudG9YTUwoZW52KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBydWxlcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjYXJ0bztcbm1vZHVsZS5leHBvcnRzLmFkZFJ1bGVzID0gYWRkUnVsZXM7XG5tb2R1bGUuZXhwb3J0cy5pbmhlcml0RGVmaW5pdGlvbnMgPSBpbmhlcml0RGVmaW5pdGlvbnM7XG5tb2R1bGUuZXhwb3J0cy5zb3J0U3R5bGVzID0gc29ydFN0eWxlcztcbiIsIihmdW5jdGlvbihjYXJ0bykge1xudmFyIHRyZWUgPSByZXF1aXJlKCcuL3RyZWUnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG5cbmZ1bmN0aW9uIENhcnRvQ1NTKHN0eWxlLCBvcHRpb25zKSB7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmKHN0eWxlKSB7XG4gICAgdGhpcy5zZXRTdHlsZShzdHlsZSk7XG4gIH1cbn1cblxuQ2FydG9DU1MuTGF5ZXIgPSBmdW5jdGlvbihzaGFkZXIsIG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgdGhpcy5zaGFkZXIgPSBzaGFkZXI7XG59O1xuXG5cbkNhcnRvQ1NTLkxheWVyLnByb3RvdHlwZSA9IHtcblxuICBmdWxsTmFtZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2hhZGVyLmF0dGFjaG1lbnQ7XG4gIH0sXG5cbiAgbmFtZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZnVsbE5hbWUoKS5zcGxpdCgnOjonKVswXTtcbiAgfSxcblxuICAvLyBmcmFtZXMgdGhpcyBsYXllciBuZWVkIHRvIGJlIHJlbmRlcmVkXG4gIGZyYW1lczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2hhZGVyLmZyYW1lcztcbiAgfSxcblxuICBhdHRhY2htZW50OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5mdWxsTmFtZSgpLnNwbGl0KCc6OicpWzFdO1xuICB9LFxuXG4gIGV2YWw6IGZ1bmN0aW9uKHByb3ApIHtcbiAgICB2YXIgcCA9IHRoaXMuc2hhZGVyW3Byb3BdO1xuICAgIGlmICghcCB8fCAhcC5zdHlsZSkgcmV0dXJuO1xuICAgIHJldHVybiBwLnN0eWxlKHt9LCB7IHpvb206IDAsICdmcmFtZS1vZmZzZXQnOiAwIH0pO1xuICB9LFxuXG4gIC8qXG4gICAqIGBwcm9wc2A6IGZlYXR1cmUgcHJvcGVydGllc1xuICAgKiBgY29udGV4dGA6IHJlbmRlcmluZyBwcm9wZXJ0aWVzLCBpLmUgem9vbVxuICAgKi9cbiAgZ2V0U3R5bGU6IGZ1bmN0aW9uKHByb3BzLCBjb250ZXh0KSB7XG4gICAgdmFyIHN0eWxlID0ge307XG4gICAgZm9yKHZhciBpIGluIHRoaXMuc2hhZGVyKSB7XG4gICAgICBpZihpICE9PSAnYXR0YWNobWVudCcgJiYgaSAhPT0gJ3pvb20nICYmIGkgIT09ICdmcmFtZXMnICYmIGkgIT09ICdzeW1ib2xpemVycycpIHtcbiAgICAgICAgc3R5bGVbaV0gPSB0aGlzLnNoYWRlcltpXS5zdHlsZShwcm9wcywgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZTtcbiAgfSxcblxuICAvKipcbiAgICogcmV0dXJuIHRoZSBzeW1ib2xpemVycyB0aGF0IG5lZWQgdG8gYmUgcmVuZGVyZWQgd2l0aCBcbiAgICogdGhpcyBzdHlsZS4gVGhlIG9yZGVyIGlzIHRoZSByZW5kZXJpbmcgb3JkZXIuXG4gICAqIEByZXR1cm5zIGEgbGlzdCB3aXRoIDMgcG9zc2libGUgdmFsdWVzICdsaW5lJywgJ21hcmtlcicsICdwb2x5Z29uJ1xuICAgKi9cbiAgZ2V0U3ltYm9saXplcnM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNoYWRlci5zeW1ib2xpemVycztcbiAgfSxcblxuICAvKipcbiAgICogcmV0dXJucyBpZiB0aGUgc3R5bGUgdmFyaWVzIHdpdGggc29tZSBmZWF0dXJlIHByb3BlcnR5LlxuICAgKiBVc2VmdWwgdG8gb3B0aW1pemUgcmVuZGVyaW5nXG4gICAqL1xuICBpc1ZhcmlhYmxlOiBmdW5jdGlvbigpIHtcbiAgICBmb3IodmFyIGkgaW4gdGhpcy5zaGFkZXIpIHtcbiAgICAgIGlmKGkgIT09ICdhdHRhY2htZW50JyAmJiBpICE9PSAnem9vbScgJiYgaSAhPT0gJ2ZyYW1lcycgJiYgaSAhPT0gJ3N5bWJvbGl6ZXJzJykge1xuICAgICAgICBpZiAoIXRoaXMuc2hhZGVyW2ldLmNvbnN0YW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIGdldFNoYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2hhZGVyO1xuICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIHRydWUgaWYgYSBmZWF0dXJlIG5lZWRzIHRvIGJlIHJlbmRlcmVkXG4gICAqL1xuICBmaWx0ZXI6IGZ1bmN0aW9uKGZlYXR1cmVUeXBlLCBwcm9wcywgY29udGV4dCkge1xuICAgIGZvcih2YXIgaSBpbiB0aGlzLnNoYWRlcikge1xuICAgICB2YXIgcyA9IHRoaXMuc2hhZGVyW2ldKHByb3BzLCBjb250ZXh0KTtcbiAgICAgaWYocykge1xuICAgICAgIHJldHVybiB0cnVlO1xuICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvL1xuICAvLyBnaXZlbiBhIGdlb2VtdHJ5IHR5cGUgcmV0dXJucyB0aGUgdHJhbnNmb3JtZWQgb25lIGFjb3JkaW5nIHRoZSBDYXJ0b0NTU1xuICAvLyBGb3IgcG9pbnRzIHRoZXJlIGFyZSB0d28ga2luZCBvZiB0eXBlczogcG9pbnQgYW5kIHNwcml0ZSwgdGhlIGZpcnN0IG9uZSBcbiAgLy8gaXMgYSBjaXJjbGUsIHNlY29uZCBvbmUgaXMgYW4gaW1hZ2Ugc3ByaXRlXG4gIC8vXG4gIC8vIHRoZSBvdGhlciBnZW9tZXRyeSB0eXBlcyBhcmUgdGhlIHNhbWUgdGhhbiBnZW9qc29uIChwb2x5Z29uLCBsaW5lc3RyaW5nLi4uKVxuICAvL1xuICB0cmFuc2Zvcm1HZW9tZXRyeTogZnVuY3Rpb24odHlwZSkge1xuICAgIHJldHVybiB0eXBlO1xuICB9LFxuXG4gIHRyYW5zZm9ybUdlb21ldHJpZXM6IGZ1bmN0aW9uKGdlb2pzb24pIHtcbiAgICByZXR1cm4gZ2VvanNvbjtcbiAgfVxuXG59O1xuXG5DYXJ0b0NTUy5wcm90b3R5cGUgPSB7XG5cbiAgc2V0U3R5bGU6IGZ1bmN0aW9uKHN0eWxlKSB7XG4gICAgdmFyIGxheWVycyA9IHRoaXMucGFyc2Uoc3R5bGUpO1xuICAgIGlmKCFsYXllcnMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLnBhcnNlX2Vudi5lcnJvcnMpO1xuICAgIH1cbiAgICB0aGlzLmxheWVycyA9IGxheWVycy5tYXAoZnVuY3Rpb24oc2hhZGVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2FydG9DU1MuTGF5ZXIoc2hhZGVyKTtcbiAgICB9KTtcbiAgfSxcblxuICBnZXRMYXllcnM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmxheWVycztcbiAgfSxcblxuICBnZXREZWZhdWx0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5maW5kTGF5ZXIoeyBhdHRhY2htZW50OiAnX19kZWZhdWx0X18nIH0pO1xuICB9LFxuXG4gIGZpbmRMYXllcjogZnVuY3Rpb24od2hlcmUpIHtcbiAgICByZXR1cm4gXy5maW5kKHRoaXMubGF5ZXJzLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIHdoZXJlKSB7XG4gICAgICAgIHZhciB2ID0gdmFsdWVba2V5XTtcbiAgICAgICAgaWYgKHR5cGVvZih2KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHYgPSB2LmNhbGwodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3aGVyZVtrZXldICE9PSB2KSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcblxuICBfY3JlYXRlRm46IGZ1bmN0aW9uKG9wcykge1xuICAgIHZhciBib2R5ID0gb3BzLmpvaW4oJ1xcbicpO1xuICAgIGlmKHRoaXMub3B0aW9ucy5kZWJ1ZykgY29uc29sZS5sb2coYm9keSk7XG4gICAgcmV0dXJuIEZ1bmN0aW9uKFwiZGF0YVwiLFwiY3R4XCIsIFwidmFyIF92YWx1ZSA9IG51bGw7IFwiICsgIGJvZHkgKyBcIjsgcmV0dXJuIF92YWx1ZTsgXCIpO1xuICB9LFxuXG4gIF9jb21waWxlOiBmdW5jdGlvbihzaGFkZXIpIHtcbiAgICBpZih0eXBlb2Ygc2hhZGVyID09PSAnc3RyaW5nJykge1xuICAgICAgICBzaGFkZXIgPSBldmFsKFwiKGZ1bmN0aW9uKCkgeyByZXR1cm4gXCIgKyBzaGFkZXIgK1wiOyB9KSgpXCIpO1xuICAgIH1cbiAgICB0aGlzLnNoYWRlcl9zcmMgPSBzaGFkZXI7XG4gICAgZm9yKHZhciBhdHRyIGluIHNoYWRlcikge1xuICAgICAgICB2YXIgYyA9IG1hcHBlclthdHRyXTtcbiAgICAgICAgaWYoYykge1xuICAgICAgICAgICAgdGhpcy5jb21waWxlZFtjXSA9IGV2YWwoXCIoZnVuY3Rpb24oKSB7IHJldHVybiBzaGFkZXJbYXR0cl07IH0pKCk7XCIpO1xuICAgICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHBhcnNlOiBmdW5jdGlvbihjYXJ0b2Nzcykge1xuICAgIHZhciBwYXJzZV9lbnYgPSB7XG4gICAgICBmcmFtZXM6IFtdLFxuICAgICAgZXJyb3JzOiBbXSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgdGhpcy5lcnJvcnMucHVzaChvYmopO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5wYXJzZV9lbnYgPSBwYXJzZV9lbnY7XG5cbiAgICB2YXIgcnVsZXNldCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIHJ1bGVzZXQgPSAobmV3IGNhcnRvLlBhcnNlcihwYXJzZV9lbnYpKS5wYXJzZShjYXJ0b2Nzcyk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAvLyBhZGQgdGhlIHN0eWxlLm1zcyBzdHJpbmcgdG8gbWF0Y2ggdGhlIHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclxuICAgICAgcGFyc2VfZW52LmVycm9ycy5wdXNoKGUubWVzc2FnZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmKHJ1bGVzZXQpIHtcblxuICAgICAgZnVuY3Rpb24gZGVmS2V5KGRlZikge1xuICAgICAgICByZXR1cm4gZGVmLmVsZW1lbnRzWzBdICsgXCI6OlwiICsgZGVmLmF0dGFjaG1lbnQ7XG4gICAgICB9XG4gICAgICB2YXIgZGVmcyA9IHJ1bGVzZXQudG9MaXN0KHBhcnNlX2Vudik7XG4gICAgICBkZWZzLnJldmVyc2UoKTtcbiAgICAgIC8vIGdyb3VwIGJ5IGVsZW1lbnRzWzBdLnZhbHVlOjphdHRhY2htZW50XG4gICAgICB2YXIgbGF5ZXJzID0ge307XG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgZGVmcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgZGVmID0gZGVmc1tpXTtcbiAgICAgICAgdmFyIGtleSA9IGRlZktleShkZWYpO1xuICAgICAgICB2YXIgbGF5ZXIgPSBsYXllcnNba2V5XSA9IChsYXllcnNba2V5XSB8fCB7XG4gICAgICAgICAgc3ltYm9saXplcnM6IFtdXG4gICAgICAgIH0pO1xuICAgICAgICBsYXllci5mcmFtZXMgPSBbXTtcbiAgICAgICAgbGF5ZXIuem9vbSA9IHRyZWUuWm9vbS5hbGw7XG4gICAgICAgIHZhciBwcm9wcyA9IGRlZi50b0pTKHBhcnNlX2Vudik7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGVidWcpIGNvbnNvbGUubG9nKFwicHJvcHNcIiwgcHJvcHMpO1xuICAgICAgICBmb3IodmFyIHYgaW4gcHJvcHMpIHtcbiAgICAgICAgICB2YXIgbHlyID0gbGF5ZXJbdl0gPSBsYXllclt2XSB8fCB7XG4gICAgICAgICAgICBjb25zdGFudDogZmFsc2UsXG4gICAgICAgICAgICBzeW1ib2xpemVyOiBudWxsLFxuICAgICAgICAgICAganM6IFtdLFxuICAgICAgICAgICAgaW5kZXg6IDBcbiAgICAgICAgICB9O1xuICAgICAgICAgIC8vIGJ1aWxkIGphdmFzY3JpcHQgc3RhdGVtZW50c1xuICAgICAgICAgIGx5ci5qcy5wdXNoKHByb3BzW3ZdLm1hcChmdW5jdGlvbihhKSB7IHJldHVybiBhLmpzOyB9KS5qb2luKCdcXG4nKSk7XG4gICAgICAgICAgLy8gZ2V0IHN5bWJvbGl6ZXIgZm9yIHByb3BcbiAgICAgICAgICBseXIuc3ltYm9saXplciA9IF8uZmlyc3QocHJvcHNbdl0ubWFwKGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGEuc3ltYm9saXplcjsgfSkpO1xuICAgICAgICAgIC8vIHNlcmFjaCB0aGUgbWF4IGluZGV4IHRvIGtub3cgcmVuZGVyaW5nIG9yZGVyXG4gICAgICAgICAgbHlyLmluZGV4ID0gXy5tYXgocHJvcHNbdl0ubWFwKGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGEuaW5kZXg7IH0pLmNvbmNhdChseXIuaW5kZXgpKTtcbiAgICAgICAgICBseXIuY29uc3RhbnQgPSAhXy5hbnkocHJvcHNbdl0ubWFwKGZ1bmN0aW9uKGEpIHsgcmV0dXJuICFhLmNvbnN0YW50OyB9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIG9yZGVyZWRfbGF5ZXJzID0gW107XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmRlYnVnKSBjb25zb2xlLmxvZyhsYXllcnMpO1xuXG4gICAgICB2YXIgZG9uZSA9IHt9O1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGRlZnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGRlZiA9IGRlZnNbaV07XG4gICAgICAgIHZhciBrID0gZGVmS2V5KGRlZik7XG4gICAgICAgIHZhciBsYXllciA9IGxheWVyc1trXTtcbiAgICAgICAgaWYoIWRvbmVba10pIHtcbiAgICAgICAgICBpZih0aGlzLm9wdGlvbnMuZGVidWcpIGNvbnNvbGUubG9nKFwiKipcIiwgayk7XG4gICAgICAgICAgZm9yKHZhciBwcm9wIGluIGxheWVyKSB7XG4gICAgICAgICAgICBpZiAocHJvcCAhPT0gJ3pvb20nICYmIHByb3AgIT09ICdmcmFtZXMnICYmIHByb3AgIT09ICdzeW1ib2xpemVycycpIHtcbiAgICAgICAgICAgICAgaWYodGhpcy5vcHRpb25zLmRlYnVnKSBjb25zb2xlLmxvZyhcIipcIiwgcHJvcCk7XG4gICAgICAgICAgICAgIGxheWVyW3Byb3BdLnN0eWxlID0gdGhpcy5fY3JlYXRlRm4obGF5ZXJbcHJvcF0uanMpO1xuICAgICAgICAgICAgICBsYXllci5zeW1ib2xpemVycy5wdXNoKGxheWVyW3Byb3BdLnN5bWJvbGl6ZXIpO1xuICAgICAgICAgICAgICBsYXllci5zeW1ib2xpemVycyA9IF8udW5pcShsYXllci5zeW1ib2xpemVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGxheWVyLmF0dGFjaG1lbnQgPSBrO1xuICAgICAgICAgIG9yZGVyZWRfbGF5ZXJzLnB1c2gobGF5ZXIpO1xuICAgICAgICAgIGRvbmVba10gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGxheWVyLnpvb20gfD0gZGVmLnpvb207XG4gICAgICAgIGxheWVyLmZyYW1lcy5wdXNoKGRlZi5mcmFtZV9vZmZzZXQpO1xuICAgICAgfVxuXG4gICAgICAvLyB1bmlxIHRoZSBmcmFtZXNcbiAgICAgIGZvcihpID0gMDsgaSA8IG9yZGVyZWRfbGF5ZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIG9yZGVyZWRfbGF5ZXJzW2ldLmZyYW1lcyA9IF8udW5pcShvcmRlcmVkX2xheWVyc1tpXS5mcmFtZXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gb3JkZXJlZF9sYXllcnM7XG5cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5cblxuY2FydG8uUmVuZGVyZXJKUyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24gPSB0aGlzLm9wdGlvbnMubWFwbmlrX3ZlcnNpb24gfHwgJ2xhdGVzdCc7XG59O1xuXG4vLyBQcmVwYXJlIGEgamF2YXNjcmlwdCBvYmplY3Qgd2hpY2ggY29udGFpbnMgdGhlIGxheWVyc1xuY2FydG8uUmVuZGVyZXJKUy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKGNhcnRvY3NzLCBjYWxsYmFjaykge1xuICAgIHZhciByZWZlcmVuY2UgPSByZXF1aXJlKCcuL3RvcnF1ZS1yZWZlcmVuY2UnKTtcbiAgICB0cmVlLlJlZmVyZW5jZS5zZXREYXRhKHJlZmVyZW5jZS52ZXJzaW9uLmxhdGVzdCk7XG4gICAgcmV0dXJuIG5ldyBDYXJ0b0NTUyhjYXJ0b2NzcywgdGhpcy5vcHRpb25zKTtcbn1cblxuaWYodHlwZW9mKG1vZHVsZSkgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gY2FydG8uUmVuZGVyZXJKUztcbn1cblxuXG59KShyZXF1aXJlKCcuLi9jYXJ0bycpKTtcbiIsInZhciBfbWFwbmlrX3JlZmVyZW5jZV9sYXRlc3QgPSB7XG4gICAgXCJ2ZXJzaW9uXCI6IFwiMi4xLjFcIixcbiAgICBcInN0eWxlXCI6IHtcbiAgICAgICAgXCJmaWx0ZXItbW9kZVwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgIFwiYWxsXCIsXG4gICAgICAgICAgICAgICAgXCJmaXJzdFwiXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJDb250cm9sIHRoZSBwcm9jZXNzaW5nIGJlaGF2aW9yIG9mIFJ1bGUgZmlsdGVycyB3aXRoaW4gYSBTdHlsZS4gSWYgJ2FsbCcgaXMgdXNlZCB0aGVuIGFsbCBSdWxlcyBhcmUgcHJvY2Vzc2VkIHNlcXVlbnRpYWxseSBpbmRlcGVuZGVudCBvZiB3aGV0aGVyIGFueSBwcmV2aW91cyBmaWx0ZXJzIG1hdGNoZWQuIElmICdmaXJzdCcgaXMgdXNlZCB0aGVuIGl0IG1lYW5zIHByb2Nlc3NpbmcgZW5kcyBhZnRlciB0aGUgZmlyc3QgbWF0Y2ggKGEgcG9zaXRpdmUgZmlsdGVyIGV2YWx1YXRpb24pIGFuZCBubyBmdXJ0aGVyIFJ1bGVzIGluIHRoZSBTdHlsZSBhcmUgcHJvY2Vzc2VkICgnZmlyc3QnIGlzIHVzdWFsbHkgdGhlIGRlZmF1bHQgZm9yIENTUyBpbXBsZW1lbnRhdGlvbnMgb24gdG9wIG9mIE1hcG5payB0byBzaW1wbGlmeSB0cmFuc2xhdGlvbiBmcm9tIENTUyB0byBNYXBuaWsgWE1MKVwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYWxsXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkFsbCBSdWxlcyBpbiBhIFN0eWxlIGFyZSBwcm9jZXNzZWQgd2hldGhlciB0aGV5IGhhdmUgZmlsdGVycyBvciBub3QgYW5kIHdoZXRoZXIgb3Igbm90IHRoZSBmaWx0ZXIgY29uZGl0aW9ucyBldmFsdWF0ZSB0byB0cnVlLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiaW1hZ2UtZmlsdGVyc1wiOiB7XG4gICAgICAgICAgICBcImNzc1wiOiBcImltYWdlLWZpbHRlcnNcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gZmlsdGVyc1wiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZnVuY3Rpb25zXCIsXG4gICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgW1wiYWdnLXN0YWNrLWJsdXJcIiwgMl0sXG4gICAgICAgICAgICAgICAgW1wiZW1ib3NzXCIsIDBdLFxuICAgICAgICAgICAgICAgIFtcImJsdXJcIiwgMF0sXG4gICAgICAgICAgICAgICAgW1wiZ3JheVwiLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJzb2JlbFwiLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJlZGdlLWRldGVjdFwiLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJ4LWdyYWRpZW50XCIsIDBdLFxuICAgICAgICAgICAgICAgIFtcInktZ3JhZGllbnRcIiwgMF0sXG4gICAgICAgICAgICAgICAgW1wiaW52ZXJ0XCIsIDBdLFxuICAgICAgICAgICAgICAgIFtcInNoYXJwZW5cIiwgMF1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBcImRvY1wiOiBcIkEgbGlzdCBvZiBpbWFnZSBmaWx0ZXJzLlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICBcImNzc1wiOiBcImNvbXAtb3BcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBsYXllciBvbiB0b3Agb2Ygb3RoZXIgbGF5ZXJzXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBsYXllciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIGxheWVycyBhdG9wIG9yIGJlbG93IGl0LlwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICBcImRzdFwiLFxuICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcInNvdXJjZS1vdmVyXCIsIC8vIGFkZGVkIGZvciB0b3JxdWVcbiAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgXCJzcmMtaW5cIixcbiAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgIFwiZHN0LW91dFwiLFxuICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgXCJ4b3JcIixcbiAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiLFxuICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgXCJkYXJrZW5cIixcbiAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICBcImxpZ2h0ZXJcIiwgLy8gYWRkZWQgZm9yIHRvcnF1ZVxuICAgICAgICAgICAgICAgIFwiY29sb3ItZG9kZ2VcIixcbiAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICBcInNvZnQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgIFwiY29udHJhc3RcIixcbiAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgIFwiZ3JhaW4tbWVyZ2VcIixcbiAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgIFwic2F0dXJhdGlvblwiLFxuICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICAgIFwiY3NzXCI6IFwib3BhY2l0eVwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gYWxwaGEgdmFsdWUgZm9yIHRoZSBzdHlsZSAod2hpY2ggbWVhbnMgYW4gYWxwaGEgYXBwbGllZCB0byBhbGwgZmVhdHVyZXMgaW4gc2VwYXJhdGUgYnVmZmVyIGFuZCB0aGVuIGNvbXBvc2l0ZWQgYmFjayB0byBtYWluIGJ1ZmZlcilcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBzZXBhcmF0ZSBidWZmZXIgd2lsbCBiZSB1c2VkIGFuZCBubyBhbHBoYSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIHN0eWxlIGFmdGVyIHJlbmRlcmluZ1wiXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFwibGF5ZXJcIiA6IHtcbiAgICAgICAgXCJuYW1lXCI6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6XCJzdHJpbmdcIixcbiAgICAgICAgICAgIFwicmVxdWlyZWRcIiA6IHRydWUsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk5vIGxheWVyIG5hbWUgaGFzIGJlZW4gcHJvdmlkZWRcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG5hbWUgb2YgYSBsYXllci4gQ2FuIGJlIGFueXRoaW5nIHlvdSB3aXNoIGFuZCBpcyBub3Qgc3RyaWN0bHkgdmFsaWRhdGVkLCBidXQgaWRlYWxseSB1bmlxdWUgIGluIHRoZSBtYXBcIlxuICAgICAgICB9LFxuICAgICAgICBcInNyc1wiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgIFwidHlwZVwiOlwic3RyaW5nXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk5vIHNycyB2YWx1ZSBpcyBwcm92aWRlZCBhbmQgdGhlIHZhbHVlIHdpbGwgYmUgaW5oZXJpdGVkIGZyb20gdGhlIE1hcCdzIHNyc1wiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgc3BhdGlhbCByZWZlcmVuY2Ugc3lzdGVtIGRlZmluaXRpb24gZm9yIHRoZSBsYXllciwgYWthIHRoZSBwcm9qZWN0aW9uLiBDYW4gZWl0aGVyIGJlIGEgcHJvajQgbGl0ZXJhbCBzdHJpbmcgbGlrZSAnK3Byb2o9bG9uZ2xhdCArZWxscHM9V0dTODQgK2RhdHVtPVdHUzg0ICtub19kZWZzJyBvciwgaWYgdGhlIHByb3BlciBwcm9qNCBlcHNnL25hZC9ldGMgaWRlbnRpZmllciBmaWxlcyBhcmUgaW5zdGFsbGVkLCBhIHN0cmluZyB0aGF0IHVzZXMgYW4gaWQgbGlrZTogJytpbml0PWVwc2c6NDMyNidcIlxuICAgICAgICB9LFxuICAgICAgICBcInN0YXR1c1wiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogdHJ1ZSxcbiAgICAgICAgICAgIFwidHlwZVwiOlwiYm9vbGVhblwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJUaGlzIGxheWVyIHdpbGwgYmUgbWFya2VkIGFzIGFjdGl2ZSBhbmQgYXZhaWxhYmxlIGZvciBwcm9jZXNzaW5nXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIkEgcHJvcGVydHkgdGhhdCBjYW4gYmUgc2V0IHRvIGZhbHNlIHRvIGRpc2FibGUgdGhpcyBsYXllciBmcm9tIGJlaW5nIHByb2Nlc3NlZFwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibWluem9vbVwiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIwXCIsXG4gICAgICAgICAgICBcInR5cGVcIjpcImZsb2F0XCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlRoZSBsYXllciB3aWxsIGJlIHZpc2libGUgYXQgdGhlIG1pbmltdW0gcG9zc2libGUgc2NhbGVcIixcbiAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG1pbmltdW0gc2NhbGUgZGVub21pbmF0b3IgdGhhdCB0aGlzIGxheWVyIHdpbGwgYmUgdmlzaWJsZSBhdC4gQSBsYXllcidzIHZpc2liaWxpdHkgaXMgZGV0ZXJtaW5lZCBieSB3aGV0aGVyIGl0cyBzdGF0dXMgaXMgdHJ1ZSBhbmQgaWYgdGhlIE1hcCBzY2FsZSA+PSBtaW56b29tIC0gMWUtNiBhbmQgc2NhbGUgPCBtYXh6b29tICsgMWUtNlwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibWF4em9vbVwiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIxLjc5NzY5ZSszMDhcIixcbiAgICAgICAgICAgIFwidHlwZVwiOlwiZmxvYXRcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhlIGxheWVyIHdpbGwgYmUgdmlzaWJsZSBhdCB0aGUgbWF4aW11bSBwb3NzaWJsZSBzY2FsZVwiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgbWF4aW11bSBzY2FsZSBkZW5vbWluYXRvciB0aGF0IHRoaXMgbGF5ZXIgd2lsbCBiZSB2aXNpYmxlIGF0LiBUaGUgZGVmYXVsdCBpcyB0aGUgbnVtZXJpYyBsaW1pdCBvZiB0aGUgQysrIGRvdWJsZSB0eXBlLCB3aGljaCBtYXkgdmFyeSBzbGlnaHRseSBieSBzeXN0ZW0sIGJ1dCBpcyBsaWtlbHkgYSBtYXNzaXZlIG51bWJlciBsaWtlIDEuNzk3NjllKzMwOCBhbmQgZW5zdXJlcyB0aGF0IHRoaXMgbGF5ZXIgd2lsbCBhbHdheXMgYmUgdmlzaWJsZSB1bmxlc3MgdGhlIHZhbHVlIGlzIHJlZHVjZWQuIEEgbGF5ZXIncyB2aXNpYmlsaXR5IGlzIGRldGVybWluZWQgYnkgd2hldGhlciBpdHMgc3RhdHVzIGlzIHRydWUgYW5kIGlmIHRoZSBNYXAgc2NhbGUgPj0gbWluem9vbSAtIDFlLTYgYW5kIHNjYWxlIDwgbWF4em9vbSArIDFlLTZcIlxuICAgICAgICB9LFxuICAgICAgICBcInF1ZXJ5YWJsZVwiOiB7XG4gICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICBcInR5cGVcIjpcImJvb2xlYW5cIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhlIGxheWVyIHdpbGwgbm90IGJlIGF2YWlsYWJsZSBmb3IgdGhlIGRpcmVjdCBxdWVyeWluZyBvZiBkYXRhIHZhbHVlc1wiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJUaGlzIHByb3BlcnR5IHdhcyBhZGRlZCBmb3IgR2V0RmVhdHVyZUluZm8vV01TIGNvbXBhdGliaWxpdHkgYW5kIGlzIHJhcmVseSB1c2VkLiBJdCBpcyBvZmYgYnkgZGVmYXVsdCBtZWFuaW5nIHRoYXQgaW4gYSBXTVMgY29udGV4dCB0aGUgbGF5ZXIgd2lsbCBub3QgYmUgYWJsZSB0byBiZSBxdWVyaWVkIHVubGVzcyB0aGUgcHJvcGVydHkgaXMgZXhwbGljaXRseSBzZXQgdG8gdHJ1ZVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiY2xlYXItbGFiZWwtY2FjaGVcIjoge1xuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgXCJ0eXBlXCI6XCJib29sZWFuXCIsXG4gICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlRoZSByZW5kZXJlcidzIGNvbGxpc2lvbiBkZXRlY3RvciBjYWNoZSAodXNlZCBmb3IgYXZvaWRpbmcgZHVwbGljYXRlIGxhYmVscyBhbmQgb3ZlcmxhcHBpbmcgbWFya2Vycykgd2lsbCBub3QgYmUgY2xlYXJlZCBpbW1lZGlhdGVseSBiZWZvcmUgcHJvY2Vzc2luZyB0aGlzIGxheWVyXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIlRoaXMgcHJvcGVydHksIGJ5IGRlZmF1bHQgb2ZmLCBjYW4gYmUgZW5hYmxlZCB0byBhbGxvdyBhIHVzZXIgdG8gY2xlYXIgdGhlIGNvbGxpc2lvbiBkZXRlY3RvciBjYWNoZSBiZWZvcmUgYSBnaXZlbiBsYXllciBpcyBwcm9jZXNzZWQuIFRoaXMgbWF5IGJlIGRlc2lyYWJsZSB0byBlbnN1cmUgdGhhdCBhIGdpdmVuIGxheWVycyBkYXRhIHNob3dzIHVwIG9uIHRoZSBtYXAgZXZlbiBpZiBpdCBub3JtYWxseSB3b3VsZCBub3QgYmVjYXVzZSBvZiBjb2xsaXNpb25zIHdpdGggcHJldmlvdXNseSByZW5kZXJlZCBsYWJlbHMgb3IgbWFya2Vyc1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZ3JvdXAtYnlcIjoge1xuICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICBcInR5cGVcIjpcInN0cmluZ1wiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyBzcGVjaWFsIGxheWVyIGdyb3VwaW5nIHdpbGwgYmUgdXNlZCBkdXJpbmcgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9tYXBuaWsvbWFwbmlrL3dpa2kvR3JvdXBlZC1yZW5kZXJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcImJ1ZmZlci1zaXplXCI6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjBcIixcbiAgICAgICAgICAgIFwidHlwZVwiOlwiZmxvYXRcIixcbiAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiTm8gYnVmZmVyIHdpbGwgYmUgdXNlZFwiLFxuICAgICAgICAgICAgXCJkb2NcIjogXCJFeHRyYSB0b2xlcmFuY2UgYXJvdW5kIHRoZSBMYXllciBleHRlbnQgKGluIHBpeGVscykgdXNlZCB0byB3aGVuIHF1ZXJ5aW5nIGFuZCAocG90ZW50aWFsbHkpIGNsaXBwaW5nIHRoZSBsYXllciBkYXRhIGR1cmluZyByZW5kZXJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBcIm1heGltdW0tZXh0ZW50XCI6IHtcbiAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIFwidHlwZVwiOlwiYmJveFwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyBjbGlwcGluZyBleHRlbnQgd2lsbCBiZSB1c2VkXCIsXG4gICAgICAgICAgICBcImRvY1wiOiBcIkFuIGV4dGVudCB0byBiZSB1c2VkIHRvIGxpbWl0IHRoZSBib3VuZHMgdXNlZCB0byBxdWVyeSB0aGlzIHNwZWNpZmljIGxheWVyIGRhdGEgZHVyaW5nIHJlbmRlcmluZy4gU2hvdWxkIGJlIG1pbngsIG1pbnksIG1heHgsIG1heHkgaW4gdGhlIGNvb3JkaW5hdGVzIG9mIHRoZSBMYXllci5cIlxuICAgICAgICB9XG4gICAgfSxcbiAgICBcInN5bWJvbGl6ZXJzXCIgOiB7XG4gICAgICAgIFwiKlwiOiB7XG4gICAgICAgICAgICBcImltYWdlLWZpbHRlcnNcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiaW1hZ2UtZmlsdGVyc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIGZpbHRlcnNcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmdW5jdGlvbnNcIixcbiAgICAgICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcImFnZy1zdGFjay1ibHVyXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJlbWJvc3NcIiwgMF0sXG4gICAgICAgICAgICAgICAgICAgIFtcImJsdXJcIiwgMF0sXG4gICAgICAgICAgICAgICAgICAgIFtcImdyYXlcIiwgMF0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNvYmVsXCIsIDBdLFxuICAgICAgICAgICAgICAgICAgICBbXCJlZGdlLWRldGVjdFwiLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgW1wieC1ncmFkaWVudFwiLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgW1wieS1ncmFkaWVudFwiLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgW1wiaW52ZXJ0XCIsIDBdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzaGFycGVuXCIsIDBdXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkEgbGlzdCBvZiBpbWFnZSBmaWx0ZXJzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IGxheWVyIG9uIHRvcCBvZiBvdGhlciBsYXllcnNcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBsYXllciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIGxheWVycyBhdG9wIG9yIGJlbG93IGl0LlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXCJjbGVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyY1wiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic291cmNlLW92ZXJcIiwgLy8gYWRkZWQgZm9yIHRvcnF1ZVxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZXJcIiwgLy8gYWRkZWQgZm9yIHRvcnF1ZVxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gYWxwaGEgdmFsdWUgZm9yIHRoZSBzdHlsZSAod2hpY2ggbWVhbnMgYW4gYWxwaGEgYXBwbGllZCB0byBhbGwgZmVhdHVyZXMgaW4gc2VwYXJhdGUgYnVmZmVyIGFuZCB0aGVuIGNvbXBvc2l0ZWQgYmFjayB0byBtYWluIGJ1ZmZlcilcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIHNlcGFyYXRlIGJ1ZmZlciB3aWxsIGJlIHVzZWQgYW5kIG5vIGFscGhhIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgc3R5bGUgYWZ0ZXIgcmVuZGVyaW5nXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXBcIjoge1xuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImJhY2tncm91bmQtY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJNYXAgQmFja2dyb3VuZCBjb2xvclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWltYWdlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImJhY2tncm91bmQtaW1hZ2VcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbiBpbWFnZSB0aGF0IGlzIHJlcGVhdGVkIGJlbG93IGFsbCBmZWF0dXJlcyBvbiBhIG1hcCBhcyBhIGJhY2tncm91bmQuXCIsXG4gICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk1hcCBCYWNrZ3JvdW5kIGltYWdlXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNyc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzcnNcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIrcHJvaj1sb25nbGF0ICtlbGxwcz1XR1M4NCArZGF0dW09V0dTODQgK25vX2RlZnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlRoZSBwcm9qNCBsaXRlcmFsIG9mIEVQU0c6NDMyNiBpcyBhc3N1bWVkIHRvIGJlIHRoZSBNYXAncyBzcGF0aWFsIHJlZmVyZW5jZSBhbmQgYWxsIGRhdGEgZnJvbSBsYXllcnMgd2l0aGluIHRoaXMgbWFwIHdpbGwgYmUgcGxvdHRlZCB1c2luZyB0aGlzIGNvb3JkaW5hdGUgc3lzdGVtLiBJZiBhbnkgbGF5ZXJzIGRvIG5vdCBkZWNsYXJlIGFuIHNycyB2YWx1ZSB0aGVuIHRoZXkgd2lsbCBiZSBhc3N1bWVkIHRvIGJlIGluIHRoZSBzYW1lIHNycyBhcyB0aGUgTWFwIGFuZCBub3QgdHJhbnNmb3JtYXRpb25zIHdpbGwgYmUgbmVlZGVkIHRvIHBsb3QgdGhlbSBpbiB0aGUgTWFwJ3MgY29vcmRpbmF0ZSBzcGFjZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTWFwIHNwYXRpYWwgcmVmZXJlbmNlIChwcm9qNCBzdHJpbmcpXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImJ1ZmZlci1zaXplXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImJ1ZmZlci1zaXplXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiMFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOlwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIk5vIGJ1ZmZlciB3aWxsIGJlIHVzZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkV4dHJhIHRvbGVyYW5jZSBhcm91bmQgdGhlIG1hcCAoaW4gcGl4ZWxzKSB1c2VkIHRvIGVuc3VyZSBsYWJlbHMgY3Jvc3NpbmcgdGlsZSBib3VuZGFyaWVzIGFyZSBlcXVhbGx5IHJlbmRlcmVkIGluIGVhY2ggdGlsZSAoZS5nLiBjdXQgaW4gZWFjaCB0aWxlKS4gTm90IGludGVuZGVkIHRvIGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBcXFwiYXZvaWQtZWRnZXNcXFwiLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtYXhpbXVtLWV4dGVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6XCJiYm94XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyBjbGlwcGluZyBleHRlbnQgd2lsbCBiZSB1c2VkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbiBleHRlbnQgdG8gYmUgdXNlZCB0byBsaW1pdCB0aGUgYm91bmRzIHVzZWQgdG8gcXVlcnkgYWxsIGxheWVycyBkdXJpbmcgcmVuZGVyaW5nLiBTaG91bGQgYmUgbWlueCwgbWlueSwgbWF4eCwgbWF4eSBpbiB0aGUgY29vcmRpbmF0ZXMgb2YgdGhlIE1hcC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYmFzZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJiYXNlXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJUaGlzIGJhc2UgcGF0aCBkZWZhdWx0cyB0byBhbiBlbXB0eSBzdHJpbmcgbWVhbmluZyB0aGF0IGFueSByZWxhdGl2ZSBwYXRocyB0byBmaWxlcyByZWZlcmVuY2VkIGluIHN0eWxlcyBvciBsYXllcnMgd2lsbCBiZSBpbnRlcnByZXRlZCByZWxhdGl2ZSB0byB0aGUgYXBwbGljYXRpb24gcHJvY2Vzcy5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFueSByZWxhdGl2ZSBwYXRocyB1c2VkIHRvIHJlZmVyZW5jZSBmaWxlcyB3aWxsIGJlIHVuZGVyc3Rvb2QgYXMgcmVsYXRpdmUgdG8gdGhpcyBkaXJlY3RvcnkgcGF0aCBpZiB0aGUgbWFwIGlzIGxvYWRlZCBmcm9tIGFuIGluIG1lbW9yeSBvYmplY3QgcmF0aGVyIHRoYW4gZnJvbSB0aGUgZmlsZXN5c3RlbS4gSWYgdGhlIG1hcCBpcyBsb2FkZWQgZnJvbSB0aGUgZmlsZXN5c3RlbSBhbmQgdGhpcyBvcHRpb24gaXMgbm90IHByb3ZpZGVkIGl0IHdpbGwgYmUgc2V0IHRvIHRoZSBkaXJlY3Rvcnkgb2YgdGhlIHN0eWxlc2hlZXQuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInBhdGhzLWZyb20teG1sXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiUGF0aHMgcmVhZCBmcm9tIFhNTCB3aWxsIGJlIGludGVycHJldGVkIGZyb20gdGhlIGxvY2F0aW9uIG9mIHRoZSBYTUxcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJ2YWx1ZSB0byBjb250cm9sIHdoZXRoZXIgcGF0aHMgaW4gdGhlIFhNTCB3aWxsIGJlIGludGVycHJldGVkIGZyb20gdGhlIGxvY2F0aW9uIG9mIHRoZSBYTUwgb3IgZnJvbSB0aGUgd29ya2luZyBkaXJlY3Rvcnkgb2YgdGhlIHByb2dyYW0gdGhhdCBjYWxscyBsb2FkX21hcCgpXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1pbmltdW0tdmVyc2lvblwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJNYXBuaWsgdmVyc2lvbiB3aWxsIG5vdCBiZSBkZXRlY3RlZCBhbmQgbm8gZXJyb3Igd2lsbCBiZSB0aHJvd24gYWJvdXQgY29tcGF0aWJpbGl0eVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG1pbnVtdW0gTWFwbmlrIHZlcnNpb24gKGUuZy4gMC43LjIpIG5lZWRlZCB0byB1c2UgY2VydGFpbiBmdW5jdGlvbmFsaXR5IGluIHRoZSBzdHlsZXNoZWV0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZvbnQtZGlyZWN0b3J5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImZvbnQtZGlyZWN0b3J5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidXJpXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiTm8gbWFwLXNwZWNpZmljIGZvbnRzIHdpbGwgYmUgcmVnaXN0ZXJlZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiUGF0aCB0byBhIGRpcmVjdG9yeSB3aGljaCBob2xkcyBmb250cyB3aGljaCBzaG91bGQgYmUgcmVnaXN0ZXJlZCB3aGVuIHRoZSBNYXAgaXMgbG9hZGVkIChpbiBhZGRpdGlvbiB0byBhbnkgZm9udHMgdGhhdCBtYXkgYmUgYXV0b21hdGljYWxseSByZWdpc3RlcmVkKS5cIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBvbHlnb25cIjoge1xuICAgICAgICAgICAgXCJmaWxsXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tZmlsbFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwicmdiYSgxMjgsMTI4LDEyOCwxKVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ3JheSBhbmQgZnVsbHkgb3BhcXVlIChhbHBoYSA9IDEpLCBzYW1lIGFzIHJnYigxMjgsMTI4LDEyOClcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkZpbGwgY29sb3IgdG8gYXNzaWduIHRvIGEgcG9seWdvblwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWxsLW9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBvcGFjaXR5IG9mIHRoZSBwb2x5Z29uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJvcGFxdWVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2FtbWFcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1nYW1tYVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJmdWxseSBhbnRpYWxpYXNlZFwiLFxuICAgICAgICAgICAgICAgIFwicmFuZ2VcIjogXCIwLTFcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkxldmVsIG9mIGFudGlhbGlhc2luZyBvZiBwb2x5Z29uIGVkZ2VzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdhbW1hLW1ldGhvZFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLWdhbW1hLW1ldGhvZFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5lYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJub25lXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidGhyZXNob2xkXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwicG93ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInBvdyh4LGdhbW1hKSBpcyB1c2VkIHRvIGNhbGN1bGF0ZSBwaXhlbCBnYW1tYSwgd2hpY2ggcHJvZHVjZXMgc2xpZ2h0bHkgc21vb3RoZXIgbGluZSBhbmQgcG9seWdvbiBhbnRpYWxpYXNpbmcgdGhhbiB0aGUgJ2xpbmVhcicgbWV0aG9kLCB3aGlsZSBvdGhlciBtZXRob2RzIGFyZSB1c3VhbGx5IG9ubHkgdXNlZCB0byBkaXNhYmxlIEFBXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBbiBBbnRpZ3JhaW4gR2VvbWV0cnkgc3BlY2lmaWMgcmVuZGVyaW5nIGhpbnQgdG8gY29udHJvbCB0aGUgcXVhbGl0eSBvZiBhbnRpYWxpYXNpbmcuIFVuZGVyIHRoZSBob29kIGluIE1hcG5payB0aGlzIG1ldGhvZCBpcyB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggdGhlICdnYW1tYScgdmFsdWUgKHdoaWNoIGRlZmF1bHRzIHRvIDEpLiBUaGUgbWV0aG9kcyBhcmUgaW4gdGhlIEFHRyBzb3VyY2UgYXQgaHR0cHM6Ly9naXRodWIuY29tL21hcG5pay9tYXBuaWsvYmxvYi9tYXN0ZXIvZGVwcy9hZ2cvaW5jbHVkZS9hZ2dfZ2FtbWFfZnVuY3Rpb25zLmhcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY2xpcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLWNsaXBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIGJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBiZWZvcmUgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJnZW9tZXRyaWVzIGFyZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYnkgZGVmYXVsdCBmb3IgYmVzdCByZW5kZXJpbmcgcGVyZm9ybWFuY2UuIEluIHNvbWUgY2FzZXMgdXNlcnMgbWF5IHdpc2ggdG8gZGlzYWJsZSB0aGlzIHRvIGF2b2lkIHJlbmRlcmluZyBhcnRpZmFjdHMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNtb290aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLXNtb290aFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBzbW9vdGhpbmdcIixcbiAgICAgICAgICAgICAgICBcInJhbmdlXCI6IFwiMC0xXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTbW9vdGhzIG91dCBnZW9tZXRyeSBhbmdsZXMuIDAgaXMgbm8gc21vb3RoaW5nLCAxIGlzIGZ1bGx5IHNtb290aGVkLiBWYWx1ZXMgZ3JlYXRlciB0aGFuIDEgd2lsbCBwcm9kdWNlIHdpbGQsIGxvb3BpbmcgZ2VvbWV0cmllcy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2VvbWV0cnktdHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tZ2VvbWV0cnktdHJhbnNmb3JtXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZnVuY3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBub3QgYmUgdHJhbnNmb3JtZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFsbG93cyB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbnMgdG8gYmUgYXBwbGllZCB0byB0aGUgZ2VvbWV0cnkuXCIsXG4gICAgICAgICAgICAgICAgXCJmdW5jdGlvbnNcIjogW1xuICAgICAgICAgICAgICAgICAgICBbXCJtYXRyaXhcIiwgNl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInRyYW5zbGF0ZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2NhbGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInJvdGF0ZVwiLCAzXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1hcIiwgMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdZXCIsIDFdXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2x5Z29uLWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibGluZVwiOiB7XG4gICAgICAgICAgICBcInN0cm9rZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwicmdiYSgwLDAsMCwxKVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJibGFjayBhbmQgZnVsbHkgb3BhcXVlIChhbHBoYSA9IDEpLCBzYW1lIGFzIHJnYigwLDAsMClcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBjb2xvciBvZiBhIGRyYXduIGxpbmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLXdpZHRoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtd2lkdGhcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHdpZHRoIG9mIGEgbGluZSBpbiBwaXhlbHNcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLW9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm9wYXF1ZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIG9wYWNpdHkgb2YgYSBsaW5lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS1saW5lam9pblwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWpvaW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJtaXRlclwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwibWl0ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb3VuZFwiLFxuICAgICAgICAgICAgICAgICAgICBcImJldmVsXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIGJlaGF2aW9yIG9mIGxpbmVzIHdoZW4gam9pbmluZ1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2UtbGluZWNhcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJsaW5lLWNhcFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImJ1dHRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImJ1dHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyb3VuZFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNxdWFyZVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBkaXNwbGF5IG9mIGxpbmUgZW5kaW5nc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2UtZ2FtbWFcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1nYW1tYVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJmdWxseSBhbnRpYWxpYXNlZFwiLFxuICAgICAgICAgICAgICAgIFwicmFuZ2VcIjogXCIwLTFcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkxldmVsIG9mIGFudGlhbGlhc2luZyBvZiBzdHJva2UgbGluZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2UtZ2FtbWEtbWV0aG9kXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtZ2FtbWEtbWV0aG9kXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ0aHJlc2hvbGRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJwb3dlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwicG93KHgsZ2FtbWEpIGlzIHVzZWQgdG8gY2FsY3VsYXRlIHBpeGVsIGdhbW1hLCB3aGljaCBwcm9kdWNlcyBzbGlnaHRseSBzbW9vdGhlciBsaW5lIGFuZCBwb2x5Z29uIGFudGlhbGlhc2luZyB0aGFuIHRoZSAnbGluZWFyJyBtZXRob2QsIHdoaWxlIG90aGVyIG1ldGhvZHMgYXJlIHVzdWFsbHkgb25seSB1c2VkIHRvIGRpc2FibGUgQUFcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFuIEFudGlncmFpbiBHZW9tZXRyeSBzcGVjaWZpYyByZW5kZXJpbmcgaGludCB0byBjb250cm9sIHRoZSBxdWFsaXR5IG9mIGFudGlhbGlhc2luZy4gVW5kZXIgdGhlIGhvb2QgaW4gTWFwbmlrIHRoaXMgbWV0aG9kIGlzIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCB0aGUgJ2dhbW1hJyB2YWx1ZSAod2hpY2ggZGVmYXVsdHMgdG8gMSkuIFRoZSBtZXRob2RzIGFyZSBpbiB0aGUgQUdHIHNvdXJjZSBhdCBodHRwczovL2dpdGh1Yi5jb20vbWFwbmlrL21hcG5pay9ibG9iL21hc3Rlci9kZXBzL2FnZy9pbmNsdWRlL2FnZ19nYW1tYV9mdW5jdGlvbnMuaFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2UtZGFzaGFycmF5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtZGFzaGFycmF5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyc1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSBwYWlyIG9mIGxlbmd0aCB2YWx1ZXMgW2EsYl0sIHdoZXJlIChhKSBpcyB0aGUgZGFzaCBsZW5ndGggYW5kIChiKSBpcyB0aGUgZ2FwIGxlbmd0aCByZXNwZWN0aXZlbHkuIE1vcmUgdGhhbiB0d28gdmFsdWVzIGFyZSBzdXBwb3J0ZWQgZm9yIG1vcmUgY29tcGxleCBwYXR0ZXJucy5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJzb2xpZCBsaW5lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS1kYXNob2Zmc2V0XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtZGFzaC1vZmZzZXRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJzXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJ2YWxpZCBwYXJhbWV0ZXIgYnV0IG5vdCBjdXJyZW50bHkgdXNlZCBpbiByZW5kZXJlcnMgKG9ubHkgZXhpc3RzIGZvciBleHBlcmltZW50YWwgc3ZnIHN1cHBvcnQgaW4gTWFwbmlrIHdoaWNoIGlzIG5vdCB5ZXQgZW5hYmxlZClcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJzb2xpZCBsaW5lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZS1taXRlcmxpbWl0XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtbWl0ZXJsaW1pdFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgbGltaXQgb24gdGhlIHJhdGlvIG9mIHRoZSBtaXRlciBsZW5ndGggdG8gdGhlIHN0cm9rZS13aWR0aC4gVXNlZCB0byBhdXRvbWF0aWNhbGx5IGNvbnZlcnQgbWl0ZXIgam9pbnMgdG8gYmV2ZWwgam9pbnMgZm9yIHNoYXJwIGFuZ2xlcyB0byBhdm9pZCB0aGUgbWl0ZXIgZXh0ZW5kaW5nIGJleW9uZCB0aGUgdGhpY2tuZXNzIG9mIHRoZSBzdHJva2luZyBwYXRoLiBOb3JtYWxseSB3aWxsIG5vdCBuZWVkIHRvIGJlIHNldCwgYnV0IGEgbGFyZ2VyIHZhbHVlIGNhbiBzb21ldGltZXMgaGVscCBhdm9pZCBqYWdneSBhcnRpZmFjdHMuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDQuMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIldpbGwgYXV0by1jb252ZXJ0IG1pdGVycyB0byBiZXZlbCBsaW5lIGpvaW5zIHdoZW4gdGhldGEgaXMgbGVzcyB0aGFuIDI5IGRlZ3JlZXMgYXMgcGVyIHRoZSBTVkcgc3BlYzogJ21pdGVyTGVuZ3RoIC8gc3Ryb2tlLXdpZHRoID0gMSAvIHNpbiAoIHRoZXRhIC8gMiApJ1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtY2xpcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgYmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJlZm9yZSByZW5kZXJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcImdlb21ldHJpZXMgYXJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBieSBkZWZhdWx0IGZvciBiZXN0IHJlbmRlcmluZyBwZXJmb3JtYW5jZS4gSW4gc29tZSBjYXNlcyB1c2VycyBtYXkgd2lzaCB0byBkaXNhYmxlIHRoaXMgdG8gYXZvaWQgcmVuZGVyaW5nIGFydGlmYWN0cy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic21vb3RoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtc21vb3RoXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIHNtb290aGluZ1wiLFxuICAgICAgICAgICAgICAgIFwicmFuZ2VcIjogXCIwLTFcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNtb290aHMgb3V0IGdlb21ldHJ5IGFuZ2xlcy4gMCBpcyBubyBzbW9vdGhpbmcsIDEgaXMgZnVsbHkgc21vb3RoZWQuIFZhbHVlcyBncmVhdGVyIHRoYW4gMSB3aWxsIHByb2R1Y2Ugd2lsZCwgbG9vcGluZyBnZW9tZXRyaWVzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvZmZzZXRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1vZmZzZXRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gb2Zmc2V0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJPZmZzZXRzIGEgbGluZSBhIG51bWJlciBvZiBwaXhlbHMgcGFyYWxsZWwgdG8gaXRzIGFjdHVhbCBwYXRoLiBQb3N0aXZlIHZhbHVlcyBtb3ZlIHRoZSBsaW5lIGxlZnQsIG5lZ2F0aXZlIHZhbHVlcyBtb3ZlIGl0IHJpZ2h0IChyZWxhdGl2ZSB0byB0aGUgZGlyZWN0aW9uYWxpdHkgb2YgdGhlIGxpbmUpLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJyYXN0ZXJpemVyXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtcmFzdGVyaXplclwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiZnVsbFwiLFxuICAgICAgICAgICAgICAgICAgICBcImZhc3RcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiZnVsbFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRXhwb3NlcyBhbiBhbHRlcm5hdGUgQUdHIHJlbmRlcmluZyBtZXRob2QgdGhhdCBzYWNyaWZpY2VzIHNvbWUgYWNjdXJhY3kgZm9yIHNwZWVkLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJnZW9tZXRyeS10cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1nZW9tZXRyeS10cmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmdW5jdGlvbnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIG5vdCBiZSB0cmFuc2Zvcm1lZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQWxsb3dzIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBnZW9tZXRyeS5cIixcbiAgICAgICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcIm1hdHJpeFwiLCA2XSxcbiAgICAgICAgICAgICAgICAgICAgW1widHJhbnNsYXRlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzY2FsZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicm90YXRlXCIsIDNdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WFwiLCAxXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1lcIiwgMV1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtY29tcC1vcFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJhZGQgdGhlIGN1cnJlbnQgc3ltYm9saXplciBvbiB0b3Agb2Ygb3RoZXIgc3ltYm9saXplclwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29tcG9zaXRlIG9wZXJhdGlvbi4gVGhpcyBkZWZpbmVzIGhvdyB0aGlzIHN5bWJvbGl6ZXIgc2hvdWxkIGJlaGF2ZSByZWxhdGl2ZSB0byBzeW1ib2xpemVycyBhdG9wIG9yIGJlbG93IGl0LlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXCJjbGVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyY1wiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4b3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwbHVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWludXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNjcmVlblwiLFxuICAgICAgICAgICAgICAgICAgICBcIm92ZXJsYXlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkYXJrZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaWdodGVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItZG9kZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1idXJuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGFyZC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNvZnQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkaWZmZXJlbmNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZXhjbHVzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29udHJhc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnQtcmdiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tbWVyZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1leHRyYWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2F0dXJhdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIlxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXJrZXJzXCI6IHtcbiAgICAgICAgICAgIFwiZmlsZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItZmlsZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gU1ZHIGZpbGUgdGhhdCB0aGlzIG1hcmtlciBzaG93cyBhdCBlYWNoIHBsYWNlbWVudC4gSWYgbm8gZmlsZSBpcyBnaXZlbiwgdGhlIG1hcmtlciB3aWxsIHNob3cgYW4gZWxsaXBzZS5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkFuIGVsbGlwc2Ugb3IgY2lyY2xlLCBpZiB3aWR0aCBlcXVhbHMgaGVpZ2h0XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidXJpXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBvdmVyYWxsIG9wYWNpdHkgb2YgdGhlIG1hcmtlciwgaWYgc2V0LCBvdmVycmlkZXMgYm90aCB0aGUgb3BhY2l0eSBvZiBib3RoIHRoZSBmaWxsIGFuZCBzdHJva2VcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIlRoZSBzdHJva2Utb3BhY2l0eSBhbmQgZmlsbC1vcGFjaXR5IHdpbGwgYmUgdXNlZFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZpbGwtb3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItZmlsbC1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgZmlsbCBvcGFjaXR5IG9mIHRoZSBtYXJrZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm9wYXF1ZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInN0cm9rZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItbGluZS1jb2xvclwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIGNvbG9yIG9mIHRoZSBzdHJva2UgYXJvdW5kIGEgbWFya2VyIHNoYXBlLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImJsYWNrXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic3Ryb2tlLXdpZHRoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1saW5lLXdpZHRoXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgd2lkdGggb2YgdGhlIHN0cm9rZSBhcm91bmQgYSBtYXJrZXIgc2hhcGUsIGluIHBpeGVscy4gVGhpcyBpcyBwb3NpdGlvbmVkIG9uIHRoZSBib3VuZGFyeSwgc28gaGlnaCB2YWx1ZXMgY2FuIGNvdmVyIHRoZSBhcmVhIGl0c2VsZi5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzdHJva2Utb3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItbGluZS1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJvcGFxdWVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBvcGFjaXR5IG9mIGEgbGluZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInBsYWNlbWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItcGxhY2VtZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJwb2ludFwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnRlcmlvclwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJwb2ludFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiUGxhY2UgbWFya2VycyBhdCB0aGUgY2VudGVyIHBvaW50IChjZW50cm9pZCkgb2YgdGhlIGdlb21ldHJ5XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBdHRlbXB0IHRvIHBsYWNlIG1hcmtlcnMgb24gYSBwb2ludCwgaW4gdGhlIGNlbnRlciBvZiBhIHBvbHlnb24sIG9yIGlmIG1hcmtlcnMtcGxhY2VtZW50OmxpbmUsIHRoZW4gbXVsdGlwbGUgdGltZXMgYWxvbmcgYSBsaW5lLiAnaW50ZXJpb3InIHBsYWNlbWVudCBjYW4gYmUgdXNlZCB0byBlbnN1cmUgdGhhdCBwb2ludHMgcGxhY2VkIG9uIHBvbHlnb25zIGFyZSBmb3JjZWQgdG8gYmUgaW5zaWRlIHRoZSBwb2x5Z29uIGludGVyaW9yXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm11bHRpLXBvbGljeVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItbXVsdGktcG9saWN5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJlYWNoXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2hvbGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJsYXJnZXN0XCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImVhY2hcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIklmIGEgZmVhdHVyZSBjb250YWlucyBtdWx0aXBsZSBnZW9tZXRyaWVzIGFuZCB0aGUgcGxhY2VtZW50IHR5cGUgaXMgZWl0aGVyIHBvaW50IG9yIGludGVyaW9yIHRoZW4gYSBtYXJrZXIgd2lsbCBiZSByZW5kZXJlZCBmb3IgZWFjaFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSBzcGVjaWFsIHNldHRpbmcgdG8gYWxsb3cgdGhlIHVzZXIgdG8gY29udHJvbCByZW5kZXJpbmcgYmVoYXZpb3IgZm9yICdtdWx0aS1nZW9tZXRyaWVzJyAod2hlbiBhIGZlYXR1cmUgY29udGFpbnMgbXVsdGlwbGUgZ2VvbWV0cmllcykuIFRoaXMgc2V0dGluZyBkb2VzIG5vdCBhcHBseSB0byBtYXJrZXJzIHBsYWNlZCBhbG9uZyBsaW5lcy4gVGhlICdlYWNoJyBwb2xpY3kgaXMgZGVmYXVsdCBhbmQgbWVhbnMgYWxsIGdlb21ldHJpZXMgd2lsbCBnZXQgYSBtYXJrZXIuIFRoZSAnd2hvbGUnIHBvbGljeSBtZWFucyB0aGF0IHRoZSBhZ2dyZWdhdGUgY2VudHJvaWQgYmV0d2VlbiBhbGwgZ2VvbWV0cmllcyB3aWxsIGJlIHVzZWQuIFRoZSAnbGFyZ2VzdCcgcG9saWN5IG1lYW5zIHRoYXQgb25seSB0aGUgbGFyZ2VzdCAoYnkgYm91bmRpbmcgYm94IGFyZWFzKSBmZWF0dXJlIHdpbGwgZ2V0IGEgcmVuZGVyZWQgbWFya2VyICh0aGlzIGlzIGhvdyB0ZXh0IGxhYmVsaW5nIGJlaGF2ZXMgYnkgZGVmYXVsdCkuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1hcmtlci10eXBlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci10eXBlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJhcnJvd1wiLFxuICAgICAgICAgICAgICAgICAgICBcImVsbGlwc2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyZWN0YW5nbGVcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiZWxsaXBzZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIGRlZmF1bHQgbWFya2VyLXR5cGUuIElmIGEgU1ZHIGZpbGUgaXMgbm90IGdpdmVuIGFzIHRoZSBtYXJrZXItZmlsZSBwYXJhbWV0ZXIsIHRoZSByZW5kZXJlciBwcm92aWRlcyBlaXRoZXIgYW4gYXJyb3cgb3IgYW4gZWxsaXBzZSAoYSBjaXJjbGUgaWYgaGVpZ2h0IGlzIGVxdWFsIHRvIHdpZHRoKVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ3aWR0aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItd2lkdGhcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMTAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgd2lkdGggb2YgdGhlIG1hcmtlciwgaWYgdXNpbmcgb25lIG9mIHRoZSBkZWZhdWx0IHR5cGVzLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImV4cHJlc3Npb25cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaGVpZ2h0XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1oZWlnaHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMTAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgaGVpZ2h0IG9mIHRoZSBtYXJrZXIsIGlmIHVzaW5nIG9uZSBvZiB0aGUgZGVmYXVsdCB0eXBlcy5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJleHByZXNzaW9uXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZpbGxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLWZpbGxcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJibHVlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgY29sb3Igb2YgdGhlIGFyZWEgb2YgdGhlIG1hcmtlci5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJhbGxvdy1vdmVybGFwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1hbGxvdy1vdmVybGFwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbnRyb2wgd2hldGhlciBvdmVybGFwcGluZyBtYXJrZXJzIGFyZSBzaG93biBvciBoaWRkZW4uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJEbyBub3QgYWxsb3cgbWFrZXJzIHRvIG92ZXJsYXAgd2l0aCBlYWNoIG90aGVyIC0gb3ZlcmxhcHBpbmcgbWFya2VycyB3aWxsIG5vdCBiZSBzaG93bi5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaWdub3JlLXBsYWNlbWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItaWdub3JlLXBsYWNlbWVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJkbyBub3Qgc3RvcmUgdGhlIGJib3ggb2YgdGhpcyBnZW9tZXRyeSBpbiB0aGUgY29sbGlzaW9uIGRldGVjdG9yIGNhY2hlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJ2YWx1ZSB0byBjb250cm9sIHdoZXRoZXIgdGhlIHBsYWNlbWVudCBvZiB0aGUgZmVhdHVyZSB3aWxsIHByZXZlbnQgdGhlIHBsYWNlbWVudCBvZiBvdGhlciBmZWF0dXJlc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzcGFjaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1zcGFjaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTcGFjZSBiZXR3ZWVuIHJlcGVhdGVkIGxhYmVsc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxMDAsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWF4LWVycm9yXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1tYXgtZXJyb3JcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLjIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgbWF4aW11bSBkaWZmZXJlbmNlIGJldHdlZW4gYWN0dWFsIG1hcmtlciBwbGFjZW1lbnQgYW5kIHRoZSBtYXJrZXItc3BhY2luZyBwYXJhbWV0ZXIuIFNldHRpbmcgYSBoaWdoIHZhbHVlIGNhbiBhbGxvdyB0aGUgcmVuZGVyZXIgdG8gdHJ5IHRvIHJlc29sdmUgcGxhY2VtZW50IGNvbmZsaWN0cyB3aXRoIG90aGVyIHN5bWJvbGl6ZXJzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibWFya2VyLXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgW1wibWF0cml4XCIsIDZdLFxuICAgICAgICAgICAgICAgICAgICBbXCJ0cmFuc2xhdGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNjYWxlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyb3RhdGVcIiwgM10sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdYXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WVwiLCAxXVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyB0cmFuc2Zvcm1hdGlvblwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU1ZHIHRyYW5zZm9ybWF0aW9uIGRlZmluaXRpb25cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY2xpcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItY2xpcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgYmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJlZm9yZSByZW5kZXJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcImdlb21ldHJpZXMgYXJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBieSBkZWZhdWx0IGZvciBiZXN0IHJlbmRlcmluZyBwZXJmb3JtYW5jZS4gSW4gc29tZSBjYXNlcyB1c2VycyBtYXkgd2lzaCB0byBkaXNhYmxlIHRoaXMgdG8gYXZvaWQgcmVuZGVyaW5nIGFydGlmYWN0cy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic21vb3RoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcIm1hcmtlci1zbW9vdGhcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwibm8gc21vb3RoaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJyYW5nZVwiOiBcIjAtMVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU21vb3RocyBvdXQgZ2VvbWV0cnkgYW5nbGVzLiAwIGlzIG5vIHNtb290aGluZywgMSBpcyBmdWxseSBzbW9vdGhlZC4gVmFsdWVzIGdyZWF0ZXIgdGhhbiAxIHdpbGwgcHJvZHVjZSB3aWxkLCBsb29waW5nIGdlb21ldHJpZXMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImdlb21ldHJ5LXRyYW5zZm9ybVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItZ2VvbWV0cnktdHJhbnNmb3JtXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZnVuY3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBub3QgYmUgdHJhbnNmb3JtZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkFsbG93cyB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbnMgdG8gYmUgYXBwbGllZCB0byB0aGUgZ2VvbWV0cnkuXCIsXG4gICAgICAgICAgICAgICAgXCJmdW5jdGlvbnNcIjogW1xuICAgICAgICAgICAgICAgICAgICBbXCJtYXRyaXhcIiwgNl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInRyYW5zbGF0ZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2NhbGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInJvdGF0ZVwiLCAzXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1hcIiwgMV0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdZXCIsIDFdXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJtYXJrZXItY29tcC1vcFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJhZGQgdGhlIGN1cnJlbnQgc3ltYm9saXplciBvbiB0b3Agb2Ygb3RoZXIgc3ltYm9saXplclwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29tcG9zaXRlIG9wZXJhdGlvbi4gVGhpcyBkZWZpbmVzIGhvdyB0aGlzIHN5bWJvbGl6ZXIgc2hvdWxkIGJlaGF2ZSByZWxhdGl2ZSB0byBzeW1ib2xpemVycyBhdG9wIG9yIGJlbG93IGl0LlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXCJjbGVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyY1wiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtaW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4b3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwbHVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWludXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtdWx0aXBseVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNjcmVlblwiLFxuICAgICAgICAgICAgICAgICAgICBcIm92ZXJsYXlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkYXJrZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJsaWdodGVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItZG9kZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1idXJuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGFyZC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcInNvZnQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkaWZmZXJlbmNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZXhjbHVzaW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29udHJhc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnZlcnQtcmdiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tbWVyZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1leHRyYWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaHVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2F0dXJhdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIlxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJzaGllbGRcIjoge1xuICAgICAgICAgICAgXCJuYW1lXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1uYW1lXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICAgIFwic2VyaWFsaXphdGlvblwiOiBcImNvbnRlbnRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlZhbHVlIHRvIHVzZSBmb3IgYSBzaGllbGRcXFwicyB0ZXh0IGxhYmVsLiBEYXRhIGNvbHVtbnMgYXJlIHNwZWNpZmllZCB1c2luZyBicmFja2V0cyBsaWtlIFtjb2x1bW5fbmFtZV1cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZmlsZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtZmlsZVwiLFxuICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJJbWFnZSBmaWxlIHRvIHJlbmRlciBiZWhpbmQgdGhlIHNoaWVsZCB0ZXh0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZhY2UtbmFtZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtZmFjZS1uYW1lXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJ2YWxpZGF0ZVwiOiBcImZvbnRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkZvbnQgbmFtZSBhbmQgc3R5bGUgdG8gdXNlIGZvciB0aGUgc2hpZWxkIHRleHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInVubG9jay1pbWFnZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtdW5sb2NrLWltYWdlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhpcyBwYXJhbWV0ZXIgc2hvdWxkIGJlIHNldCB0byB0cnVlIGlmIHlvdSBhcmUgdHJ5aW5nIHRvIHBvc2l0aW9uIHRleHQgYmVzaWRlIHJhdGhlciB0aGFuIG9uIHRvcCBvZiB0aGUgc2hpZWxkIGltYWdlXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidGV4dCBhbGlnbm1lbnQgcmVsYXRpdmUgdG8gdGhlIHNoaWVsZCBpbWFnZSB1c2VzIHRoZSBjZW50ZXIgb2YgdGhlIGltYWdlIGFzIHRoZSBhbmNob3IgZm9yIHRleHQgcG9zaXRpb25pbmcuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInNpemVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXNpemVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHNpemUgb2YgdGhlIHNoaWVsZCB0ZXh0IGluIHBpeGVsc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWxsXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1maWxsXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBjb2xvciBvZiB0aGUgc2hpZWxkIHRleHRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGxhY2VtZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1wbGFjZW1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcInBvaW50XCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGluZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInZlcnRleFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludGVyaW9yXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInBvaW50XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJIb3cgdGhpcyBzaGllbGQgc2hvdWxkIGJlIHBsYWNlZC4gUG9pbnQgcGxhY2VtZW50IGF0dGVtcHRzIHRvIHBsYWNlIGl0IG9uIHRvcCBvZiBwb2ludHMsIGxpbmUgcGxhY2VzIGFsb25nIGxpbmVzIG11bHRpcGxlIHRpbWVzIHBlciBmZWF0dXJlLCB2ZXJ0ZXggcGxhY2VzIG9uIHRoZSB2ZXJ0ZXhlcyBvZiBwb2x5Z29ucywgYW5kIGludGVyaW9yIGF0dGVtcHRzIHRvIHBsYWNlIGluc2lkZSBvZiBwb2x5Z29ucy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYXZvaWQtZWRnZXNcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWF2b2lkLWVkZ2VzXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUZWxsIHBvc2l0aW9uaW5nIGFsZ29yaXRobSB0byBhdm9pZCBsYWJlbGluZyBuZWFyIGludGVyc2VjdGlvbiBlZGdlcy5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJhbGxvdy1vdmVybGFwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1hbGxvdy1vdmVybGFwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbnRyb2wgd2hldGhlciBvdmVybGFwcGluZyBzaGllbGRzIGFyZSBzaG93biBvciBoaWRkZW4uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJEbyBub3QgYWxsb3cgc2hpZWxkcyB0byBvdmVybGFwIHdpdGggb3RoZXIgbWFwIGVsZW1lbnRzIGFscmVhZHkgcGxhY2VkLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtaW5pbXVtLWRpc3RhbmNlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1taW4tZGlzdGFuY2VcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTWluaW11bSBkaXN0YW5jZSB0byB0aGUgbmV4dCBzaGllbGQgc3ltYm9sLCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgc2hpZWxkLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzcGFjaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1zcGFjaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBzcGFjaW5nIGJldHdlZW4gcmVwZWF0ZWQgb2NjdXJyZW5jZXMgb2YgdGhlIHNhbWUgc2hpZWxkIG9uIGEgbGluZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtaW5pbXVtLXBhZGRpbmdcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLW1pbi1wYWRkaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEZXRlcm1pbmVzIHRoZSBtaW5pbXVtIGFtb3VudCBvZiBwYWRkaW5nIHRoYXQgYSBzaGllbGQgZ2V0cyByZWxhdGl2ZSB0byBvdGhlciBzaGllbGRzXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwid3JhcC13aWR0aFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtd3JhcC13aWR0aFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJMZW5ndGggb2YgYSBjaHVuayBvZiB0ZXh0IGluIGNoYXJhY3RlcnMgYmVmb3JlIHdyYXBwaW5nIHRleHRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwid3JhcC1iZWZvcmVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXdyYXAtYmVmb3JlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIldyYXAgdGV4dCBiZWZvcmUgd3JhcC13aWR0aCBpcyByZWFjaGVkLiBJZiBmYWxzZSwgd3JhcHBlZCBsaW5lcyB3aWxsIGJlIGEgYml0IGxvbmdlciB0aGFuIHdyYXAtd2lkdGguXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIndyYXAtY2hhcmFjdGVyXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC13cmFwLWNoYXJhY3RlclwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIiBcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlVzZSB0aGlzIGNoYXJhY3RlciBpbnN0ZWFkIG9mIGEgc3BhY2UgdG8gd3JhcCBsb25nIG5hbWVzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoYWxvLWZpbGxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWhhbG8tZmlsbFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiI0ZGRkZGRlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwid2hpdGVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNwZWNpZmllcyB0aGUgY29sb3Igb2YgdGhlIGhhbG8gYXJvdW5kIHRoZSB0ZXh0LlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoYWxvLXJhZGl1c1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtaGFsby1yYWRpdXNcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNwZWNpZnkgdGhlIHJhZGl1cyBvZiB0aGUgaGFsbyBpbiBwaXhlbHNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIGhhbG9cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjaGFyYWN0ZXItc3BhY2luZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtY2hhcmFjdGVyLXNwYWNpbmdcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1bnNpZ25lZFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiSG9yaXpvbnRhbCBzcGFjaW5nIGJldHdlZW4gY2hhcmFjdGVycyAoaW4gcGl4ZWxzKS4gQ3VycmVudGx5IHdvcmtzIGZvciBwb2ludCBwbGFjZW1lbnQgb25seSwgbm90IGxpbmUgcGxhY2VtZW50LlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJsaW5lLXNwYWNpbmdcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWxpbmUtc3BhY2luZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVmVydGljYWwgc3BhY2luZyBiZXR3ZWVuIGxpbmVzIG9mIG11bHRpbGluZSBsYWJlbHMgKGluIHBpeGVscylcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1bnNpZ25lZFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJkeFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtdGV4dC1keFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEaXNwbGFjZSB0ZXh0IHdpdGhpbiBzaGllbGQgYnkgZml4ZWQgYW1vdW50LCBpbiBwaXhlbHMsICsvLSBhbG9uZyB0aGUgWCBheGlzLiAgQSBwb3NpdGl2ZSB2YWx1ZSB3aWxsIHNoaWZ0IHRoZSB0ZXh0IHJpZ2h0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC10ZXh0LWR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRpc3BsYWNlIHRleHQgd2l0aGluIHNoaWVsZCBieSBmaXhlZCBhbW91bnQsIGluIHBpeGVscywgKy8tIGFsb25nIHRoZSBZIGF4aXMuICBBIHBvc2l0aXZlIHZhbHVlIHdpbGwgc2hpZnQgdGhlIHRleHQgZG93blwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzaGllbGQtZHhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWR4XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRpc3BsYWNlIHNoaWVsZCBieSBmaXhlZCBhbW91bnQsIGluIHBpeGVscywgKy8tIGFsb25nIHRoZSBYIGF4aXMuICBBIHBvc2l0aXZlIHZhbHVlIHdpbGwgc2hpZnQgdGhlIHRleHQgcmlnaHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2hpZWxkLWR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1keVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEaXNwbGFjZSBzaGllbGQgYnkgZml4ZWQgYW1vdW50LCBpbiBwaXhlbHMsICsvLSBhbG9uZyB0aGUgWSBheGlzLiAgQSBwb3NpdGl2ZSB2YWx1ZSB3aWxsIHNoaWZ0IHRoZSB0ZXh0IGRvd25cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJzaGllbGQtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCIoRGVmYXVsdCAxLjApIC0gb3BhY2l0eSBvZiB0aGUgaW1hZ2UgdXNlZCBmb3IgdGhlIHNoaWVsZFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0ZXh0LW9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXRleHQtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCIoRGVmYXVsdCAxLjApIC0gb3BhY2l0eSBvZiB0aGUgdGV4dCBwbGFjZWQgb24gdG9wIG9mIHRoZSBzaGllbGRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaG9yaXpvbnRhbC1hbGlnbm1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWhvcml6b250YWwtYWxpZ25tZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWlkZGxlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdXRvXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVGhlIHNoaWVsZCdzIGhvcml6b250YWwgYWxpZ25tZW50IGZyb20gaXRzIGNlbnRlcnBvaW50XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYXV0b1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ2ZXJ0aWNhbC1hbGlnbm1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXZlcnRpY2FsLWFsaWdubWVudFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwidG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWlkZGxlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYm90dG9tXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXV0b1wiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBzaGllbGQncyB2ZXJ0aWNhbCBhbGlnbm1lbnQgZnJvbSBpdHMgY2VudGVycG9pbnRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJtaWRkbGVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidGV4dC10cmFuc2Zvcm1cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLXRleHQtdHJhbnNmb3JtXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJub25lXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidXBwZXJjYXNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibG93ZXJjYXNlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY2FwaXRhbGl6ZVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRyYW5zZm9ybSB0aGUgY2FzZSBvZiB0aGUgY2hhcmFjdGVyc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5vbmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwianVzdGlmeS1hbGlnbm1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwic2hpZWxkLWp1c3RpZnktYWxpZ25tZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdXRvXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGVmaW5lIGhvdyB0ZXh0IGluIGEgc2hpZWxkJ3MgbGFiZWwgaXMganVzdGlmaWVkXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYXV0b1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1jbGlwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBiZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYmVmb3JlIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiZ2VvbWV0cmllcyBhcmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJ5IGRlZmF1bHQgZm9yIGJlc3QgcmVuZGVyaW5nIHBlcmZvcm1hbmNlLiBJbiBzb21lIGNhc2VzIHVzZXJzIG1heSB3aXNoIHRvIGRpc2FibGUgdGhpcyB0byBhdm9pZCByZW5kZXJpbmcgYXJ0aWZhY3RzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInNoaWVsZC1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImxpbmUtcGF0dGVyblwiOiB7XG4gICAgICAgICAgICBcImZpbGVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1wYXR0ZXJuLWZpbGVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW4gaW1hZ2UgZmlsZSB0byBiZSByZXBlYXRlZCBhbmQgd2FycGVkIGFsb25nIGEgbGluZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtcGF0dGVybi1jbGlwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBiZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYmVmb3JlIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiZ2VvbWV0cmllcyBhcmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJ5IGRlZmF1bHQgZm9yIGJlc3QgcmVuZGVyaW5nIHBlcmZvcm1hbmNlLiBJbiBzb21lIGNhc2VzIHVzZXJzIG1heSB3aXNoIHRvIGRpc2FibGUgdGhpcyB0byBhdm9pZCByZW5kZXJpbmcgYXJ0aWZhY3RzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzbW9vdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwibGluZS1wYXR0ZXJuLXNtb290aFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBzbW9vdGhpbmdcIixcbiAgICAgICAgICAgICAgICBcInJhbmdlXCI6IFwiMC0xXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTbW9vdGhzIG91dCBnZW9tZXRyeSBhbmdsZXMuIDAgaXMgbm8gc21vb3RoaW5nLCAxIGlzIGZ1bGx5IHNtb290aGVkLiBWYWx1ZXMgZ3JlYXRlciB0aGFuIDEgd2lsbCBwcm9kdWNlIHdpbGQsIGxvb3BpbmcgZ2VvbWV0cmllcy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2VvbWV0cnktdHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtcGF0dGVybi1nZW9tZXRyeS10cmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmdW5jdGlvbnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIG5vdCBiZSB0cmFuc2Zvcm1lZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQWxsb3dzIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBnZW9tZXRyeS5cIixcbiAgICAgICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcIm1hdHJpeFwiLCA2XSxcbiAgICAgICAgICAgICAgICAgICAgW1widHJhbnNsYXRlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzY2FsZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicm90YXRlXCIsIDNdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WFwiLCAxXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1lcIiwgMV1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImxpbmUtcGF0dGVybi1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBvbHlnb24tcGF0dGVyblwiOiB7XG4gICAgICAgICAgICBcImZpbGVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLWZpbGVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1cmlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiSW1hZ2UgdG8gdXNlIGFzIGEgcmVwZWF0ZWQgcGF0dGVybiBmaWxsIHdpdGhpbiBhIHBvbHlnb25cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYWxpZ25tZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1hbGlnbm1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImxvY2FsXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ2xvYmFsXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImxvY2FsXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTcGVjaWZ5IHdoZXRoZXIgdG8gYWxpZ24gcGF0dGVybiBmaWxscyB0byB0aGUgbGF5ZXIgb3IgdG8gdGhlIG1hcC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2FtbWFcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLWdhbW1hXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImZ1bGx5IGFudGlhbGlhc2VkXCIsXG4gICAgICAgICAgICAgICAgXCJyYW5nZVwiOiBcIjAtMVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiTGV2ZWwgb2YgYW50aWFsaWFzaW5nIG9mIHBvbHlnb24gcGF0dGVybiBlZGdlc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIihEZWZhdWx0IDEuMCkgLSBBcHBseSBhbiBvcGFjaXR5IGxldmVsIHRvIHRoZSBpbWFnZSB1c2VkIGZvciB0aGUgcGF0dGVyblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiVGhlIGltYWdlIGlzIHJlbmRlcmVkIHdpdGhvdXQgbW9kaWZpY2F0aW9uc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1jbGlwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiZ2VvbWV0cnkgd2lsbCBiZSBjbGlwcGVkIHRvIG1hcCBib3VuZHMgYmVmb3JlIHJlbmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiZ2VvbWV0cmllcyBhcmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJ5IGRlZmF1bHQgZm9yIGJlc3QgcmVuZGVyaW5nIHBlcmZvcm1hbmNlLiBJbiBzb21lIGNhc2VzIHVzZXJzIG1heSB3aXNoIHRvIGRpc2FibGUgdGhpcyB0byBhdm9pZCByZW5kZXJpbmcgYXJ0aWZhY3RzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzbW9vdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9seWdvbi1wYXR0ZXJuLXNtb290aFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJubyBzbW9vdGhpbmdcIixcbiAgICAgICAgICAgICAgICBcInJhbmdlXCI6IFwiMC0xXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTbW9vdGhzIG91dCBnZW9tZXRyeSBhbmdsZXMuIDAgaXMgbm8gc21vb3RoaW5nLCAxIGlzIGZ1bGx5IHNtb290aGVkLiBWYWx1ZXMgZ3JlYXRlciB0aGFuIDEgd2lsbCBwcm9kdWNlIHdpbGQsIGxvb3BpbmcgZ2VvbWV0cmllcy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZ2VvbWV0cnktdHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1nZW9tZXRyeS10cmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmdW5jdGlvbnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJnZW9tZXRyeSB3aWxsIG5vdCBiZSB0cmFuc2Zvcm1lZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQWxsb3dzIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBnZW9tZXRyeS5cIixcbiAgICAgICAgICAgICAgICBcImZ1bmN0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcIm1hdHJpeFwiLCA2XSxcbiAgICAgICAgICAgICAgICAgICAgW1widHJhbnNsYXRlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJzY2FsZVwiLCAyXSxcbiAgICAgICAgICAgICAgICAgICAgW1wicm90YXRlXCIsIDNdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WFwiLCAxXSxcbiAgICAgICAgICAgICAgICAgICAgW1wic2tld1lcIiwgMV1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvbHlnb24tcGF0dGVybi1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInJhc3RlclwiOiB7XG4gICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicmFzdGVyLW9wYWNpdHlcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm9wYXF1ZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgb3BhY2l0eSBvZiB0aGUgcmFzdGVyIHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJzLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWx0ZXItZmFjdG9yXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInJhc3Rlci1maWx0ZXItZmFjdG9yXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IC0xLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiQWxsb3cgdGhlIGRhdGFzb3VyY2UgdG8gY2hvb3NlIGFwcHJvcHJpYXRlIGRvd25zY2FsaW5nLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGlzIGlzIHVzZWQgYnkgdGhlIFJhc3RlciBvciBHZGFsIGRhdGFzb3VyY2VzIHRvIHByZS1kb3duc2NhbGUgaW1hZ2VzIHVzaW5nIG92ZXJ2aWV3cy4gSGlnaGVyIG51bWJlcnMgY2FuIHNvbWV0aW1lcyBjYXVzZSBtdWNoIGJldHRlciBzY2FsZWQgaW1hZ2Ugb3V0cHV0LCBhdCB0aGUgY29zdCBvZiBzcGVlZC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2NhbGluZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJyYXN0ZXItc2NhbGluZ1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwibmVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcImZhc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJiaWxpbmVhclwiLFxuICAgICAgICAgICAgICAgICAgICBcImJpbGluZWFyOFwiLFxuICAgICAgICAgICAgICAgICAgICBcImJpY3ViaWNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcGxpbmUxNlwiLFxuICAgICAgICAgICAgICAgICAgICBcInNwbGluZTM2XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGFubmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICBcImhhbW1pbmdcIixcbiAgICAgICAgICAgICAgICAgICAgXCJoZXJtaXRlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwia2Fpc2VyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicXVhZHJpY1wiLFxuICAgICAgICAgICAgICAgICAgICBcImNhdHJvbVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdhdXNzaWFuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYmVzc2VsXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibWl0Y2hlbGxcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzaW5jXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGFuY3pvc1wiLFxuICAgICAgICAgICAgICAgICAgICBcImJsYWNrbWFuXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIm5lYXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBzY2FsaW5nIGFsZ29yaXRobSB1c2VkIHRvIG1ha2luZyBkaWZmZXJlbnQgcmVzb2x1dGlvbiB2ZXJzaW9ucyBvZiB0aGlzIHJhc3RlciBsYXllci4gQmlsaW5lYXIgaXMgYSBnb29kIGNvbXByb21pc2UgYmV0d2VlbiBzcGVlZCBhbmQgYWNjdXJhY3ksIHdoaWxlIGxhbmN6b3MgZ2l2ZXMgdGhlIGhpZ2hlc3QgcXVhbGl0eS5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWVzaC1zaXplXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInJhc3Rlci1tZXNoLXNpemVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMTYsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJSZXByb2plY3Rpb24gbWVzaCB3aWxsIGJlIDEvMTYgb2YgdGhlIHJlc29sdXRpb24gb2YgdGhlIHNvdXJjZSBpbWFnZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJBIHJlZHVjZWQgcmVzb2x1dGlvbiBtZXNoIGlzIHVzZWQgZm9yIHJhc3RlciByZXByb2plY3Rpb24sIGFuZCB0aGUgdG90YWwgaW1hZ2Ugc2l6ZSBpcyBkaXZpZGVkIGJ5IHRoZSBtZXNoLXNpemUgdG8gZGV0ZXJtaW5lIHRoZSBxdWFsaXR5IG9mIHRoYXQgbWVzaC4gVmFsdWVzIGZvciBtZXNoLXNpemUgbGFyZ2VyIHRoYW4gdGhlIGRlZmF1bHQgd2lsbCByZXN1bHQgaW4gZmFzdGVyIHJlcHJvamVjdGlvbiBidXQgbWlnaHQgbGVhZCB0byBkaXN0b3J0aW9uLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjb21wLW9wXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInJhc3Rlci1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBvaW50XCI6IHtcbiAgICAgICAgICAgIFwiZmlsZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2ludC1maWxlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidXJpXCIsXG4gICAgICAgICAgICAgICAgXCJyZXF1aXJlZFwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJJbWFnZSBmaWxlIHRvIHJlcHJlc2VudCBhIHBvaW50XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImFsbG93LW92ZXJsYXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9pbnQtYWxsb3ctb3ZlcmxhcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb250cm9sIHdoZXRoZXIgb3ZlcmxhcHBpbmcgcG9pbnRzIGFyZSBzaG93biBvciBoaWRkZW4uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJEbyBub3QgYWxsb3cgcG9pbnRzIHRvIG92ZXJsYXAgd2l0aCBlYWNoIG90aGVyIC0gb3ZlcmxhcHBpbmcgbWFya2VycyB3aWxsIG5vdCBiZSBzaG93bi5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaWdub3JlLXBsYWNlbWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2ludC1pZ25vcmUtcGxhY2VtZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImRvIG5vdCBzdG9yZSB0aGUgYmJveCBvZiB0aGlzIGdlb21ldHJ5IGluIHRoZSBjb2xsaXNpb24gZGV0ZWN0b3IgY2FjaGVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcInZhbHVlIHRvIGNvbnRyb2wgd2hldGhlciB0aGUgcGxhY2VtZW50IG9mIHRoZSBmZWF0dXJlIHdpbGwgcHJldmVudCB0aGUgcGxhY2VtZW50IG9mIG90aGVyIGZlYXR1cmVzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9pbnQtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZsb2F0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDEuMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkZ1bGx5IG9wYXF1ZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSB2YWx1ZSBmcm9tIDAgdG8gMSB0byBjb250cm9sIHRoZSBvcGFjaXR5IG9mIHRoZSBwb2ludFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwbGFjZW1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwicG9pbnQtcGxhY2VtZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJjZW50cm9pZFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludGVyaW9yXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiSG93IHRoaXMgcG9pbnQgc2hvdWxkIGJlIHBsYWNlZC4gQ2VudHJvaWQgY2FsY3VsYXRlcyB0aGUgZ2VvbWV0cmljIGNlbnRlciBvZiBhIHBvbHlnb24sIHdoaWNoIGNhbiBiZSBvdXRzaWRlIG9mIGl0LCB3aGlsZSBpbnRlcmlvciBhbHdheXMgcGxhY2VzIGluc2lkZSBvZiBhIHBvbHlnb24uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiY2VudHJvaWRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidHJhbnNmb3JtXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInBvaW50LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZ1bmN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgW1wibWF0cml4XCIsIDZdLFxuICAgICAgICAgICAgICAgICAgICBbXCJ0cmFuc2xhdGVcIiwgMl0sXG4gICAgICAgICAgICAgICAgICAgIFtcInNjYWxlXCIsIDJdLFxuICAgICAgICAgICAgICAgICAgICBbXCJyb3RhdGVcIiwgM10sXG4gICAgICAgICAgICAgICAgICAgIFtcInNrZXdYXCIsIDFdLFxuICAgICAgICAgICAgICAgICAgICBbXCJza2V3WVwiLCAxXVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJObyB0cmFuc2Zvcm1hdGlvblwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU1ZHIHRyYW5zZm9ybWF0aW9uIGRlZmluaXRpb25cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJwb2ludC1jb21wLW9wXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImFkZCB0aGUgY3VycmVudCBzeW1ib2xpemVyIG9uIHRvcCBvZiBvdGhlciBzeW1ib2xpemVyXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJDb21wb3NpdGUgb3BlcmF0aW9uLiBUaGlzIGRlZmluZXMgaG93IHRoaXMgc3ltYm9saXplciBzaG91bGQgYmVoYXZlIHJlbGF0aXZlIHRvIHN5bWJvbGl6ZXJzIGF0b3Agb3IgYmVsb3cgaXQuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcImNsZWFyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1pblwiLFxuICAgICAgICAgICAgICAgICAgICBcInNyYy1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3Qtb3V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWF0b3BcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3QtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInBsdXNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaW51c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm11bHRpcGx5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwib3ZlcmxheVwiLFxuICAgICAgICAgICAgICAgICAgICBcImRhcmtlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpZ2h0ZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvci1kb2RnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWJ1cm5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJoYXJkLWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic29mdC1saWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRpZmZlcmVuY2VcIixcbiAgICAgICAgICAgICAgICAgICAgXCJleGNsdXNpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb250cmFzdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydFwiLFxuICAgICAgICAgICAgICAgICAgICBcImludmVydC1yZ2JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJncmFpbi1tZXJnZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLWV4dHJhY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJodWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzYXR1cmF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInRleHRcIjoge1xuICAgICAgICAgICAgXCJuYW1lXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtbmFtZVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImV4cHJlc3Npb25cIixcbiAgICAgICAgICAgICAgICBcInJlcXVpcmVkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJzZXJpYWxpemF0aW9uXCI6IFwiY29udGVudFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiVmFsdWUgdG8gdXNlIGZvciBhIHRleHQgbGFiZWwuIERhdGEgY29sdW1ucyBhcmUgc3BlY2lmaWVkIHVzaW5nIGJyYWNrZXRzIGxpa2UgW2NvbHVtbl9uYW1lXVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmYWNlLW5hbWVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1mYWNlLW5hbWVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICBcInZhbGlkYXRlXCI6IFwiZm9udFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRm9udCBuYW1lIGFuZCBzdHlsZSB0byByZW5kZXIgYSBsYWJlbCBpblwiLFxuICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIjogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwic2l6ZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXNpemVcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxMCxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRleHQgc2l6ZSBpbiBwaXhlbHNcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidGV4dC1yYXRpb1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXJhdGlvXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEZWZpbmUgdGhlIGFtb3VudCBvZiB0ZXh0IChvZiB0aGUgdG90YWwpIHByZXNlbnQgb24gc3VjY2Vzc2l2ZSBsaW5lcyB3aGVuIHdyYXBwaW5nIG9jY3Vyc1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIndyYXAtd2lkdGhcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC13cmFwLXdpZHRoXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJMZW5ndGggb2YgYSBjaHVuayBvZiB0ZXh0IGluIGNoYXJhY3RlcnMgYmVmb3JlIHdyYXBwaW5nIHRleHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1bnNpZ25lZFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ3cmFwLWJlZm9yZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXdyYXAtYmVmb3JlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIldyYXAgdGV4dCBiZWZvcmUgd3JhcC13aWR0aCBpcyByZWFjaGVkLiBJZiBmYWxzZSwgd3JhcHBlZCBsaW5lcyB3aWxsIGJlIGEgYml0IGxvbmdlciB0aGFuIHdyYXAtd2lkdGguXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIndyYXAtY2hhcmFjdGVyXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtd3JhcC1jaGFyYWN0ZXJcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIgXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJVc2UgdGhpcyBjaGFyYWN0ZXIgaW5zdGVhZCBvZiBhIHNwYWNlIHRvIHdyYXAgbG9uZyB0ZXh0LlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzcGFjaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtc3BhY2luZ1wiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInVuc2lnbmVkXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJEaXN0YW5jZSBiZXR3ZWVuIHJlcGVhdGVkIHRleHQgbGFiZWxzIG9uIGEgbGluZSAoYWthLiBsYWJlbC1zcGFjaW5nKVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjaGFyYWN0ZXItc3BhY2luZ1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWNoYXJhY3Rlci1zcGFjaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkhvcml6b250YWwgc3BhY2luZyBhZGp1c3RtZW50IGJldHdlZW4gY2hhcmFjdGVycyBpbiBwaXhlbHNcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibGluZS1zcGFjaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtbGluZS1zcGFjaW5nXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwidW5zaWduZWRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlZlcnRpY2FsIHNwYWNpbmcgYWRqdXN0bWVudCBiZXR3ZWVuIGxpbmVzIGluIHBpeGVsc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJsYWJlbC1wb3NpdGlvbi10b2xlcmFuY2VcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1sYWJlbC1wb3NpdGlvbi10b2xlcmFuY2VcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJ1bnNpZ25lZFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQWxsb3dzIHRoZSBsYWJlbCB0byBiZSBkaXNwbGFjZWQgZnJvbSBpdHMgaWRlYWwgcG9zaXRpb24gYnkgYSBudW1iZXIgb2YgcGl4ZWxzIChvbmx5IHdvcmtzIHdpdGggcGxhY2VtZW50OmxpbmUpXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm1heC1jaGFyLWFuZ2xlLWRlbHRhXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtbWF4LWNoYXItYW5nbGUtZGVsdGFcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjIyLjVcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBtYXhpbXVtIGFuZ2xlIGNoYW5nZSwgaW4gZGVncmVlcywgYWxsb3dlZCBiZXR3ZWVuIGFkamFjZW50IGNoYXJhY3RlcnMgaW4gYSBsYWJlbC4gVGhpcyB2YWx1ZSBpbnRlcm5hbGx5IGlzIGNvbnZlcnRlZCB0byByYWRpYW5zIHRvIHRoZSBkZWZhdWx0IGlzIDIyLjUqbWF0aC5waS8xODAuMC4gVGhlIGhpZ2hlciB0aGUgdmFsdWUgdGhlIGZld2VyIGxhYmVscyB3aWxsIGJlIHBsYWNlZCBhcm91bmQgYXJvdW5kIHNoYXJwIGNvcm5lcnMuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZpbGxcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1maWxsXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJTcGVjaWZpZXMgdGhlIGNvbG9yIGZvciB0aGUgdGV4dFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIiMwMDAwMDBcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvcGFjaXR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtb3BhY2l0eVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSBudW1iZXIgZnJvbSAwIHRvIDEgc3BlY2lmeWluZyB0aGUgb3BhY2l0eSBmb3IgdGhlIHRleHRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMS4wLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiRnVsbHkgb3BhcXVlXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiaGFsby1maWxsXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtaGFsby1maWxsXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29sb3JcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIjRkZGRkZGXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiU3BlY2lmaWVzIHRoZSBjb2xvciBvZiB0aGUgaGFsbyBhcm91bmQgdGhlIHRleHQuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImhhbG8tcmFkaXVzXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtaGFsby1yYWRpdXNcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlNwZWNpZnkgdGhlIHJhZGl1cyBvZiB0aGUgaGFsbyBpbiBwaXhlbHNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIm5vIGhhbG9cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJkeFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWR4XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRpc3BsYWNlIHRleHQgYnkgZml4ZWQgYW1vdW50LCBpbiBwaXhlbHMsICsvLSBhbG9uZyB0aGUgWCBheGlzLiAgQSBwb3NpdGl2ZSB2YWx1ZSB3aWxsIHNoaWZ0IHRoZSB0ZXh0IHJpZ2h0XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImR5XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtZHlcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGlzcGxhY2UgdGV4dCBieSBmaXhlZCBhbW91bnQsIGluIHBpeGVscywgKy8tIGFsb25nIHRoZSBZIGF4aXMuICBBIHBvc2l0aXZlIHZhbHVlIHdpbGwgc2hpZnQgdGhlIHRleHQgZG93blwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ2ZXJ0aWNhbC1hbGlnbm1lbnRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC12ZXJ0aWNhbC1hbGlnbm1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgXCJ0b3BcIixcbiAgICAgICAgICAgICAgICAgIFwibWlkZGxlXCIsXG4gICAgICAgICAgICAgICAgICBcImJvdHRvbVwiLFxuICAgICAgICAgICAgICAgICAgXCJhdXRvXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiUG9zaXRpb24gb2YgbGFiZWwgcmVsYXRpdmUgdG8gcG9pbnQgcG9zaXRpb24uXCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYXV0b1wiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiRGVmYXVsdCBhZmZlY3RlZCBieSB2YWx1ZSBvZiBkeTsgXFxcImJvdHRvbVxcXCIgZm9yIGR5PjAsIFxcXCJ0b3BcXFwiIGZvciBkeTwwLlwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJhdm9pZC1lZGdlc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWF2b2lkLWVkZ2VzXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUZWxsIHBvc2l0aW9uaW5nIGFsZ29yaXRobSB0byBhdm9pZCBsYWJlbGluZyBuZWFyIGludGVyc2VjdGlvbiBlZGdlcy5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtaW5pbXVtLWRpc3RhbmNlXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtbWluLWRpc3RhbmNlXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJNaW5pbXVtIHBlcm1pdHRlZCBkaXN0YW5jZSB0byB0aGUgbmV4dCB0ZXh0IHN5bWJvbGl6ZXIuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibWluaW11bS1wYWRkaW5nXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtbWluLXBhZGRpbmdcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkRldGVybWluZXMgdGhlIG1pbmltdW0gYW1vdW50IG9mIHBhZGRpbmcgdGhhdCBhIHRleHQgc3ltYm9saXplciBnZXRzIHJlbGF0aXZlIHRvIG90aGVyIHRleHRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbG9hdFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtaW5pbXVtLXBhdGgtbGVuZ3RoXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtbWluLXBhdGgtbGVuZ3RoXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogMCxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInBsYWNlIGxhYmVscyBvbiBhbGwgcGF0aHNcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlBsYWNlIGxhYmVscyBvbmx5IG9uIHBhdGhzIGxvbmdlciB0aGFuIHRoaXMgdmFsdWUuXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImFsbG93LW92ZXJsYXBcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1hbGxvdy1vdmVybGFwXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbnRyb2wgd2hldGhlciBvdmVybGFwcGluZyB0ZXh0IGlzIHNob3duIG9yIGhpZGRlbi5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkRvIG5vdCBhbGxvdyB0ZXh0IHRvIG92ZXJsYXAgd2l0aCBvdGhlciB0ZXh0IC0gb3ZlcmxhcHBpbmcgbWFya2VycyB3aWxsIG5vdCBiZSBzaG93bi5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3JpZW50YXRpb25cIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1vcmllbnRhdGlvblwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImV4cHJlc3Npb25cIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlJvdGF0ZSB0aGUgdGV4dC5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGxhY2VtZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtcGxhY2VtZW50XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJwb2ludFwiLFxuICAgICAgICAgICAgICAgICAgICBcImxpbmVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2ZXJ0ZXhcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpbnRlcmlvclwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJwb2ludFwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiQ29udHJvbCB0aGUgc3R5bGUgb2YgcGxhY2VtZW50IG9mIGEgcG9pbnQgdmVyc3VzIHRoZSBnZW9tZXRyeSBpdCBpcyBhdHRhY2hlZCB0by5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGxhY2VtZW50LXR5cGVcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwidGV4dC1wbGFjZW1lbnQtdHlwZVwiLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiUmUtcG9zaXRpb24gYW5kL29yIHJlLXNpemUgdGV4dCB0byBhdm9pZCBvdmVybGFwcy4gXFxcInNpbXBsZVxcXCIgZm9yIGJhc2ljIGFsZ29yaXRobSAodXNpbmcgdGV4dC1wbGFjZW1lbnRzIHN0cmluZywpIFxcXCJkdW1teVxcXCIgdG8gdHVybiB0aGlzIGZlYXR1cmUgb2ZmLlwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiZHVtbXlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzaW1wbGVcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiZHVtbXlcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicGxhY2VtZW50c1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXBsYWNlbWVudHNcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIklmIFxcXCJwbGFjZW1lbnQtdHlwZVxcXCIgaXMgc2V0IHRvIFxcXCJzaW1wbGVcXFwiLCB1c2UgdGhpcyBcXFwiUE9TSVRJT05TLFtTSVpFU11cXFwiIHN0cmluZy4gQW4gZXhhbXBsZSBpcyBgdGV4dC1wbGFjZW1lbnRzOiBcXFwiRSxORSxTRSxXLE5XLFNXXFxcIjtgIFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0ZXh0LXRyYW5zZm9ybVwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LXRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwibm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInVwcGVyY2FzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImxvd2VyY2FzZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImNhcGl0YWxpemVcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUcmFuc2Zvcm0gdGhlIGNhc2Ugb2YgdGhlIGNoYXJhY3RlcnNcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJub25lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImhvcml6b250YWwtYWxpZ25tZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtaG9yaXpvbnRhbC1hbGlnbm1lbnRcIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1xuICAgICAgICAgICAgICAgICAgICBcImxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtaWRkbGVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyaWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImF1dG9cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgdGV4dCdzIGhvcml6b250YWwgYWxpZ25tZW50IGZyb20gaXRzIGNlbnRlcnBvaW50XCIsXG4gICAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwiYXV0b1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJqdXN0aWZ5LWFsaWdubWVudFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWFsaWduXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdXRvXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiZG9jXCI6IFwiRGVmaW5lIGhvdyB0ZXh0IGlzIGp1c3RpZmllZFwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImF1dG9cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcIkF1dG8gYWxpZ25tZW50IG1lYW5zIHRoYXQgdGV4dCB3aWxsIGJlIGNlbnRlcmVkIGJ5IGRlZmF1bHQgZXhjZXB0IHdoZW4gdXNpbmcgdGhlIGBwbGFjZW1lbnQtdHlwZWAgcGFyYW1ldGVyIC0gaW4gdGhhdCBjYXNlIGVpdGhlciByaWdodCBvciBsZWZ0IGp1c3RpZmljYXRpb24gd2lsbCBiZSB1c2VkIGF1dG9tYXRpY2FsbHkgZGVwZW5kaW5nIG9uIHdoZXJlIHRoZSB0ZXh0IGNvdWxkIGJlIGZpdCBnaXZlbiB0aGUgYHRleHQtcGxhY2VtZW50c2AgZGlyZWN0aXZlc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJjbGlwXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcInRleHQtY2xpcFwiLFxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcImdlb21ldHJ5IHdpbGwgYmUgY2xpcHBlZCB0byBtYXAgYm91bmRzIGJlZm9yZSByZW5kZXJpbmdcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcImdlb21ldHJpZXMgYXJlIGNsaXBwZWQgdG8gbWFwIGJvdW5kcyBieSBkZWZhdWx0IGZvciBiZXN0IHJlbmRlcmluZyBwZXJmb3JtYW5jZS4gSW4gc29tZSBjYXNlcyB1c2VycyBtYXkgd2lzaCB0byBkaXNhYmxlIHRoaXMgdG8gYXZvaWQgcmVuZGVyaW5nIGFydGlmYWN0cy5cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiY29tcC1vcFwiOiB7XG4gICAgICAgICAgICAgICAgXCJjc3NcIjogXCJ0ZXh0LWNvbXAtb3BcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwiYWRkIHRoZSBjdXJyZW50IHN5bWJvbGl6ZXIgb24gdG9wIG9mIG90aGVyIHN5bWJvbGl6ZXJcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIkNvbXBvc2l0ZSBvcGVyYXRpb24uIFRoaXMgZGVmaW5lcyBob3cgdGhpcyBzeW1ib2xpemVyIHNob3VsZCBiZWhhdmUgcmVsYXRpdmUgdG8gc3ltYm9saXplcnMgYXRvcCBvciBiZWxvdyBpdC5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogW1wiY2xlYXJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtb3ZlclwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdmVyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZHN0LWluXCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3JjLW91dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1vdXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzcmMtYXRvcFwiLFxuICAgICAgICAgICAgICAgICAgICBcImRzdC1hdG9wXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGx1c1wiLFxuICAgICAgICAgICAgICAgICAgICBcIm1pbnVzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibXVsdGlwbHlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJvdmVybGF5XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGFya2VuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibGlnaHRlblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbG9yLWRvZGdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3ItYnVyblwiLFxuICAgICAgICAgICAgICAgICAgICBcImhhcmQtbGlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJzb2Z0LWxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGlmZmVyZW5jZVwiLFxuICAgICAgICAgICAgICAgICAgICBcImV4Y2x1c2lvblwiLFxuICAgICAgICAgICAgICAgICAgICBcImNvbnRyYXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaW52ZXJ0LXJnYlwiLFxuICAgICAgICAgICAgICAgICAgICBcImdyYWluLW1lcmdlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZ3JhaW4tZXh0cmFjdFwiLFxuICAgICAgICAgICAgICAgICAgICBcImh1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInNhdHVyYXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgXCJjb2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYnVpbGRpbmdcIjoge1xuICAgICAgICAgICAgXCJmaWxsXCI6IHtcbiAgICAgICAgICAgICAgICBcImNzc1wiOiBcImJ1aWxkaW5nLWZpbGxcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIjRkZGRkZGXCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgY29sb3Igb2YgdGhlIGJ1aWxkaW5ncyB3YWxscy5cIixcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJjb2xvclwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJmaWxsLW9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiYnVpbGRpbmctZmlsbC1vcGFjaXR5XCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmxvYXRcIixcbiAgICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSBvcGFjaXR5IG9mIHRoZSBidWlsZGluZyBhcyBhIHdob2xlLCBpbmNsdWRpbmcgYWxsIHdhbGxzLlwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoZWlnaHRcIjoge1xuICAgICAgICAgICAgICAgIFwiY3NzXCI6IFwiYnVpbGRpbmctaGVpZ2h0XCIsXG4gICAgICAgICAgICAgICAgXCJkb2NcIjogXCJUaGUgaGVpZ2h0IG9mIHRoZSBidWlsZGluZyBpbiBwaXhlbHMuXCIsXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjBcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInRvcnF1ZVwiOiB7XG4gICAgICAgICAgXCItdG9ycXVlLWZyYW1lLWNvdW50XCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLWZyYW1lLWNvdW50XCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcIjEyOFwiLFxuICAgICAgICAgICAgICBcInR5cGVcIjpcImZsb2F0XCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidGhlIGRhdGEgaXMgYnJva2VuIGludG8gMTI4IHRpbWUgZnJhbWVzXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiTnVtYmVyIG9mIGFuaW1hdGlvbiBzdGVwcy9mcmFtZXMgdXNlZCBpbiB0aGUgYW5pbWF0aW9uLiBJZiB0aGUgZGF0YSBjb250YWlucyBhIGZld2VyZSBudW1iZXIgb2YgdG90YWwgZnJhbWVzLCB0aGUgbGVzc2VyIHZhbHVlIHdpbGwgYmUgdXNlZC5cIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCItdG9ycXVlLXJlc29sdXRpb25cIjoge1xuICAgICAgICAgICAgICBcImNzc1wiOiBcIi10b3JxdWUtcmVzb2x1dGlvblwiLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIyXCIsXG4gICAgICAgICAgICAgIFwidHlwZVwiOlwiZmxvYXRcIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LW1lYW5pbmdcIjogXCJcIixcbiAgICAgICAgICAgICAgXCJkb2NcIjogXCJTcGF0aWFsIHJlc29sdXRpb24gaW4gcGl4ZWxzLiBBIHJlc29sdXRpb24gb2YgMSBtZWFucyBubyBzcGF0aWFsIGFnZ3JlZ2F0aW9uIG9mIHRoZSBkYXRhLiBBbnkgb3RoZXIgcmVzb2x1dGlvbiBvZiBOIHJlc3VsdHMgaW4gc3BhdGlhbCBhZ2dyZWdhdGlvbiBpbnRvIGNlbGxzIG9mIE54TiBwaXhlbHMuIFRoZSB2YWx1ZSBOIG11c3QgYmUgcG93ZXIgb2YgMlwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIi10b3JxdWUtYW5pbWF0aW9uLWR1cmF0aW9uXCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLWFuaW1hdGlvbi1kdXJhdGlvblwiLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtdmFsdWVcIjogXCIzMFwiLFxuICAgICAgICAgICAgICBcInR5cGVcIjpcImZsb2F0XCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidGhlIGFuaW1hdGlvbiBsYXN0cyAzMCBzZWNvbmRzXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiQW5pbWF0aW9uIGR1cmF0aW9uIGluIHNlY29uZHNcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCItdG9ycXVlLWFnZ3JlZ2F0aW9uLWZ1bmN0aW9uXCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLWFnZ3JlZ2F0aW9uLWZ1bmN0aW9uXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcImNvdW50KGNhcnRvZGJfaWQpXCIsXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInRoZSB2YWx1ZSBmb3IgZWFjaCBjZWxsIGlzIHRoZSBjb3VudCBvZiBwb2ludHMgaW4gdGhhdCBjZWxsXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSBmdW5jdGlvbiB1c2VkIHRvIGNhbGN1bGF0ZSBhIHZhbHVlIGZyb20gdGhlIGFnZ3JlZ2F0ZSBkYXRhIGZvciBlYWNoIGNlbGwuIFNlZSAtdG9ycXVlLXJlc29sdXRpb25cIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCItdG9ycXVlLXRpbWUtYXR0cmlidXRlXCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLXRpbWUtYXR0cmlidXRlXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC12YWx1ZVwiOiBcInRpbWVcIixcbiAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgIFwiZGVmYXVsdC1tZWFuaW5nXCI6IFwidGhlIGRhdGEgY29sdW1uIGluIHlvdXIgdGFibGUgdGhhdCBpcyBvZiBhIHRpbWUgYmFzZWQgdHlwZVwiLFxuICAgICAgICAgICAgICBcImRvY1wiOiBcIlRoZSB0YWJsZSBjb2x1bW4gdGhhdCBjb250YWlucyB0aGUgdGltZSBpbmZvcm1hdGlvbiB1c2VkIGNyZWF0ZSB0aGUgYW5pbWF0aW9uXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiLXRvcnF1ZS1kYXRhLWFnZ3JlZ2F0aW9uXCI6IHtcbiAgICAgICAgICAgICAgXCJjc3NcIjogXCItdG9ycXVlLWRhdGEtYWdncmVnYXRpb25cIixcbiAgICAgICAgICAgICAgXCJkZWZhdWx0LXZhbHVlXCI6IFwibGluZWFyXCIsXG4gICAgICAgICAgICAgIFwidHlwZVwiOiBbXG4gICAgICAgICAgICAgICAgXCJsaW5lYXJcIixcbiAgICAgICAgICAgICAgICBcImN1bXVsYXRpdmVcIlxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBcImRlZmF1bHQtbWVhbmluZ1wiOiBcInByZXZpb3VzIHZhbHVlcyBhcmUgZGlzY2FyZGVkXCIsXG4gICAgICAgICAgICAgIFwiZG9jXCI6IFwiQSBsaW5lYXIgYW5pbWF0aW9uIHdpbGwgZGlzY2FyZCBwcmV2aW91cyB2YWx1ZXMgd2hpbGUgYSBjdW11bGF0aXZlIGFuaW1hdGlvbiB3aWxsIGFjY3VtdWxhdGUgdGhlbSB1bnRpbCBpdCByZXN0YXJ0c1wiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcImNvbG9yc1wiOiB7XG4gICAgICAgIFwiYWxpY2VibHVlXCI6ICBbMjQwLCAyNDgsIDI1NV0sXG4gICAgICAgIFwiYW50aXF1ZXdoaXRlXCI6ICBbMjUwLCAyMzUsIDIxNV0sXG4gICAgICAgIFwiYXF1YVwiOiAgWzAsIDI1NSwgMjU1XSxcbiAgICAgICAgXCJhcXVhbWFyaW5lXCI6ICBbMTI3LCAyNTUsIDIxMl0sXG4gICAgICAgIFwiYXp1cmVcIjogIFsyNDAsIDI1NSwgMjU1XSxcbiAgICAgICAgXCJiZWlnZVwiOiAgWzI0NSwgMjQ1LCAyMjBdLFxuICAgICAgICBcImJpc3F1ZVwiOiAgWzI1NSwgMjI4LCAxOTZdLFxuICAgICAgICBcImJsYWNrXCI6ICBbMCwgMCwgMF0sXG4gICAgICAgIFwiYmxhbmNoZWRhbG1vbmRcIjogIFsyNTUsMjM1LDIwNV0sXG4gICAgICAgIFwiYmx1ZVwiOiAgWzAsIDAsIDI1NV0sXG4gICAgICAgIFwiYmx1ZXZpb2xldFwiOiAgWzEzOCwgNDMsIDIyNl0sXG4gICAgICAgIFwiYnJvd25cIjogIFsxNjUsIDQyLCA0Ml0sXG4gICAgICAgIFwiYnVybHl3b29kXCI6ICBbMjIyLCAxODQsIDEzNV0sXG4gICAgICAgIFwiY2FkZXRibHVlXCI6ICBbOTUsIDE1OCwgMTYwXSxcbiAgICAgICAgXCJjaGFydHJldXNlXCI6ICBbMTI3LCAyNTUsIDBdLFxuICAgICAgICBcImNob2NvbGF0ZVwiOiAgWzIxMCwgMTA1LCAzMF0sXG4gICAgICAgIFwiY29yYWxcIjogIFsyNTUsIDEyNywgODBdLFxuICAgICAgICBcImNvcm5mbG93ZXJibHVlXCI6ICBbMTAwLCAxNDksIDIzN10sXG4gICAgICAgIFwiY29ybnNpbGtcIjogIFsyNTUsIDI0OCwgMjIwXSxcbiAgICAgICAgXCJjcmltc29uXCI6ICBbMjIwLCAyMCwgNjBdLFxuICAgICAgICBcImN5YW5cIjogIFswLCAyNTUsIDI1NV0sXG4gICAgICAgIFwiZGFya2JsdWVcIjogIFswLCAwLCAxMzldLFxuICAgICAgICBcImRhcmtjeWFuXCI6ICBbMCwgMTM5LCAxMzldLFxuICAgICAgICBcImRhcmtnb2xkZW5yb2RcIjogIFsxODQsIDEzNCwgMTFdLFxuICAgICAgICBcImRhcmtncmF5XCI6ICBbMTY5LCAxNjksIDE2OV0sXG4gICAgICAgIFwiZGFya2dyZWVuXCI6ICBbMCwgMTAwLCAwXSxcbiAgICAgICAgXCJkYXJrZ3JleVwiOiAgWzE2OSwgMTY5LCAxNjldLFxuICAgICAgICBcImRhcmtraGFraVwiOiAgWzE4OSwgMTgzLCAxMDddLFxuICAgICAgICBcImRhcmttYWdlbnRhXCI6ICBbMTM5LCAwLCAxMzldLFxuICAgICAgICBcImRhcmtvbGl2ZWdyZWVuXCI6ICBbODUsIDEwNywgNDddLFxuICAgICAgICBcImRhcmtvcmFuZ2VcIjogIFsyNTUsIDE0MCwgMF0sXG4gICAgICAgIFwiZGFya29yY2hpZFwiOiAgWzE1MywgNTAsIDIwNF0sXG4gICAgICAgIFwiZGFya3JlZFwiOiAgWzEzOSwgMCwgMF0sXG4gICAgICAgIFwiZGFya3NhbG1vblwiOiAgWzIzMywgMTUwLCAxMjJdLFxuICAgICAgICBcImRhcmtzZWFncmVlblwiOiAgWzE0MywgMTg4LCAxNDNdLFxuICAgICAgICBcImRhcmtzbGF0ZWJsdWVcIjogIFs3MiwgNjEsIDEzOV0sXG4gICAgICAgIFwiZGFya3NsYXRlZ3JleVwiOiAgWzQ3LCA3OSwgNzldLFxuICAgICAgICBcImRhcmt0dXJxdW9pc2VcIjogIFswLCAyMDYsIDIwOV0sXG4gICAgICAgIFwiZGFya3Zpb2xldFwiOiAgWzE0OCwgMCwgMjExXSxcbiAgICAgICAgXCJkZWVwcGlua1wiOiAgWzI1NSwgMjAsIDE0N10sXG4gICAgICAgIFwiZGVlcHNreWJsdWVcIjogIFswLCAxOTEsIDI1NV0sXG4gICAgICAgIFwiZGltZ3JheVwiOiAgWzEwNSwgMTA1LCAxMDVdLFxuICAgICAgICBcImRpbWdyZXlcIjogIFsxMDUsIDEwNSwgMTA1XSxcbiAgICAgICAgXCJkb2RnZXJibHVlXCI6ICBbMzAsIDE0NCwgMjU1XSxcbiAgICAgICAgXCJmaXJlYnJpY2tcIjogIFsxNzgsIDM0LCAzNF0sXG4gICAgICAgIFwiZmxvcmFsd2hpdGVcIjogIFsyNTUsIDI1MCwgMjQwXSxcbiAgICAgICAgXCJmb3Jlc3RncmVlblwiOiAgWzM0LCAxMzksIDM0XSxcbiAgICAgICAgXCJmdWNoc2lhXCI6ICBbMjU1LCAwLCAyNTVdLFxuICAgICAgICBcImdhaW5zYm9yb1wiOiAgWzIyMCwgMjIwLCAyMjBdLFxuICAgICAgICBcImdob3N0d2hpdGVcIjogIFsyNDgsIDI0OCwgMjU1XSxcbiAgICAgICAgXCJnb2xkXCI6ICBbMjU1LCAyMTUsIDBdLFxuICAgICAgICBcImdvbGRlbnJvZFwiOiAgWzIxOCwgMTY1LCAzMl0sXG4gICAgICAgIFwiZ3JheVwiOiAgWzEyOCwgMTI4LCAxMjhdLFxuICAgICAgICBcImdyZXlcIjogIFsxMjgsIDEyOCwgMTI4XSxcbiAgICAgICAgXCJncmVlblwiOiAgWzAsIDEyOCwgMF0sXG4gICAgICAgIFwiZ3JlZW55ZWxsb3dcIjogIFsxNzMsIDI1NSwgNDddLFxuICAgICAgICBcImhvbmV5ZGV3XCI6ICBbMjQwLCAyNTUsIDI0MF0sXG4gICAgICAgIFwiaG90cGlua1wiOiAgWzI1NSwgMTA1LCAxODBdLFxuICAgICAgICBcImluZGlhbnJlZFwiOiAgWzIwNSwgOTIsIDkyXSxcbiAgICAgICAgXCJpbmRpZ29cIjogIFs3NSwgMCwgMTMwXSxcbiAgICAgICAgXCJpdm9yeVwiOiAgWzI1NSwgMjU1LCAyNDBdLFxuICAgICAgICBcImtoYWtpXCI6ICBbMjQwLCAyMzAsIDE0MF0sXG4gICAgICAgIFwibGF2ZW5kZXJcIjogIFsyMzAsIDIzMCwgMjUwXSxcbiAgICAgICAgXCJsYXZlbmRlcmJsdXNoXCI6ICBbMjU1LCAyNDAsIDI0NV0sXG4gICAgICAgIFwibGF3bmdyZWVuXCI6ICBbMTI0LCAyNTIsIDBdLFxuICAgICAgICBcImxlbW9uY2hpZmZvblwiOiAgWzI1NSwgMjUwLCAyMDVdLFxuICAgICAgICBcImxpZ2h0Ymx1ZVwiOiAgWzE3MywgMjE2LCAyMzBdLFxuICAgICAgICBcImxpZ2h0Y29yYWxcIjogIFsyNDAsIDEyOCwgMTI4XSxcbiAgICAgICAgXCJsaWdodGN5YW5cIjogIFsyMjQsIDI1NSwgMjU1XSxcbiAgICAgICAgXCJsaWdodGdvbGRlbnJvZHllbGxvd1wiOiAgWzI1MCwgMjUwLCAyMTBdLFxuICAgICAgICBcImxpZ2h0Z3JheVwiOiAgWzIxMSwgMjExLCAyMTFdLFxuICAgICAgICBcImxpZ2h0Z3JlZW5cIjogIFsxNDQsIDIzOCwgMTQ0XSxcbiAgICAgICAgXCJsaWdodGdyZXlcIjogIFsyMTEsIDIxMSwgMjExXSxcbiAgICAgICAgXCJsaWdodHBpbmtcIjogIFsyNTUsIDE4MiwgMTkzXSxcbiAgICAgICAgXCJsaWdodHNhbG1vblwiOiAgWzI1NSwgMTYwLCAxMjJdLFxuICAgICAgICBcImxpZ2h0c2VhZ3JlZW5cIjogIFszMiwgMTc4LCAxNzBdLFxuICAgICAgICBcImxpZ2h0c2t5Ymx1ZVwiOiAgWzEzNSwgMjA2LCAyNTBdLFxuICAgICAgICBcImxpZ2h0c2xhdGVncmF5XCI6ICBbMTE5LCAxMzYsIDE1M10sXG4gICAgICAgIFwibGlnaHRzbGF0ZWdyZXlcIjogIFsxMTksIDEzNiwgMTUzXSxcbiAgICAgICAgXCJsaWdodHN0ZWVsYmx1ZVwiOiAgWzE3NiwgMTk2LCAyMjJdLFxuICAgICAgICBcImxpZ2h0eWVsbG93XCI6ICBbMjU1LCAyNTUsIDIyNF0sXG4gICAgICAgIFwibGltZVwiOiAgWzAsIDI1NSwgMF0sXG4gICAgICAgIFwibGltZWdyZWVuXCI6ICBbNTAsIDIwNSwgNTBdLFxuICAgICAgICBcImxpbmVuXCI6ICBbMjUwLCAyNDAsIDIzMF0sXG4gICAgICAgIFwibWFnZW50YVwiOiAgWzI1NSwgMCwgMjU1XSxcbiAgICAgICAgXCJtYXJvb25cIjogIFsxMjgsIDAsIDBdLFxuICAgICAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjogIFsxMDIsIDIwNSwgMTcwXSxcbiAgICAgICAgXCJtZWRpdW1ibHVlXCI6ICBbMCwgMCwgMjA1XSxcbiAgICAgICAgXCJtZWRpdW1vcmNoaWRcIjogIFsxODYsIDg1LCAyMTFdLFxuICAgICAgICBcIm1lZGl1bXB1cnBsZVwiOiAgWzE0NywgMTEyLCAyMTldLFxuICAgICAgICBcIm1lZGl1bXNlYWdyZWVuXCI6ICBbNjAsIDE3OSwgMTEzXSxcbiAgICAgICAgXCJtZWRpdW1zbGF0ZWJsdWVcIjogIFsxMjMsIDEwNCwgMjM4XSxcbiAgICAgICAgXCJtZWRpdW1zcHJpbmdncmVlblwiOiAgWzAsIDI1MCwgMTU0XSxcbiAgICAgICAgXCJtZWRpdW10dXJxdW9pc2VcIjogIFs3MiwgMjA5LCAyMDRdLFxuICAgICAgICBcIm1lZGl1bXZpb2xldHJlZFwiOiAgWzE5OSwgMjEsIDEzM10sXG4gICAgICAgIFwibWlkbmlnaHRibHVlXCI6ICBbMjUsIDI1LCAxMTJdLFxuICAgICAgICBcIm1pbnRjcmVhbVwiOiAgWzI0NSwgMjU1LCAyNTBdLFxuICAgICAgICBcIm1pc3R5cm9zZVwiOiAgWzI1NSwgMjI4LCAyMjVdLFxuICAgICAgICBcIm1vY2Nhc2luXCI6ICBbMjU1LCAyMjgsIDE4MV0sXG4gICAgICAgIFwibmF2YWpvd2hpdGVcIjogIFsyNTUsIDIyMiwgMTczXSxcbiAgICAgICAgXCJuYXZ5XCI6ICBbMCwgMCwgMTI4XSxcbiAgICAgICAgXCJvbGRsYWNlXCI6ICBbMjUzLCAyNDUsIDIzMF0sXG4gICAgICAgIFwib2xpdmVcIjogIFsxMjgsIDEyOCwgMF0sXG4gICAgICAgIFwib2xpdmVkcmFiXCI6ICBbMTA3LCAxNDIsIDM1XSxcbiAgICAgICAgXCJvcmFuZ2VcIjogIFsyNTUsIDE2NSwgMF0sXG4gICAgICAgIFwib3JhbmdlcmVkXCI6ICBbMjU1LCA2OSwgMF0sXG4gICAgICAgIFwib3JjaGlkXCI6ICBbMjE4LCAxMTIsIDIxNF0sXG4gICAgICAgIFwicGFsZWdvbGRlbnJvZFwiOiAgWzIzOCwgMjMyLCAxNzBdLFxuICAgICAgICBcInBhbGVncmVlblwiOiAgWzE1MiwgMjUxLCAxNTJdLFxuICAgICAgICBcInBhbGV0dXJxdW9pc2VcIjogIFsxNzUsIDIzOCwgMjM4XSxcbiAgICAgICAgXCJwYWxldmlvbGV0cmVkXCI6ICBbMjE5LCAxMTIsIDE0N10sXG4gICAgICAgIFwicGFwYXlhd2hpcFwiOiAgWzI1NSwgMjM5LCAyMTNdLFxuICAgICAgICBcInBlYWNocHVmZlwiOiAgWzI1NSwgMjE4LCAxODVdLFxuICAgICAgICBcInBlcnVcIjogIFsyMDUsIDEzMywgNjNdLFxuICAgICAgICBcInBpbmtcIjogIFsyNTUsIDE5MiwgMjAzXSxcbiAgICAgICAgXCJwbHVtXCI6ICBbMjIxLCAxNjAsIDIyMV0sXG4gICAgICAgIFwicG93ZGVyYmx1ZVwiOiAgWzE3NiwgMjI0LCAyMzBdLFxuICAgICAgICBcInB1cnBsZVwiOiAgWzEyOCwgMCwgMTI4XSxcbiAgICAgICAgXCJyZWRcIjogIFsyNTUsIDAsIDBdLFxuICAgICAgICBcInJvc3licm93blwiOiAgWzE4OCwgMTQzLCAxNDNdLFxuICAgICAgICBcInJveWFsYmx1ZVwiOiAgWzY1LCAxMDUsIDIyNV0sXG4gICAgICAgIFwic2FkZGxlYnJvd25cIjogIFsxMzksIDY5LCAxOV0sXG4gICAgICAgIFwic2FsbW9uXCI6ICBbMjUwLCAxMjgsIDExNF0sXG4gICAgICAgIFwic2FuZHlicm93blwiOiAgWzI0NCwgMTY0LCA5Nl0sXG4gICAgICAgIFwic2VhZ3JlZW5cIjogIFs0NiwgMTM5LCA4N10sXG4gICAgICAgIFwic2Vhc2hlbGxcIjogIFsyNTUsIDI0NSwgMjM4XSxcbiAgICAgICAgXCJzaWVubmFcIjogIFsxNjAsIDgyLCA0NV0sXG4gICAgICAgIFwic2lsdmVyXCI6ICBbMTkyLCAxOTIsIDE5Ml0sXG4gICAgICAgIFwic2t5Ymx1ZVwiOiAgWzEzNSwgMjA2LCAyMzVdLFxuICAgICAgICBcInNsYXRlYmx1ZVwiOiAgWzEwNiwgOTAsIDIwNV0sXG4gICAgICAgIFwic2xhdGVncmF5XCI6ICBbMTEyLCAxMjgsIDE0NF0sXG4gICAgICAgIFwic2xhdGVncmV5XCI6ICBbMTEyLCAxMjgsIDE0NF0sXG4gICAgICAgIFwic25vd1wiOiAgWzI1NSwgMjUwLCAyNTBdLFxuICAgICAgICBcInNwcmluZ2dyZWVuXCI6ICBbMCwgMjU1LCAxMjddLFxuICAgICAgICBcInN0ZWVsYmx1ZVwiOiAgWzcwLCAxMzAsIDE4MF0sXG4gICAgICAgIFwidGFuXCI6ICBbMjEwLCAxODAsIDE0MF0sXG4gICAgICAgIFwidGVhbFwiOiAgWzAsIDEyOCwgMTI4XSxcbiAgICAgICAgXCJ0aGlzdGxlXCI6ICBbMjE2LCAxOTEsIDIxNl0sXG4gICAgICAgIFwidG9tYXRvXCI6ICBbMjU1LCA5OSwgNzFdLFxuICAgICAgICBcInR1cnF1b2lzZVwiOiAgWzY0LCAyMjQsIDIwOF0sXG4gICAgICAgIFwidmlvbGV0XCI6ICBbMjM4LCAxMzAsIDIzOF0sXG4gICAgICAgIFwid2hlYXRcIjogIFsyNDUsIDIyMiwgMTc5XSxcbiAgICAgICAgXCJ3aGl0ZVwiOiAgWzI1NSwgMjU1LCAyNTVdLFxuICAgICAgICBcIndoaXRlc21va2VcIjogIFsyNDUsIDI0NSwgMjQ1XSxcbiAgICAgICAgXCJ5ZWxsb3dcIjogIFsyNTUsIDI1NSwgMF0sXG4gICAgICAgIFwieWVsbG93Z3JlZW5cIjogIFsxNTQsIDIwNSwgNTBdLFxuICAgICAgICBcInRyYW5zcGFyZW50XCI6ICBbMCwgMCwgMCwgMF1cbiAgICB9LFxuICAgIFwiZmlsdGVyXCI6IHtcbiAgICAgICAgXCJ2YWx1ZVwiOiBbXG4gICAgICAgICAgICBcInRydWVcIixcbiAgICAgICAgICAgIFwiZmFsc2VcIixcbiAgICAgICAgICAgIFwibnVsbFwiLFxuICAgICAgICAgICAgXCJwb2ludFwiLFxuICAgICAgICAgICAgXCJsaW5lc3RyaW5nXCIsXG4gICAgICAgICAgICBcInBvbHlnb25cIixcbiAgICAgICAgICAgIFwiY29sbGVjdGlvblwiXG4gICAgICAgIF1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB2ZXJzaW9uOiB7XG4gICAgbGF0ZXN0OiBfbWFwbmlrX3JlZmVyZW5jZV9sYXRlc3QsXG4gICAgJzIuMS4xJzogX21hcG5pa19yZWZlcmVuY2VfbGF0ZXN0XG4gIH1cbn07XG4iLCIvKipcbiAqIFRPRE86IGRvY3VtZW50IHRoaXMuIFdoYXQgZG9lcyB0aGlzIGRvP1xuICovXG5pZih0eXBlb2YobW9kdWxlKSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICBtb2R1bGUuZXhwb3J0cy5maW5kID0gZnVuY3Rpb24gKG9iaiwgZnVuKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChyID0gZnVuLmNhbGwob2JqLCBvYmpbaV0pKSB7IHJldHVybiByOyB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgfTtcbn1cbiIsIihmdW5jdGlvbih0cmVlKSB7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnRyZWUuQ2FsbCA9IGZ1bmN0aW9uIENhbGwobmFtZSwgYXJncywgaW5kZXgpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuYXJncyA9IGFyZ3M7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xufTtcblxudHJlZS5DYWxsLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ2NhbGwnLFxuICAgIC8vIFdoZW4gZXZ1YXRpbmcgYSBmdW5jdGlvbiBjYWxsLFxuICAgIC8vIHdlIGVpdGhlciBmaW5kIHRoZSBmdW5jdGlvbiBpbiBgdHJlZS5mdW5jdGlvbnNgIFsxXSxcbiAgICAvLyBpbiB3aGljaCBjYXNlIHdlIGNhbGwgaXQsIHBhc3NpbmcgdGhlICBldmFsdWF0ZWQgYXJndW1lbnRzLFxuICAgIC8vIG9yIHdlIHNpbXBseSBwcmludCBpdCBvdXQgYXMgaXQgYXBwZWFyZWQgb3JpZ2luYWxseSBbMl0uXG4gICAgLy8gVGhlICpmdW5jdGlvbnMuanMqIGZpbGUgY29udGFpbnMgdGhlIGJ1aWx0LWluIGZ1bmN0aW9ucy5cbiAgICAvLyBUaGUgcmVhc29uIHdoeSB3ZSBldmFsdWF0ZSB0aGUgYXJndW1lbnRzLCBpcyBpbiB0aGUgY2FzZSB3aGVyZVxuICAgIC8vIHdlIHRyeSB0byBwYXNzIGEgdmFyaWFibGUgdG8gYSBmdW5jdGlvbiwgbGlrZTogYHNhdHVyYXRlKEBjb2xvcilgLlxuICAgIC8vIFRoZSBmdW5jdGlvbiBzaG91bGQgcmVjZWl2ZSB0aGUgdmFsdWUsIG5vdCB0aGUgdmFyaWFibGUuXG4gICAgJ2V2JzogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIHZhciBhcmdzID0gdGhpcy5hcmdzLm1hcChmdW5jdGlvbihhKSB7IHJldHVybiBhLmV2KGVudik7IH0pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFyZ3NbaV0uaXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubmFtZSBpbiB0cmVlLmZ1bmN0aW9ucykge1xuICAgICAgICAgICAgaWYgKHRyZWUuZnVuY3Rpb25zW3RoaXMubmFtZV0ubGVuZ3RoIDw9IGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRyZWUuZnVuY3Rpb25zW3RoaXMubmFtZV0uYXBwbHkodHJlZS5mdW5jdGlvbnMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdpbmNvcnJlY3QgYXJndW1lbnRzIGdpdmVuIHRvICcgKyB0aGlzLm5hbWUgKyAnKCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgaXM6ICd1bmRlZmluZWQnLCB2YWx1ZTogJ3VuZGVmaW5lZCcgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ2luY29ycmVjdCBudW1iZXIgb2YgYXJndW1lbnRzIGZvciAnICsgdGhpcy5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcoKS4gJyArIHRyZWUuZnVuY3Rpb25zW3RoaXMubmFtZV0ubGVuZ3RoICsgJyBleHBlY3RlZC4nLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3J1bnRpbWUnLFxuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBmbiA9IHRyZWUuUmVmZXJlbmNlLm1hcG5pa0Z1bmN0aW9uc1t0aGlzLm5hbWVdO1xuICAgICAgICAgICAgaWYgKGZuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25zID0gXy5wYWlycyh0cmVlLlJlZmVyZW5jZS5tYXBuaWtGdW5jdGlvbnMpO1xuICAgICAgICAgICAgICAgIC8vIGNoZWFwIGNsb3Nlc3QsIG5lZWRzIGltcHJvdmVtZW50LlxuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5uYW1lO1xuICAgICAgICAgICAgICAgIHZhciBtZWFuID0gZnVuY3Rpb25zLm1hcChmdW5jdGlvbihmKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbZlswXSwgdHJlZS5SZWZlcmVuY2UuZWRpdERpc3RhbmNlKG5hbWUsIGZbMF0pLCBmWzFdXTtcbiAgICAgICAgICAgICAgICB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFbMV0gLSBiWzFdO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICd1bmtub3duIGZ1bmN0aW9uICcgKyB0aGlzLm5hbWUgKyAnKCksIGRpZCB5b3UgbWVhbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lYW5bMF1bMF0gKyAnKCcgKyBtZWFuWzBdWzJdICsgJyknLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3J1bnRpbWUnLFxuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmbiAhPT0gYXJncy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAhKEFycmF5LmlzQXJyYXkoZm4pICYmIF8uaW5jbHVkZShmbiwgYXJncy5sZW5ndGgpKSAmJlxuICAgICAgICAgICAgICAgIC8vIHN1cHBvcnQgdmFyaWFibGUtYXJnIGZ1bmN0aW9ucyBsaWtlIGBjb2xvcml6ZS1hbHBoYWBcbiAgICAgICAgICAgICAgICBmbiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnZnVuY3Rpb24gJyArIHRoaXMubmFtZSArICcoKSB0YWtlcyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuICsgJyBhcmd1bWVudHMgYW5kIHdhcyBnaXZlbiAnICsgYXJncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBldmFsdWF0ZWQgdmVyc2lvbnMgb2YgYXJndW1lbnRzXG4gICAgICAgICAgICAgICAgdGhpcy5hcmdzID0gYXJncztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24oZW52LCBmb3JtYXQpIHtcbiAgICAgICAgaWYgKHRoaXMuYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5hbWUgKyAnKCcgKyB0aGlzLmFyZ3Muam9pbignLCcpICsgJyknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuLy8gUkdCIENvbG9ycyAtICNmZjAwMTQsICNlZWVcbi8vIGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgMyBvciA2IGNoYXIgc3RyaW5nIG9yIGEgMyBvciA0IGVsZW1lbnRcbi8vIG51bWVyaWNhbCBhcnJheVxudHJlZS5Db2xvciA9IGZ1bmN0aW9uIENvbG9yKHJnYiwgYSkge1xuICAgIC8vIFRoZSBlbmQgZ29hbCBoZXJlLCBpcyB0byBwYXJzZSB0aGUgYXJndW1lbnRzXG4gICAgLy8gaW50byBhbiBpbnRlZ2VyIHRyaXBsZXQsIHN1Y2ggYXMgYDEyOCwgMjU1LCAwYFxuICAgIC8vXG4gICAgLy8gVGhpcyBmYWNpbGl0YXRlcyBvcGVyYXRpb25zIGFuZCBjb252ZXJzaW9ucy5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShyZ2IpKSB7XG4gICAgICAgIHRoaXMucmdiID0gcmdiLnNsaWNlKDAsIDMpO1xuICAgIH0gZWxzZSBpZiAocmdiLmxlbmd0aCA9PSA2KSB7XG4gICAgICAgIHRoaXMucmdiID0gcmdiLm1hdGNoKC8uezJ9L2cpLm1hcChmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoYywgMTYpO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJnYiA9IHJnYi5zcGxpdCgnJykubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludChjICsgYywgMTYpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mKGEpID09PSAnbnVtYmVyJykge1xuICAgICAgICB0aGlzLmFscGhhID0gYTtcbiAgICB9IGVsc2UgaWYgKHJnYi5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgdGhpcy5hbHBoYSA9IHJnYlszXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFscGhhID0gMTtcbiAgICB9XG59O1xuXG50cmVlLkNvbG9yLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ2NvbG9yJyxcbiAgICAnZXYnOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0sXG5cbiAgICAvLyBJZiB3ZSBoYXZlIHNvbWUgdHJhbnNwYXJlbmN5LCB0aGUgb25seSB3YXkgdG8gcmVwcmVzZW50IGl0XG4gICAgLy8gaXMgdmlhIGByZ2JhYC4gT3RoZXJ3aXNlLCB3ZSB1c2UgdGhlIGhleCByZXByZXNlbnRhdGlvbixcbiAgICAvLyB3aGljaCBoYXMgYmV0dGVyIGNvbXBhdGliaWxpdHkgd2l0aCBvbGRlciBicm93c2Vycy5cbiAgICAvLyBWYWx1ZXMgYXJlIGNhcHBlZCBiZXR3ZWVuIGAwYCBhbmQgYDI1NWAsIHJvdW5kZWQgYW5kIHplcm8tcGFkZGVkLlxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuYWxwaGEgPCAxLjApIHtcbiAgICAgICAgICAgIHJldHVybiAncmdiYSgnICsgdGhpcy5yZ2IubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChjKTtcbiAgICAgICAgICAgIH0pLmNvbmNhdCh0aGlzLmFscGhhKS5qb2luKCcsICcpICsgJyknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICcjJyArIHRoaXMucmdiLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICAgICAgaSA9IE1hdGgucm91bmQoaSk7XG4gICAgICAgICAgICAgICAgaSA9IChpID4gMjU1ID8gMjU1IDogKGkgPCAwID8gMCA6IGkpKS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkubGVuZ3RoID09PSAxID8gJzAnICsgaSA6IGk7XG4gICAgICAgICAgICB9KS5qb2luKCcnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBPcGVyYXRpb25zIGhhdmUgdG8gYmUgZG9uZSBwZXItY2hhbm5lbCwgaWYgbm90LFxuICAgIC8vIGNoYW5uZWxzIHdpbGwgc3BpbGwgb250byBlYWNoIG90aGVyLiBPbmNlIHdlIGhhdmVcbiAgICAvLyBvdXIgcmVzdWx0LCBpbiB0aGUgZm9ybSBvZiBhbiBpbnRlZ2VyIHRyaXBsZXQsXG4gICAgLy8gd2UgY3JlYXRlIGEgbmV3IENvbG9yIG5vZGUgdG8gaG9sZCB0aGUgcmVzdWx0LlxuICAgIG9wZXJhdGU6IGZ1bmN0aW9uKGVudiwgb3AsIG90aGVyKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBpZiAoISAob3RoZXIgaW5zdGFuY2VvZiB0cmVlLkNvbG9yKSkge1xuICAgICAgICAgICAgb3RoZXIgPSBvdGhlci50b0NvbG9yKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBjID0gMDsgYyA8IDM7IGMrKykge1xuICAgICAgICAgICAgcmVzdWx0W2NdID0gdHJlZS5vcGVyYXRlKG9wLCB0aGlzLnJnYltjXSwgb3RoZXIucmdiW2NdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IHRyZWUuQ29sb3IocmVzdWx0KTtcbiAgICB9LFxuXG4gICAgdG9IU0w6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgciA9IHRoaXMucmdiWzBdIC8gMjU1LFxuICAgICAgICAgICAgZyA9IHRoaXMucmdiWzFdIC8gMjU1LFxuICAgICAgICAgICAgYiA9IHRoaXMucmdiWzJdIC8gMjU1LFxuICAgICAgICAgICAgYSA9IHRoaXMuYWxwaGE7XG5cbiAgICAgICAgdmFyIG1heCA9IE1hdGgubWF4KHIsIGcsIGIpLCBtaW4gPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgICAgICAgdmFyIGgsIHMsIGwgPSAobWF4ICsgbWluKSAvIDIsIGQgPSBtYXggLSBtaW47XG5cbiAgICAgICAgaWYgKG1heCA9PT0gbWluKSB7XG4gICAgICAgICAgICBoID0gcyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzID0gbCA+IDAuNSA/IGQgLyAoMiAtIG1heCAtIG1pbikgOiBkIC8gKG1heCArIG1pbik7XG5cbiAgICAgICAgICAgIHN3aXRjaCAobWF4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSByOiBoID0gKGcgLSBiKSAvIGQgKyAoZyA8IGIgPyA2IDogMCk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgZzogaCA9IChiIC0gcikgLyBkICsgMjsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBiOiBoID0gKHIgLSBnKSAvIGQgKyA0OyBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGggLz0gNjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBoOiBoICogMzYwLCBzOiBzLCBsOiBsLCBhOiBhIH07XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuQ29tbWVudCA9IGZ1bmN0aW9uIENvbW1lbnQodmFsdWUsIHNpbGVudCkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnNpbGVudCA9ICEhc2lsZW50O1xufTtcblxudHJlZS5Db21tZW50LnByb3RvdHlwZSA9IHtcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oZW52KSB7XG4gICAgICAgIHJldHVybiAnPCEtLScgKyB0aGlzLnZhbHVlICsgJy0tPic7XG4gICAgfSxcbiAgICAnZXYnOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpLFxuICAgIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbi8vIEEgZGVmaW5pdGlvbiBpcyB0aGUgY29tYmluYXRpb24gb2YgYSBzZWxlY3RvciBhbmQgcnVsZXMsIGxpa2Vcbi8vICNmb28ge1xuLy8gICAgIHBvbHlnb24tb3BhY2l0eToxLjA7XG4vLyB9XG4vL1xuLy8gVGhlIHNlbGVjdG9yIGNhbiBoYXZlIGZpbHRlcnNcbnRyZWUuRGVmaW5pdGlvbiA9IGZ1bmN0aW9uIERlZmluaXRpb24oc2VsZWN0b3IsIHJ1bGVzKSB7XG4gICAgdGhpcy5lbGVtZW50cyA9IHNlbGVjdG9yLmVsZW1lbnRzO1xuICAgIGFzc2VydC5vayhzZWxlY3Rvci5maWx0ZXJzIGluc3RhbmNlb2YgdHJlZS5GaWx0ZXJzZXQpO1xuICAgIHRoaXMucnVsZXMgPSBydWxlcztcbiAgICB0aGlzLnJ1bGVJbmRleCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoJ3pvb20nIGluIHRoaXMucnVsZXNbaV0pIHRoaXMucnVsZXNbaV0gPSB0aGlzLnJ1bGVzW2ldLmNsb25lKCk7XG4gICAgICAgIHRoaXMucnVsZXNbaV0uem9vbSA9IHNlbGVjdG9yLnpvb207XG4gICAgICAgIHRoaXMucnVsZUluZGV4W3RoaXMucnVsZXNbaV0udXBkYXRlSUQoKV0gPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLmZpbHRlcnMgPSBzZWxlY3Rvci5maWx0ZXJzO1xuICAgIHRoaXMuem9vbSA9IHNlbGVjdG9yLnpvb207XG4gICAgdGhpcy5mcmFtZV9vZmZzZXQgPSBzZWxlY3Rvci5mcmFtZV9vZmZzZXQ7XG4gICAgdGhpcy5hdHRhY2htZW50ID0gc2VsZWN0b3IuYXR0YWNobWVudCB8fCAnX19kZWZhdWx0X18nO1xuICAgIHRoaXMuc3BlY2lmaWNpdHkgPSBzZWxlY3Rvci5zcGVjaWZpY2l0eSgpO1xufTtcblxudHJlZS5EZWZpbml0aW9uLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdHIgPSB0aGlzLmZpbHRlcnMudG9TdHJpbmcoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3RyICs9ICdcXG4gICAgJyArIHRoaXMucnVsZXNbaV07XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59O1xuXG50cmVlLkRlZmluaXRpb24ucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oZmlsdGVycykge1xuICAgIGlmIChmaWx0ZXJzKSBhc3NlcnQub2soZmlsdGVycyBpbnN0YW5jZW9mIHRyZWUuRmlsdGVyc2V0KTtcbiAgICB2YXIgY2xvbmUgPSBPYmplY3QuY3JlYXRlKHRyZWUuRGVmaW5pdGlvbi5wcm90b3R5cGUpO1xuICAgIGNsb25lLnJ1bGVzID0gdGhpcy5ydWxlcy5zbGljZSgpO1xuICAgIGNsb25lLnJ1bGVJbmRleCA9IF8uY2xvbmUodGhpcy5ydWxlSW5kZXgpO1xuICAgIGNsb25lLmZpbHRlcnMgPSBmaWx0ZXJzID8gZmlsdGVycyA6IHRoaXMuZmlsdGVycy5jbG9uZSgpO1xuICAgIGNsb25lLmF0dGFjaG1lbnQgPSB0aGlzLmF0dGFjaG1lbnQ7XG4gICAgcmV0dXJuIGNsb25lO1xufTtcblxudHJlZS5EZWZpbml0aW9uLnByb3RvdHlwZS5hZGRSdWxlcyA9IGZ1bmN0aW9uKHJ1bGVzKSB7XG4gICAgdmFyIGFkZGVkID0gMDtcblxuICAgIC8vIEFkZCBvbmx5IHVuaXF1ZSBydWxlcy5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghdGhpcy5ydWxlSW5kZXhbcnVsZXNbaV0uaWRdKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bGVzLnB1c2gocnVsZXNbaV0pO1xuICAgICAgICAgICAgdGhpcy5ydWxlSW5kZXhbcnVsZXNbaV0uaWRdID0gdHJ1ZTtcbiAgICAgICAgICAgIGFkZGVkKys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYWRkZWQ7XG59O1xuXG4vLyBEZXRlcm1pbmUgd2hldGhlciB0aGlzIHNlbGVjdG9yIG1hdGNoZXMgYSBnaXZlbiBpZFxuLy8gYW5kIGFycmF5IG9mIGNsYXNzZXMsIGJ5IGRldGVybWluaW5nIHdoZXRoZXJcbi8vIGFsbCBlbGVtZW50cyBpdCBjb250YWlucyBtYXRjaC5cbnRyZWUuRGVmaW5pdGlvbi5wcm90b3R5cGUuYXBwbGllc1RvID0gZnVuY3Rpb24oaWQsIGNsYXNzZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBlbGVtID0gdGhpcy5lbGVtZW50c1tpXTtcbiAgICAgICAgaWYgKCEoZWxlbS53aWxkY2FyZCB8fFxuICAgICAgICAgICAgKGVsZW0udHlwZSA9PT0gJ2NsYXNzJyAmJiBjbGFzc2VzW2VsZW0uY2xlYW5dKSB8fFxuICAgICAgICAgICAgKGVsZW0udHlwZSA9PT0gJ2lkJyAmJiBpZCA9PT0gZWxlbS5jbGVhbikpKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcblxuZnVuY3Rpb24gc3ltYm9saXplck5hbWUoc3ltYm9saXplcikge1xuICAgIGZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyKSB7IHJldHVybiBzdHJbMV0udG9VcHBlckNhc2UoKTsgfVxuICAgIHJldHVybiBzeW1ib2xpemVyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICtcbiAgICAgICAgICAgc3ltYm9saXplci5zbGljZSgxKS5yZXBsYWNlKC9cXC0uLywgY2FwaXRhbGl6ZSkgKyAnU3ltYm9saXplcic7XG59XG5cbi8vIEdldCBhIHNpbXBsZSBsaXN0IG9mIHRoZSBzeW1ib2xpemVycywgaW4gb3JkZXJcbmZ1bmN0aW9uIHN5bWJvbGl6ZXJMaXN0KHN5bV9vcmRlcikge1xuICAgIHJldHVybiBzeW1fb3JkZXIuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhWzFdIC0gYlsxXTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbih2KSB7IHJldHVybiB2WzBdOyB9KTtcbn1cblxudHJlZS5EZWZpbml0aW9uLnByb3RvdHlwZS5zeW1ib2xpemVyc1RvWE1MID0gZnVuY3Rpb24oZW52LCBzeW1ib2xpemVycywgem9vbSkge1xuICAgIHZhciB4bWwgPSB6b29tLnRvWE1MKGVudikuam9pbignJykgKyB0aGlzLmZpbHRlcnMudG9YTUwoZW52KTtcblxuICAgIC8vIFNvcnQgc3ltYm9saXplcnMgYnkgdGhlIGluZGV4IG9mIHRoZWlyIGZpcnN0IHByb3BlcnR5IGRlZmluaXRpb25cbiAgICB2YXIgc3ltX29yZGVyID0gW10sIGluZGV4ZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3ltYm9saXplcnMpIHtcbiAgICAgICAgaW5kZXhlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHN5bWJvbGl6ZXJzW2tleV0pIHtcbiAgICAgICAgICAgIGluZGV4ZXMucHVzaChzeW1ib2xpemVyc1trZXldW3Byb3BdLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWluX2lkeCA9IE1hdGgubWluLmFwcGx5KE1hdGgsIGluZGV4ZXMpO1xuICAgICAgICBzeW1fb3JkZXIucHVzaChba2V5LCBtaW5faWR4XSk7XG4gICAgfVxuXG4gICAgc3ltX29yZGVyID0gc3ltYm9saXplckxpc3Qoc3ltX29yZGVyKTtcbiAgICB2YXIgc3ltX2NvdW50ID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3ltX29yZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhdHRyaWJ1dGVzID0gc3ltYm9saXplcnNbc3ltX29yZGVyW2ldXTtcbiAgICAgICAgdmFyIHN5bWJvbGl6ZXIgPSBzeW1fb3JkZXJbaV0uc3BsaXQoJy8nKS5wb3AoKTtcblxuICAgICAgICAvLyBTa2lwIHRoZSBtYWdpY2FsICogc3ltYm9saXplciB3aGljaCBpcyB1c2VkIGZvciB1bml2ZXJzYWwgcHJvcGVydGllc1xuICAgICAgICAvLyB3aGljaCBhcmUgYnViYmxlZCB1cCB0byBTdHlsZSBlbGVtZW50cyBpbnRlYWQgb2YgU3ltYm9saXplciBlbGVtZW50cy5cbiAgICAgICAgaWYgKHN5bWJvbGl6ZXIgPT09ICcqJykgY29udGludWU7XG4gICAgICAgIHN5bV9jb3VudCsrO1xuXG4gICAgICAgIHZhciBmYWlsID0gdHJlZS5SZWZlcmVuY2UucmVxdWlyZWRQcm9wZXJ0aWVzKHN5bWJvbGl6ZXIsIGF0dHJpYnV0ZXMpO1xuICAgICAgICBpZiAoZmFpbCkge1xuICAgICAgICAgICAgdmFyIHJ1bGUgPSBhdHRyaWJ1dGVzW09iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLnNoaWZ0KCldO1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBmYWlsLFxuICAgICAgICAgICAgICAgIGluZGV4OiBydWxlLmluZGV4LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBydWxlLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBuYW1lID0gc3ltYm9saXplck5hbWUoc3ltYm9saXplcik7XG5cbiAgICAgICAgdmFyIHNlbGZjbG9zaW5nID0gdHJ1ZSwgdGFnY29udGVudDtcbiAgICAgICAgeG1sICs9ICcgICAgPCcgKyBuYW1lICsgJyAnO1xuICAgICAgICBmb3IgKHZhciBqIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIGlmIChzeW1ib2xpemVyID09PSAnbWFwJykgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnTWFwIHByb3BlcnRpZXMgYXJlIG5vdCBwZXJtaXR0ZWQgaW4gb3RoZXIgcnVsZXMnLFxuICAgICAgICAgICAgICAgIGluZGV4OiBhdHRyaWJ1dGVzW2pdLmluZGV4LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBhdHRyaWJ1dGVzW2pdLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciB4ID0gdHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3IoYXR0cmlidXRlc1tqXS5uYW1lKTtcbiAgICAgICAgICAgIGlmICh4ICYmIHguc2VyaWFsaXphdGlvbiAmJiB4LnNlcmlhbGl6YXRpb24gPT09ICdjb250ZW50Jykge1xuICAgICAgICAgICAgICAgIHNlbGZjbG9zaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGFnY29udGVudCA9IGF0dHJpYnV0ZXNbal0uZXYoZW52KS50b1hNTChlbnYsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4ICYmIHguc2VyaWFsaXphdGlvbiAmJiB4LnNlcmlhbGl6YXRpb24gPT09ICd0YWcnKSB7XG4gICAgICAgICAgICAgICAgc2VsZmNsb3NpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0YWdjb250ZW50ID0gYXR0cmlidXRlc1tqXS5ldihlbnYpLnRvWE1MKGVudiwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHhtbCArPSBhdHRyaWJ1dGVzW2pdLmV2KGVudikudG9YTUwoZW52KSArICcgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZmNsb3NpbmcpIHtcbiAgICAgICAgICAgIHhtbCArPSAnLz5cXG4nO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0YWdjb250ZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBpZiAodGFnY29udGVudC5pbmRleE9mKCc8JykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICB4bWwgKz0gJz4nICsgdGFnY29udGVudCArICc8LycgKyBuYW1lICsgJz5cXG4nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB4bWwgKz0gJz48IVtDREFUQVsnICsgdGFnY29udGVudCArICddXT48LycgKyBuYW1lICsgJz5cXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghc3ltX2NvdW50IHx8ICF4bWwpIHJldHVybiAnJztcbiAgICByZXR1cm4gJyAgPFJ1bGU+XFxuJyArIHhtbCArICcgIDwvUnVsZT5cXG4nO1xufTtcblxuLy8gVGFrZSBhIHpvb20gcmFuZ2Ugb2Ygem9vbXMgYW5kICdpJywgdGhlIGluZGV4IG9mIGEgcnVsZSBpbiB0aGlzLnJ1bGVzLFxuLy8gYW5kIGZpbmRzIGFsbCBhcHBsaWNhYmxlIHN5bWJvbGl6ZXJzXG50cmVlLkRlZmluaXRpb24ucHJvdG90eXBlLmNvbGxlY3RTeW1ib2xpemVycyA9IGZ1bmN0aW9uKHpvb21zLCBpKSB7XG4gICAgdmFyIHN5bWJvbGl6ZXJzID0ge30sIGNoaWxkO1xuXG4gICAgZm9yICh2YXIgaiA9IGk7IGogPCB0aGlzLnJ1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNoaWxkID0gdGhpcy5ydWxlc1tqXTtcbiAgICAgICAgdmFyIGtleSA9IGNoaWxkLmluc3RhbmNlICsgJy8nICsgY2hpbGQuc3ltYm9saXplcjtcbiAgICAgICAgaWYgKHpvb21zLmN1cnJlbnQgJiBjaGlsZC56b29tICYmXG4gICAgICAgICAgICghKGtleSBpbiBzeW1ib2xpemVycykgfHxcbiAgICAgICAgICAgKCEoY2hpbGQubmFtZSBpbiBzeW1ib2xpemVyc1trZXldKSkpKSB7XG4gICAgICAgICAgICB6b29tcy5jdXJyZW50ICY9IGNoaWxkLnpvb207XG4gICAgICAgICAgICBpZiAoIShrZXkgaW4gc3ltYm9saXplcnMpKSB7XG4gICAgICAgICAgICAgICAgc3ltYm9saXplcnNba2V5XSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3ltYm9saXplcnNba2V5XVtjaGlsZC5uYW1lXSA9IGNoaWxkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5rZXlzKHN5bWJvbGl6ZXJzKS5sZW5ndGgpIHtcbiAgICAgICAgem9vbXMucnVsZSAmPSAoem9vbXMuYXZhaWxhYmxlICY9IH56b29tcy5jdXJyZW50KTtcbiAgICAgICAgcmV0dXJuIHN5bWJvbGl6ZXJzO1xuICAgIH1cbn07XG5cbi8vIFRoZSB0cmVlLlpvb20udG9TdHJpbmcgZnVuY3Rpb24gaWdub3JlcyB0aGUgaG9sZXMgaW4gem9vbSByYW5nZXMgYW5kIG91dHB1dHNcbi8vIHNjYWxlZGVub21pbmF0b3JzIHRoYXQgY292ZXIgdGhlIHdob2xlIHJhbmdlIGZyb20gdGhlIGZpcnN0IHRvIGxhc3QgYml0IHNldC5cbi8vIFRoaXMgYWxnb3JpdGhtIGNhbiBwcm9kdWNlcyB6b29tIHJhbmdlcyB0aGF0IG1heSBoYXZlIGhvbGVzLiBIb3dldmVyLFxuLy8gd2hlbiB1c2luZyB0aGUgZmlsdGVyLW1vZGU9XCJmaXJzdFwiLCBtb3JlIHNwZWNpZmljIHpvb20gZmlsdGVycyB3aWxsIGFsd2F5c1xuLy8gZW5kIHVwIGJlZm9yZSBicm9hZGVyIHJhbmdlcy4gVGhlIGZpbHRlci1tb2RlIHdpbGwgcGljayB0aG9zZSBmaXJzdCBiZWZvcmVcbi8vIHJlc29ydGluZyB0byB0aGUgem9vbSByYW5nZSB3aXRoIHRoZSBob2xlIGFuZCBzdG9wIHByb2Nlc3NpbmcgZnVydGhlciBydWxlcy5cbnRyZWUuRGVmaW5pdGlvbi5wcm90b3R5cGUudG9YTUwgPSBmdW5jdGlvbihlbnYsIGV4aXN0aW5nKSB7XG4gICAgdmFyIGZpbHRlciA9IHRoaXMuZmlsdGVycy50b1N0cmluZygpO1xuICAgIGlmICghKGZpbHRlciBpbiBleGlzdGluZykpIGV4aXN0aW5nW2ZpbHRlcl0gPSB0cmVlLlpvb20uYWxsO1xuXG4gICAgdmFyIGF2YWlsYWJsZSA9IHRyZWUuWm9vbS5hbGwsIHhtbCA9ICcnLCB6b29tLCBzeW1ib2xpemVycyxcbiAgICAgICAgem9vbXMgPSB7IGF2YWlsYWJsZTogdHJlZS5ab29tLmFsbCB9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ydWxlcy5sZW5ndGggJiYgYXZhaWxhYmxlOyBpKyspIHtcbiAgICAgICAgem9vbXMucnVsZSA9IHRoaXMucnVsZXNbaV0uem9vbTtcbiAgICAgICAgaWYgKCEoZXhpc3RpbmdbZmlsdGVyXSAmIHpvb21zLnJ1bGUpKSBjb250aW51ZTtcblxuICAgICAgICB3aGlsZSAoem9vbXMuY3VycmVudCA9IHpvb21zLnJ1bGUgJiBhdmFpbGFibGUpIHtcbiAgICAgICAgICAgIGlmIChzeW1ib2xpemVycyA9IHRoaXMuY29sbGVjdFN5bWJvbGl6ZXJzKHpvb21zLCBpKSkge1xuICAgICAgICAgICAgICAgIGlmICghKGV4aXN0aW5nW2ZpbHRlcl0gJiB6b29tcy5jdXJyZW50KSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgeG1sICs9IHRoaXMuc3ltYm9saXplcnNUb1hNTChlbnYsIHN5bWJvbGl6ZXJzLFxuICAgICAgICAgICAgICAgICAgICAobmV3IHRyZWUuWm9vbSgpKS5zZXRab29tKGV4aXN0aW5nW2ZpbHRlcl0gJiB6b29tcy5jdXJyZW50KSk7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdbZmlsdGVyXSAmPSB+em9vbXMuY3VycmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB4bWw7XG59O1xuXG50cmVlLkRlZmluaXRpb24ucHJvdG90eXBlLnRvSlMgPSBmdW5jdGlvbihlbnYpIHtcbiAgdmFyIHNoYWRlckF0dHJzID0ge307XG5cbiAgLy8gbWVyZ2UgY29uZGl0aW9ucyBmcm9tIGZpbHRlcnMgd2l0aCB6b29tIGNvbmRpdGlvbiBvZiB0aGVcbiAgLy8gZGVmaW5pdGlvblxuICB2YXIgem9vbSA9IFwiKFwiICsgdGhpcy56b29tICsgXCIgJiAoMSA8PCBjdHguem9vbSkpXCI7XG4gIHZhciBmcmFtZV9vZmZzZXQgPSB0aGlzLmZyYW1lX29mZnNldDtcbiAgdmFyIF9pZiA9IHRoaXMuZmlsdGVycy50b0pTKGVudik7XG4gIHZhciBmaWx0ZXJzID0gW3pvb21dO1xuICBpZihfaWYpIGZpbHRlcnMucHVzaChfaWYpO1xuICBpZihmcmFtZV9vZmZzZXQpIGZpbHRlcnMucHVzaCgnY3R4W1wiZnJhbWUtb2Zmc2V0XCJdID09PSAnICsgZnJhbWVfb2Zmc2V0KTtcbiAgX2lmID0gZmlsdGVycy5qb2luKFwiICYmIFwiKTtcbiAgXy5lYWNoKHRoaXMucnVsZXMsIGZ1bmN0aW9uKHJ1bGUpIHtcbiAgICAgIGlmKHJ1bGUgaW5zdGFuY2VvZiB0cmVlLlJ1bGUpIHtcbiAgICAgICAgc2hhZGVyQXR0cnNbcnVsZS5uYW1lXSA9IHNoYWRlckF0dHJzW3J1bGUubmFtZV0gfHwgW107XG5cbiAgICAgICAgdmFyIHIgPSB7XG4gICAgICAgICAgaW5kZXg6IHJ1bGUuaW5kZXgsXG4gICAgICAgICAgc3ltYm9saXplcjogcnVsZS5zeW1ib2xpemVyXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKF9pZikge1xuICAgICAgICAgIHIuanMgPSBcImlmKFwiICsgX2lmICsgXCIpe1wiICsgcnVsZS52YWx1ZS50b0pTKGVudikgKyBcIn1cIlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHIuanMgPSBydWxlLnZhbHVlLnRvSlMoZW52KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHIuY29uc3RhbnQgPSBydWxlLnZhbHVlLmV2KGVudikuaXMgIT09ICdmaWVsZCc7XG4gICAgICAgIHIuZmlsdGVyZWQgPSAhIV9pZjtcblxuICAgICAgICBzaGFkZXJBdHRyc1tydWxlLm5hbWVdLnB1c2gocik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSdWxlc2V0IG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICAgIC8vaWYgKHJ1bGUgaW5zdGFuY2VvZiB0cmVlLlJ1bGVzZXQpIHtcbiAgICAgICAgICAvL3ZhciBzaCA9IHJ1bGUudG9KUyhlbnYpO1xuICAgICAgICAgIC8vZm9yKHZhciB2IGluIHNoKSB7XG4gICAgICAgICAgICAvL3NoYWRlckF0dHJzW3ZdID0gc2hhZGVyQXR0cnNbdl0gfHwgW107XG4gICAgICAgICAgICAvL2Zvcih2YXIgYXR0ciBpbiBzaFt2XSkge1xuICAgICAgICAgICAgICAvL3NoYWRlckF0dHJzW3ZdLnB1c2goc2hbdl1bYXR0cl0pO1xuICAgICAgICAgICAgLy99XG4gICAgICAgICAgLy99XG4gICAgICAgIC8vfVxuICAgICAgfVxuICB9KTtcbiAgcmV0dXJuIHNoYWRlckF0dHJzO1xufTtcblxuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuLy9cbi8vIEEgbnVtYmVyIHdpdGggYSB1bml0XG4vL1xudHJlZS5EaW1lbnNpb24gPSBmdW5jdGlvbiBEaW1lbnNpb24odmFsdWUsIHVuaXQsIGluZGV4KSB7XG4gICAgdGhpcy52YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xuICAgIHRoaXMudW5pdCA9IHVuaXQgfHwgbnVsbDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG59O1xuXG50cmVlLkRpbWVuc2lvbi5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICdmbG9hdCcsXG4gICAgcGh5c2ljYWxfdW5pdHM6IFsnbScsICdjbScsICdpbicsICdtbScsICdwdCcsICdwYyddLFxuICAgIHNjcmVlbl91bml0czogWydweCcsICclJ10sXG4gICAgYWxsX3VuaXRzOiBbJ20nLCAnY20nLCAnaW4nLCAnbW0nLCAncHQnLCAncGMnLCAncHgnLCAnJSddLFxuICAgIGRlbnNpdGllczoge1xuICAgICAgICBtOiAwLjAyNTQsXG4gICAgICAgIG1tOiAyNS40LFxuICAgICAgICBjbTogMi41NCxcbiAgICAgICAgcHQ6IDcyLFxuICAgICAgICBwYzogNlxuICAgIH0sXG4gICAgZXY6IGZ1bmN0aW9uIChlbnYpIHtcbiAgICAgICAgaWYgKHRoaXMudW5pdCAmJiAhXy5jb250YWlucyh0aGlzLmFsbF91bml0cywgdGhpcy51bml0KSkge1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIkludmFsaWQgdW5pdDogJ1wiICsgdGhpcy51bml0ICsgXCInXCIsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHsgaXM6ICd1bmRlZmluZWQnLCB2YWx1ZTogJ3VuZGVmaW5lZCcgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vcm1hbGl6ZSB1bml0cyB3aGljaCBhcmUgbm90IHB4IG9yICVcbiAgICAgICAgaWYgKHRoaXMudW5pdCAmJiBfLmNvbnRhaW5zKHRoaXMucGh5c2ljYWxfdW5pdHMsIHRoaXMudW5pdCkpIHtcbiAgICAgICAgICAgIGlmICghZW52LnBwaSkge1xuICAgICAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwicHBpIGlzIG5vdCBzZXQsIHNvIG1ldHJpYyB1bml0cyBjYW4ndCBiZSB1c2VkXCIsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgaXM6ICd1bmRlZmluZWQnLCB2YWx1ZTogJ3VuZGVmaW5lZCcgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnZlcnQgYWxsIHVuaXRzIHRvIGluY2hcbiAgICAgICAgICAgIC8vIGNvbnZlcnQgaW5jaCB0byBweCB1c2luZyBwcGlcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAodGhpcy52YWx1ZSAvIHRoaXMuZGVuc2l0aWVzW3RoaXMudW5pdF0pICogZW52LnBwaTtcbiAgICAgICAgICAgIHRoaXMudW5pdCA9ICdweCc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJvdW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IE1hdGgucm91bmQodGhpcy52YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgdG9Db2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5Db2xvcihbdGhpcy52YWx1ZSwgdGhpcy52YWx1ZSwgdGhpcy52YWx1ZV0pO1xuICAgIH0sXG4gICAgcm91bmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gTWF0aC5yb3VuZCh0aGlzLnZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfSxcbiAgICBvcGVyYXRlOiBmdW5jdGlvbihlbnYsIG9wLCBvdGhlcikge1xuICAgICAgICBpZiAodGhpcy51bml0ID09PSAnJScgJiYgb3RoZXIudW5pdCAhPT0gJyUnKSB7XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJZiB0d28gb3BlcmFuZHMgZGlmZmVyLCB0aGUgZmlyc3QgbXVzdCBub3QgYmUgJScsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpczogJ3VuZGVmaW5lZCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudW5pdCAhPT0gJyUnICYmIG90aGVyLnVuaXQgPT09ICclJykge1xuICAgICAgICAgICAgaWYgKG9wID09PSAnKicgfHwgb3AgPT09ICcvJyB8fCBvcCA9PT0gJyUnKSB7XG4gICAgICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1BlcmNlbnQgdmFsdWVzIGNhbiBvbmx5IGJlIGFkZGVkIG9yIHN1YnRyYWN0ZWQgZnJvbSBvdGhlciB2YWx1ZXMnLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkRpbWVuc2lvbih0cmVlLm9wZXJhdGUob3AsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUsIHRoaXMudmFsdWUgKiBvdGhlci52YWx1ZSAqIDAuMDEpLFxuICAgICAgICAgICAgICAgIHRoaXMudW5pdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2hlcmUgdGhlIG9wZXJhbmRzIGFyZSBlaXRoZXIgdGhlIHNhbWUgKCUgb3IgdW5kZWZpbmVkIG9yIHB4KSwgb3Igb25lIGlzIHVuZGVmaW5lZCBhbmQgdGhlIG90aGVyIGlzIHB4XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5EaW1lbnNpb24odHJlZS5vcGVyYXRlKG9wLCB0aGlzLnZhbHVlLCBvdGhlci52YWx1ZSksXG4gICAgICAgICAgICB0aGlzLnVuaXQgfHwgb3RoZXIudW5pdCk7XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbi8vIEFuIGVsZW1lbnQgaXMgYW4gaWQgb3IgY2xhc3Mgc2VsZWN0b3JcbnRyZWUuRWxlbWVudCA9IGZ1bmN0aW9uIEVsZW1lbnQodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWUudHJpbSgpO1xuICAgIGlmICh0aGlzLnZhbHVlWzBdID09PSAnIycpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2lkJztcbiAgICAgICAgdGhpcy5jbGVhbiA9IHRoaXMudmFsdWUucmVwbGFjZSgvXiMvLCAnJyk7XG4gICAgfVxuICAgIGlmICh0aGlzLnZhbHVlWzBdID09PSAnLicpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2NsYXNzJztcbiAgICAgICAgdGhpcy5jbGVhbiA9IHRoaXMudmFsdWUucmVwbGFjZSgvXlxcLi8sICcnKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudmFsdWUuaW5kZXhPZignKicpICE9PSAtMSkge1xuICAgICAgICB0aGlzLnR5cGUgPSAnd2lsZGNhcmQnO1xuICAgIH1cbn07XG5cbi8vIERldGVybWluZSB0aGUgJ3NwZWNpZmljaXR5IG1hdHJpeCcgb2YgdGhpc1xuLy8gc3BlY2lmaWMgc2VsZWN0b3JcbnRyZWUuRWxlbWVudC5wcm90b3R5cGUuc3BlY2lmaWNpdHkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAodGhpcy50eXBlID09PSAnaWQnKSA/IDEgOiAwLCAvLyBhXG4gICAgICAgICh0aGlzLnR5cGUgPT09ICdjbGFzcycpID8gMSA6IDAgIC8vIGJcbiAgICBdO1xufTtcblxudHJlZS5FbGVtZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy52YWx1ZTsgfTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuRXhwcmVzc2lvbiA9IGZ1bmN0aW9uIEV4cHJlc3Npb24odmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG59O1xuXG50cmVlLkV4cHJlc3Npb24ucHJvdG90eXBlID0ge1xuICAgIGlzOiAnZXhwcmVzc2lvbicsXG4gICAgZXY6IGZ1bmN0aW9uKGVudikge1xuICAgICAgICBpZiAodGhpcy52YWx1ZS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHRyZWUuRXhwcmVzc2lvbih0aGlzLnZhbHVlLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGUuZXYoZW52KTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlWzBdLmV2KGVudik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKGVudikge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUudG9TdHJpbmcoZW52KTtcbiAgICAgICAgfSkuam9pbignICcpO1xuICAgIH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLkZpZWxkID0gZnVuY3Rpb24gRmllbGQoY29udGVudCkge1xuICAgIHRoaXMudmFsdWUgPSBjb250ZW50IHx8ICcnO1xufTtcblxudHJlZS5GaWVsZC5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICdmaWVsZCcsXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ1snICsgdGhpcy52YWx1ZSArICddJztcbiAgICB9LFxuICAgICdldic6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5GaWx0ZXIgPSBmdW5jdGlvbiBGaWx0ZXIoa2V5LCBvcCwgdmFsLCBpbmRleCwgZmlsZW5hbWUpIHtcbiAgICB0aGlzLmtleSA9IGtleTtcbiAgICB0aGlzLm9wID0gb3A7XG4gICAgdGhpcy52YWwgPSB2YWw7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMuZmlsZW5hbWUgPSBmaWxlbmFtZTtcblxuICAgIHRoaXMuaWQgPSB0aGlzLmtleSArIHRoaXMub3AgKyB0aGlzLnZhbDtcbn07XG5cbi8vIHhtbHNhZmUsIG51bWVyaWMsIHN1ZmZpeFxudmFyIG9wcyA9IHtcbiAgICAnPCc6IFsnICZsdDsgJywgJ251bWVyaWMnXSxcbiAgICAnPic6IFsnICZndDsgJywgJ251bWVyaWMnXSxcbiAgICAnPSc6IFsnID0gJywgJ2JvdGgnXSxcbiAgICAnIT0nOiBbJyAhPSAnLCAnYm90aCddLFxuICAgICc8PSc6IFsnICZsdDs9ICcsICdudW1lcmljJ10sXG4gICAgJz49JzogWycgJmd0Oz0gJywgJ251bWVyaWMnXSxcbiAgICAnPX4nOiBbJy5tYXRjaCgnLCAnc3RyaW5nJywgJyknXVxufTtcblxudHJlZS5GaWx0ZXIucHJvdG90eXBlLmV2ID0gZnVuY3Rpb24oZW52KSB7XG4gICAgdGhpcy5rZXkgPSB0aGlzLmtleS5ldihlbnYpO1xuICAgIHRoaXMudmFsID0gdGhpcy52YWwuZXYoZW52KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbnRyZWUuRmlsdGVyLnByb3RvdHlwZS50b1hNTCA9IGZ1bmN0aW9uKGVudikge1xuICAgIGlmICh0cmVlLlJlZmVyZW5jZS5kYXRhLmZpbHRlcikge1xuICAgICAgICBpZiAodGhpcy5rZXkuaXMgPT09ICdrZXl3b3JkJyAmJiAtMSA9PT0gdHJlZS5SZWZlcmVuY2UuZGF0YS5maWx0ZXIudmFsdWUuaW5kZXhPZih0aGlzLmtleS50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiB0aGlzLmtleS50b1N0cmluZygpICsgJyBpcyBub3QgYSB2YWxpZCBrZXl3b3JkIGluIGEgZmlsdGVyIGV4cHJlc3Npb24nLFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy52YWwuaXMgPT09ICdrZXl3b3JkJyAmJiAtMSA9PT0gdHJlZS5SZWZlcmVuY2UuZGF0YS5maWx0ZXIudmFsdWUuaW5kZXhPZih0aGlzLnZhbC50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiB0aGlzLnZhbC50b1N0cmluZygpICsgJyBpcyBub3QgYSB2YWxpZCBrZXl3b3JkIGluIGEgZmlsdGVyIGV4cHJlc3Npb24nLFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIga2V5ID0gdGhpcy5rZXkudG9TdHJpbmcoZmFsc2UpO1xuICAgIHZhciB2YWwgPSB0aGlzLnZhbC50b1N0cmluZyh0aGlzLnZhbC5pcyA9PSAnc3RyaW5nJyk7XG5cbiAgICBpZiAoXG4gICAgICAgIChvcHNbdGhpcy5vcF1bMV0gPT0gJ251bWVyaWMnICYmIGlzTmFOKHZhbCkgJiYgdGhpcy52YWwuaXMgIT09ICdmaWVsZCcpIHx8XG4gICAgICAgIChvcHNbdGhpcy5vcF1bMV0gPT0gJ3N0cmluZycgJiYgKHZhbClbMF0gIT0gXCInXCIpXG4gICAgKSB7XG4gICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICBtZXNzYWdlOiAnQ2Fubm90IHVzZSBvcGVyYXRvciBcIicgKyB0aGlzLm9wICsgJ1wiIHdpdGggdmFsdWUgJyArIHRoaXMudmFsLFxuICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4ga2V5ICsgb3BzW3RoaXMub3BdWzBdICsgdmFsICsgKG9wc1t0aGlzLm9wXVsyXSB8fCAnJyk7XG59O1xuXG50cmVlLkZpbHRlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJ1snICsgdGhpcy5pZCArICddJztcbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCJ2YXIgdHJlZSA9IHJlcXVpcmUoJy4uL3RyZWUnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG50cmVlLkZpbHRlcnNldCA9IGZ1bmN0aW9uIEZpbHRlcnNldCgpIHtcbiAgICB0aGlzLmZpbHRlcnMgPSB7fTtcbn07XG5cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS50b1hNTCA9IGZ1bmN0aW9uKGVudikge1xuICAgIHZhciBmaWx0ZXJzID0gW107XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgIGZpbHRlcnMucHVzaCgnKCcgKyB0aGlzLmZpbHRlcnNbaWRdLnRvWE1MKGVudikudHJpbSgpICsgJyknKTtcbiAgICB9XG4gICAgaWYgKGZpbHRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAnICAgIDxGaWx0ZXI+JyArIGZpbHRlcnMuam9pbignIGFuZCAnKSArICc8L0ZpbHRlcj5cXG4nO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59O1xuXG50cmVlLkZpbHRlcnNldC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJyID0gW107XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5maWx0ZXJzKSBhcnIucHVzaCh0aGlzLmZpbHRlcnNbaWRdLmlkKTtcbiAgICByZXR1cm4gYXJyLnNvcnQoKS5qb2luKCdcXHQnKTtcbn07XG5cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS5ldiA9IGZ1bmN0aW9uKGVudikge1xuICAgIGZvciAodmFyIGkgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgIHRoaXMuZmlsdGVyc1tpXS5ldihlbnYpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjbG9uZSA9IG5ldyB0cmVlLkZpbHRlcnNldCgpO1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICBjbG9uZS5maWx0ZXJzW2lkXSA9IHRoaXMuZmlsdGVyc1tpZF07XG4gICAgfVxuICAgIHJldHVybiBjbG9uZTtcbn07XG5cbi8vIE5vdGU6IG90aGVyIGhhcyB0byBiZSBhIHRyZWUuRmlsdGVyc2V0LlxudHJlZS5GaWx0ZXJzZXQucHJvdG90eXBlLmNsb25lV2l0aCA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgdmFyIGFkZGl0aW9ucyA9IFtdO1xuICAgIGZvciAodmFyIGlkIGluIG90aGVyLmZpbHRlcnMpIHtcbiAgICAgICAgdmFyIHN0YXR1cyA9IHRoaXMuYWRkYWJsZShvdGhlci5maWx0ZXJzW2lkXSk7XG4gICAgICAgIC8vIHN0YXR1cyBpcyB0cnVlLCBmYWxzZSBvciBudWxsLiBpZiBpdCdzIG51bGwgd2UgZG9uJ3QgZmFpbCB0aGlzXG4gICAgICAgIC8vIGNsb25lIG5vciBkbyB3ZSBhZGQgdGhlIGZpbHRlci5cbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhdHVzID09PSB0cnVlKSB7XG4gICAgICAgICAgICAvLyBBZGRpbmcgdGhlIGZpbHRlciB3aWxsIG92ZXJyaWRlIGFub3RoZXIgdmFsdWUuXG4gICAgICAgICAgICBhZGRpdGlvbnMucHVzaChvdGhlci5maWx0ZXJzW2lkXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGRpbmcgdGhlIG90aGVyIGZpbHRlcnMgZG9lc24ndCBtYWtlIHRoaXMgZmlsdGVyc2V0IGludmFsaWQsIGJ1dCBpdFxuICAgIC8vIGRvZXNuJ3QgYWRkIGFueXRoaW5nIHRvIGl0IGVpdGhlci5cbiAgICBpZiAoIWFkZGl0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gV2UgY2FuIHN1Y2Nlc3NmdWxseSBhZGQgYWxsIGZpbHRlcnMuIE5vdyBjbG9uZSB0aGUgZmlsdGVyc2V0IGFuZCBhZGQgdGhlXG4gICAgLy8gbmV3IHJ1bGVzLlxuICAgIHZhciBjbG9uZSA9IG5ldyB0cmVlLkZpbHRlcnNldCgpO1xuXG4gICAgLy8gV2UgY2FuIGFkZCB0aGUgcnVsZXMgdGhhdCBhcmUgYWxyZWFkeSBwcmVzZW50IHdpdGhvdXQgZ29pbmcgdGhyb3VnaCB0aGVcbiAgICAvLyBhZGQgZnVuY3Rpb24gYXMgYSBGaWx0ZXJzZXQgaXMgYWx3YXlzIGluIGl0J3Mgc2ltcGxlc3QgY2Fub25pY2FsIGZvcm0uXG4gICAgZm9yIChpZCBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgY2xvbmUuZmlsdGVyc1tpZF0gPSB0aGlzLmZpbHRlcnNbaWRdO1xuICAgIH1cblxuICAgIC8vIE9ubHkgYWRkIG5ldyBmaWx0ZXJzIHRoYXQgYWN0dWFsbHkgY2hhbmdlIHRoZSBmaWx0ZXIuXG4gICAgd2hpbGUgKGlkID0gYWRkaXRpb25zLnNoaWZ0KCkpIHtcbiAgICAgICAgY2xvbmUuYWRkKGlkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmU7XG59O1xuXG50cmVlLkZpbHRlcnNldC5wcm90b3R5cGUudG9KUyA9IGZ1bmN0aW9uKGVudikge1xuICB2YXIgb3BNYXAgPSB7XG4gICAgJz0nOiAnPT09J1xuICB9O1xuICByZXR1cm4gXy5tYXAodGhpcy5maWx0ZXJzLCBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICB2YXIgb3AgPSBmaWx0ZXIub3A7XG4gICAgaWYob3AgaW4gb3BNYXApIHtcbiAgICAgIG9wID0gb3BNYXBbb3BdO1xuICAgIH1cbiAgICB2YXIgdmFsID0gZmlsdGVyLnZhbDtcbiAgICBpZihmaWx0ZXIuX3ZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YWwgPSBmaWx0ZXIuX3ZhbC50b1N0cmluZyh0cnVlKTtcbiAgICB9XG4gICAgdmFyIGF0dHJzID0gXCJkYXRhXCI7XG4gICAgcmV0dXJuIGF0dHJzICsgXCIuXCIgKyBmaWx0ZXIua2V5LnZhbHVlICArIFwiIFwiICsgb3AgKyBcIiBcIiArICh2YWwuaXMgPT09ICdzdHJpbmcnID8gXCInXCIrIHZhbCArXCInXCIgOiB2YWwpO1xuICB9KS5qb2luKCcgJiYgJyk7XG59O1xuXG4vLyBSZXR1cm5zIHRydWUgd2hlbiB0aGUgbmV3IGZpbHRlciBjYW4gYmUgYWRkZWQsIGZhbHNlIG90aGVyd2lzZS5cbi8vIEl0IGNhbiBhbHNvIHJldHVybiBudWxsLCBhbmQgb24gdGhlIG90aGVyIHNpZGUgd2UgdGVzdCBmb3IgPT09IHRydWUgb3Jcbi8vIGZhbHNlXG50cmVlLkZpbHRlcnNldC5wcm90b3R5cGUuYWRkYWJsZSA9IGZ1bmN0aW9uKGZpbHRlcikge1xuICAgIHZhciBrZXkgPSBmaWx0ZXIua2V5LnRvU3RyaW5nKCksXG4gICAgICAgIHZhbHVlID0gZmlsdGVyLnZhbC50b1N0cmluZygpO1xuXG4gICAgaWYgKHZhbHVlLm1hdGNoKC9eWzAtOV0rKFxcLlswLTldKik/JC8pKSB2YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xuXG4gICAgc3dpdGNoIChmaWx0ZXIub3ApIHtcbiAgICAgICAgY2FzZSAnPSc6XG4gICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBhbHJlYWR5IGZvbz0gYW5kIHdlJ3JlIGFkZGluZyBmb289XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc9J10gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nXS52YWwudG9TdHJpbmcoKSAhPSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnIT0nICsgdmFsdWVdICE9PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz4nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPiddLnZhbCA+PSB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPCddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8J10udmFsIDw9IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+PSddICE9PSB1bmRlZmluZWQgICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXS52YWwgPiB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXSAhPT0gdW5kZWZpbmVkICAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzw9J10udmFsIDwgdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGNhc2UgJz1+JzpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGNhc2UgJyE9JzpcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gKHRoaXMuZmlsdGVyc1trZXkgKyAnPSddLnZhbCA9PSB2YWx1ZSkgPyBmYWxzZSA6IG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICchPScgKyB2YWx1ZV0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz4nXS52YWwgPj0gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPCddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8J10udmFsIDw9IHZhbHVlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz49J10gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz49J10udmFsID4gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXS52YWwgPCB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBjYXNlICc+JzpcbiAgICAgICAgICAgIGlmIChrZXkgKyAnPScgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPSddLnZhbCA8PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPCddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8J10udmFsIDw9IHZhbHVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8PSddICE9PSB1bmRlZmluZWQgICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXS52YWwgPD0gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz4nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPiddLnZhbCA+PSB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+PSddICE9PSB1bmRlZmluZWQgICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXS52YWwgPiB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBjYXNlICc+PSc6XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc9JyBdICE9PSB1bmRlZmluZWQpIHJldHVybiAodGhpcy5maWx0ZXJzW2tleSArICc9J10udmFsIDwgdmFsdWUpID8gZmFsc2UgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPCcgXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPCddLnZhbCA8PSB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXS52YWwgPCB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPicgXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPiddLnZhbCA+PSB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc+PSddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc+PSddLnZhbCA+PSB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBjYXNlICc8JzpcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nIF0gIT09IHVuZGVmaW5lZCkgcmV0dXJuICh0aGlzLmZpbHRlcnNba2V5ICsgJz0nXS52YWwgPj0gdmFsdWUpID8gZmFsc2UgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPicgXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPiddLnZhbCA+PSB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXS52YWwgPj0gdmFsdWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcnNba2V5ICsgJzwnIF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJzwnXS52YWwgPD0gdmFsdWUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXS52YWwgPCB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBjYXNlICc8PSc6XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc9JyBdICE9PSB1bmRlZmluZWQpIHJldHVybiAodGhpcy5maWx0ZXJzW2tleSArICc9J10udmFsID4gdmFsdWUpID8gZmFsc2UgOiBudWxsO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPicgXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPiddLnZhbCA+PSB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXS52YWwgPiB2YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnPCcgXSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmlsdGVyc1trZXkgKyAnPCddLnZhbCA8PSB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tleSArICc8PSddICE9PSB1bmRlZmluZWQgJiYgdGhpcy5maWx0ZXJzW2tleSArICc8PSddLnZhbCA8PSB2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59O1xuXG4vLyBEb2VzIHRoZSBuZXcgZmlsdGVyIGNvbnN0aXR1dGUgYSBjb25mbGljdD9cbnRyZWUuRmlsdGVyc2V0LnByb3RvdHlwZS5jb25mbGljdCA9IGZ1bmN0aW9uKGZpbHRlcikge1xuICAgIHZhciBrZXkgPSBmaWx0ZXIua2V5LnRvU3RyaW5nKCksXG4gICAgICAgIHZhbHVlID0gZmlsdGVyLnZhbC50b1N0cmluZygpO1xuXG4gICAgaWYgKCFpc05hTihwYXJzZUZsb2F0KHZhbHVlKSkpIHZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZSk7XG5cbiAgICAvLyBpZiAoYT1iKSAmJiAoYT1jKVxuICAgIC8vIGlmIChhPWIpICYmIChhIT1iKVxuICAgIC8vIG9yIChhIT1iKSAmJiAoYT1iKVxuICAgIGlmICgoZmlsdGVyLm9wID09PSAnPScgJiYgdGhpcy5maWx0ZXJzW2tleSArICc9J10gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICB2YWx1ZSAhPSB0aGlzLmZpbHRlcnNba2V5ICsgJz0nXS52YWwudG9TdHJpbmcoKSkgfHxcbiAgICAgICAgKGZpbHRlci5vcCA9PT0gJyE9JyAmJiB0aGlzLmZpbHRlcnNba2V5ICsgJz0nXSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIHZhbHVlID09IHRoaXMuZmlsdGVyc1trZXkgKyAnPSddLnZhbC50b1N0cmluZygpKSB8fFxuICAgICAgICAoZmlsdGVyLm9wID09PSAnPScgJiYgdGhpcy5maWx0ZXJzW2tleSArICchPSddICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgdmFsdWUgPT0gdGhpcy5maWx0ZXJzW2tleSArICchPSddLnZhbC50b1N0cmluZygpKSkge1xuICAgICAgICByZXR1cm4gZmlsdGVyLnRvU3RyaW5nKCkgKyAnIGFkZGVkIHRvICcgKyB0aGlzLnRvU3RyaW5nKCkgKyAnIHByb2R1Y2VzIGFuIGludmFsaWQgZmlsdGVyJztcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG4vLyBPbmx5IGNhbGwgdGhpcyBmdW5jdGlvbiBmb3IgZmlsdGVycyB0aGF0IGhhdmUgYmVlbiBjbGVhcmVkIGJ5IC5hZGRhYmxlKCkuXG50cmVlLkZpbHRlcnNldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZmlsdGVyLCBlbnYpIHtcbiAgICB2YXIga2V5ID0gZmlsdGVyLmtleS50b1N0cmluZygpLFxuICAgICAgICBpZCxcbiAgICAgICAgb3AgPSBmaWx0ZXIub3AsXG4gICAgICAgIGNvbmZsaWN0ID0gdGhpcy5jb25mbGljdChmaWx0ZXIpLFxuICAgICAgICBudW12YWw7XG5cbiAgICBpZiAoY29uZmxpY3QpIHJldHVybiBjb25mbGljdDtcblxuICAgIGlmIChvcCA9PT0gJz0nKSB7XG4gICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2ldLmtleSA9PSBrZXkpIGRlbGV0ZSB0aGlzLmZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maWx0ZXJzW2tleSArICc9J10gPSBmaWx0ZXI7XG4gICAgfSBlbHNlIGlmIChvcCA9PT0gJyE9Jykge1xuICAgICAgICB0aGlzLmZpbHRlcnNba2V5ICsgJyE9JyArIGZpbHRlci52YWxdID0gZmlsdGVyO1xuICAgIH0gZWxzZSBpZiAob3AgPT09ICc9ficpIHtcbiAgICAgICAgdGhpcy5maWx0ZXJzW2tleSArICc9ficgKyBmaWx0ZXIudmFsXSA9IGZpbHRlcjtcbiAgICB9IGVsc2UgaWYgKG9wID09PSAnPicpIHtcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG90aGVyIGZpbHRlcnMgdGhhdCBhcmUgYWxzbyA+XG4gICAgICAgIC8vIGJ1dCBhcmUgbGVzcyB0aGFuIHRoaXMgb25lLCB0aGV5IGRvbid0IG1hdHRlciwgc29cbiAgICAgICAgLy8gcmVtb3ZlIHRoZW0uXG4gICAgICAgIGZvciAodmFyIGogaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2pdLmtleSA9PSBrZXkgJiYgdGhpcy5maWx0ZXJzW2pdLnZhbCA8PSBmaWx0ZXIudmFsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsdGVyc1tqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpbHRlcnNba2V5ICsgJz4nXSA9IGZpbHRlcjtcbiAgICB9IGVsc2UgaWYgKG9wID09PSAnPj0nKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgICAgICBudW12YWwgPSAoK3RoaXMuZmlsdGVyc1trXS52YWwudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW2tdLmtleSA9PSBrZXkgJiYgbnVtdmFsIDwgZmlsdGVyLnZhbCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbHRlcnNba107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnIT0nICsgZmlsdGVyLnZhbF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsdGVyc1trZXkgKyAnIT0nICsgZmlsdGVyLnZhbF07XG4gICAgICAgICAgICBmaWx0ZXIub3AgPSAnPic7XG4gICAgICAgICAgICB0aGlzLmZpbHRlcnNba2V5ICsgJz4nXSA9IGZpbHRlcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyc1trZXkgKyAnPj0nXSA9IGZpbHRlcjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAob3AgPT09ICc8Jykge1xuICAgICAgICBmb3IgKHZhciBsIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICAgICAgbnVtdmFsID0gKCt0aGlzLmZpbHRlcnNbbF0udmFsLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1tsXS5rZXkgPT0ga2V5ICYmIG51bXZhbCA+PSBmaWx0ZXIudmFsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsdGVyc1tsXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpbHRlcnNba2V5ICsgJzwnXSA9IGZpbHRlcjtcbiAgICB9IGVsc2UgaWYgKG9wID09PSAnPD0nKSB7XG4gICAgICAgIGZvciAodmFyIG0gaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgICAgICBudW12YWwgPSAoK3RoaXMuZmlsdGVyc1ttXS52YWwudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJzW21dLmtleSA9PSBrZXkgJiYgbnVtdmFsID4gZmlsdGVyLnZhbCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbHRlcnNbbV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZmlsdGVyc1trZXkgKyAnIT0nICsgZmlsdGVyLnZhbF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsdGVyc1trZXkgKyAnIT0nICsgZmlsdGVyLnZhbF07XG4gICAgICAgICAgICBmaWx0ZXIub3AgPSAnPCc7XG4gICAgICAgICAgICB0aGlzLmZpbHRlcnNba2V5ICsgJzwnXSA9IGZpbHRlcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyc1trZXkgKyAnPD0nXSA9IGZpbHRlcjtcbiAgICAgICAgfVxuICAgIH1cbn07XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLl9nZXRGb250U2V0ID0gZnVuY3Rpb24oZW52LCBmb250cykge1xuICAgIHZhciBmb250S2V5ID0gZm9udHMuam9pbignJyk7XG4gICAgaWYgKGVudi5fZm9udE1hcCAmJiBlbnYuX2ZvbnRNYXBbZm9udEtleV0pIHtcbiAgICAgICAgcmV0dXJuIGVudi5fZm9udE1hcFtmb250S2V5XTtcbiAgICB9XG5cbiAgICB2YXIgbmV3X2ZvbnRzZXQgPSBuZXcgdHJlZS5Gb250U2V0KGVudiwgZm9udHMpO1xuICAgIGVudi5lZmZlY3RzLnB1c2gobmV3X2ZvbnRzZXQpO1xuICAgIGlmICghZW52Ll9mb250TWFwKSBlbnYuX2ZvbnRNYXAgPSB7fTtcbiAgICBlbnYuX2ZvbnRNYXBbZm9udEtleV0gPSBuZXdfZm9udHNldDtcbiAgICByZXR1cm4gbmV3X2ZvbnRzZXQ7XG59O1xuXG50cmVlLkZvbnRTZXQgPSBmdW5jdGlvbiBGb250U2V0KGVudiwgZm9udHMpIHtcbiAgICB0aGlzLmZvbnRzID0gZm9udHM7XG4gICAgdGhpcy5uYW1lID0gJ2ZvbnRzZXQtJyArIGVudi5lZmZlY3RzLmxlbmd0aDtcbn07XG5cbnRyZWUuRm9udFNldC5wcm90b3R5cGUudG9YTUwgPSBmdW5jdGlvbihlbnYpIHtcbiAgICByZXR1cm4gJzxGb250U2V0IG5hbWU9XCInICtcbiAgICAgICAgdGhpcy5uYW1lICtcbiAgICAgICAgJ1wiPlxcbicgK1xuICAgICAgICB0aGlzLmZvbnRzLm1hcChmdW5jdGlvbihmKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgPEZvbnQgZmFjZS1uYW1lPVwiJyArIGYgKydcIi8+JztcbiAgICAgICAgfSkuam9pbignXFxuJykgK1xuICAgICAgICAnXFxuPC9Gb250U2V0Pic7XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwidmFyIHRyZWUgPSByZXF1aXJlKCcuLi90cmVlJyk7XG5cbi8vIFN0b3JhZ2UgZm9yIEZyYW1lIG9mZnNldCB2YWx1ZVxuLy8gYW5kIHN0b3JlcyB0aGVtIGFzIGJpdC1zZXF1ZW5jZXMgc28gdGhhdCB0aGV5IGNhbiBiZSBjb21iaW5lZCxcbi8vIGludmVydGVkLCBhbmQgY29tcGFyZWQgcXVpY2tseS5cbnRyZWUuRnJhbWVPZmZzZXQgPSBmdW5jdGlvbihvcCwgdmFsdWUsIGluZGV4KSB7XG4gICAgdmFsdWUgPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuICAgIGlmICh2YWx1ZSA+IHRyZWUuRnJhbWVPZmZzZXQubWF4IHx8IHZhbHVlIDw9IDApIHtcbiAgICAgICAgdGhyb3cge1xuICAgICAgICAgICAgbWVzc2FnZTogJ09ubHkgZnJhbWUtb2Zmc2V0IGxldmVscyBiZXR3ZWVuIDEgYW5kICcgK1xuICAgICAgICAgICAgICAgIHRyZWUuRnJhbWVPZmZzZXQubWF4ICsgJyBzdXBwb3J0ZWQuJyxcbiAgICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChvcCAhPT0gJz0nKSB7XG4gICAgICAgIHRocm93IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdvbmx5ID0gb3BlcmF0b3IgaXMgc3VwcG9ydGVkIGZvciBmcmFtZS1vZmZzZXQnLFxuICAgICAgICAgICAgaW5kZXg6IGluZGV4XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn07XG5cbnRyZWUuRnJhbWVPZmZzZXQubWF4ID0gMzI7XG50cmVlLkZyYW1lT2Zmc2V0Lm5vbmUgPSAwO1xuXG4iLCIoZnVuY3Rpb24odHJlZSkge1xuXG50cmVlLkltYWdlRmlsdGVyID0gZnVuY3Rpb24gSW1hZ2VGaWx0ZXIoZmlsdGVyLCBhcmdzKSB7XG4gICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgdGhpcy5hcmdzID0gYXJncyB8fCBudWxsO1xufTtcblxudHJlZS5JbWFnZUZpbHRlci5wcm90b3R5cGUgPSB7XG4gICAgaXM6ICdpbWFnZWZpbHRlcicsXG4gICAgZXY6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSxcblxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyICsgJygnICsgdGhpcy5hcmdzLmpvaW4oJywnKSArICcpJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbHRlcjtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbiAodHJlZSkge1xudHJlZS5JbnZhbGlkID0gZnVuY3Rpb24gSW52YWxpZChjaHVuaywgaW5kZXgsIG1lc3NhZ2UpIHtcbiAgICB0aGlzLmNodW5rID0gY2h1bms7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMudHlwZSA9ICdzeW50YXgnO1xuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgfHwgXCJJbnZhbGlkIGNvZGU6IFwiICsgdGhpcy5jaHVuaztcbn07XG5cbnRyZWUuSW52YWxpZC5wcm90b3R5cGUuaXMgPSAnaW52YWxpZCc7XG5cbnRyZWUuSW52YWxpZC5wcm90b3R5cGUuZXYgPSBmdW5jdGlvbihlbnYpIHtcbiAgICBlbnYuZXJyb3Ioe1xuICAgICAgICBjaHVuazogdGhpcy5jaHVuayxcbiAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgIHR5cGU6ICdzeW50YXgnLFxuICAgICAgICBtZXNzYWdlOiB0aGlzLm1lc3NhZ2UgfHwgXCJJbnZhbGlkIGNvZGU6IFwiICsgdGhpcy5jaHVua1xuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGlzOiAndW5kZWZpbmVkJ1xuICAgIH07XG59O1xufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuS2V5d29yZCA9IGZ1bmN0aW9uIEtleXdvcmQodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgdmFyIHNwZWNpYWwgPSB7XG4gICAgICAgICd0cmFuc3BhcmVudCc6ICdjb2xvcicsXG4gICAgICAgICd0cnVlJzogJ2Jvb2xlYW4nLFxuICAgICAgICAnZmFsc2UnOiAnYm9vbGVhbidcbiAgICB9O1xuICAgIHRoaXMuaXMgPSBzcGVjaWFsW3ZhbHVlXSA/IHNwZWNpYWxbdmFsdWVdIDogJ2tleXdvcmQnO1xufTtcbnRyZWUuS2V5d29yZC5wcm90b3R5cGUgPSB7XG4gICAgZXY6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnZhbHVlOyB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5MYXllclhNTCA9IGZ1bmN0aW9uKG9iaiwgc3R5bGVzKSB7XG4gICAgdmFyIGRzb3B0aW9ucyA9IFtdO1xuICAgIGZvciAodmFyIGkgaW4gb2JqLkRhdGFzb3VyY2UpIHtcbiAgICAgICAgZHNvcHRpb25zLnB1c2goJzxQYXJhbWV0ZXIgbmFtZT1cIicgKyBpICsgJ1wiPjwhW0NEQVRBWycgK1xuICAgICAgICAgICAgb2JqLkRhdGFzb3VyY2VbaV0gKyAnXV0+PC9QYXJhbWV0ZXI+Jyk7XG4gICAgfVxuXG4gICAgdmFyIHByb3Bfc3RyaW5nID0gJyc7XG4gICAgZm9yICh2YXIgcHJvcCBpbiBvYmoucHJvcGVydGllcykge1xuICAgICAgICBpZiAocHJvcCA9PT0gJ21pbnpvb20nKSB7XG4gICAgICAgICAgICBwcm9wX3N0cmluZyArPSAnICBtYXh6b29tPVwiJyArIHRyZWUuWm9vbS5yYW5nZXNbb2JqLnByb3BlcnRpZXNbcHJvcF1dICsgJ1wiXFxuJztcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wID09PSAnbWF4em9vbScpIHtcbiAgICAgICAgICAgIHByb3Bfc3RyaW5nICs9ICcgIG1pbnpvb209XCInICsgdHJlZS5ab29tLnJhbmdlc1tvYmoucHJvcGVydGllc1twcm9wXSsxXSArICdcIlxcbic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9wX3N0cmluZyArPSAnICAnICsgcHJvcCArICc9XCInICsgb2JqLnByb3BlcnRpZXNbcHJvcF0gKyAnXCJcXG4nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuICc8TGF5ZXInICtcbiAgICAgICAgJyBuYW1lPVwiJyArIG9iai5uYW1lICsgJ1wiXFxuJyArXG4gICAgICAgIHByb3Bfc3RyaW5nICtcbiAgICAgICAgKCh0eXBlb2Ygb2JqLnN0YXR1cyA9PT0gJ3VuZGVmaW5lZCcpID8gJycgOiAnICBzdGF0dXM9XCInICsgb2JqLnN0YXR1cyArICdcIlxcbicpICtcbiAgICAgICAgKCh0eXBlb2Ygb2JqLnNycyA9PT0gJ3VuZGVmaW5lZCcpID8gJycgOiAnICBzcnM9XCInICsgb2JqLnNycyArICdcIicpICsgJz5cXG4gICAgJyArXG4gICAgICAgIHN0eWxlcy5yZXZlcnNlKCkubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHJldHVybiAnPFN0eWxlTmFtZT4nICsgcyArICc8L1N0eWxlTmFtZT4nO1xuICAgICAgICB9KS5qb2luKCdcXG4gICAgJykgK1xuICAgICAgICAoZHNvcHRpb25zLmxlbmd0aCA/XG4gICAgICAgICdcXG4gICAgPERhdGFzb3VyY2U+XFxuICAgICAgICcgK1xuICAgICAgICBkc29wdGlvbnMuam9pbignXFxuICAgICAgICcpICtcbiAgICAgICAgJ1xcbiAgICA8L0RhdGFzb3VyY2U+XFxuJ1xuICAgICAgICA6ICcnKSArXG4gICAgICAgICcgIDwvTGF5ZXI+XFxuJztcbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIvLyBBIGxpdGVyYWwgaXMgYSBsaXRlcmFsIHN0cmluZyBmb3IgTWFwbmlrIC0gdGhlXG4vLyByZXN1bHQgb2YgdGhlIGNvbWJpbmF0aW9uIG9mIGEgYHRyZWUuRmllbGRgIHdpdGggYW55XG4vLyBvdGhlciB0eXBlLlxuKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5MaXRlcmFsID0gZnVuY3Rpb24gRmllbGQoY29udGVudCkge1xuICAgIHRoaXMudmFsdWUgPSBjb250ZW50IHx8ICcnO1xuICAgIHRoaXMuaXMgPSAnZmllbGQnO1xufTtcblxudHJlZS5MaXRlcmFsLnByb3RvdHlwZSA9IHtcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH0sXG4gICAgJ2V2JzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIvLyBBbiBvcGVyYXRpb24gaXMgYW4gZXhwcmVzc2lvbiB3aXRoIGFuIG9wIGluIGJldHdlZW4gdHdvIG9wZXJhbmRzLFxuLy8gbGlrZSAyICsgMS5cbihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuT3BlcmF0aW9uID0gZnVuY3Rpb24gT3BlcmF0aW9uKG9wLCBvcGVyYW5kcywgaW5kZXgpIHtcbiAgICB0aGlzLm9wID0gb3AudHJpbSgpO1xuICAgIHRoaXMub3BlcmFuZHMgPSBvcGVyYW5kcztcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG59O1xuXG50cmVlLk9wZXJhdGlvbi5wcm90b3R5cGUuaXMgPSAnb3BlcmF0aW9uJztcblxudHJlZS5PcGVyYXRpb24ucHJvdG90eXBlLmV2ID0gZnVuY3Rpb24oZW52KSB7XG4gICAgdmFyIGEgPSB0aGlzLm9wZXJhbmRzWzBdLmV2KGVudiksXG4gICAgICAgIGIgPSB0aGlzLm9wZXJhbmRzWzFdLmV2KGVudiksXG4gICAgICAgIHRlbXA7XG5cbiAgICBpZiAoYS5pcyA9PT0gJ3VuZGVmaW5lZCcgfHwgYi5pcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgIHZhbHVlOiAndW5kZWZpbmVkJ1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChhIGluc3RhbmNlb2YgdHJlZS5EaW1lbnNpb24gJiYgYiBpbnN0YW5jZW9mIHRyZWUuQ29sb3IpIHtcbiAgICAgICAgaWYgKHRoaXMub3AgPT09ICcqJyB8fCB0aGlzLm9wID09PSAnKycpIHtcbiAgICAgICAgICAgIHRlbXAgPSBiLCBiID0gYSwgYSA9IHRlbXA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiT3BlcmF0aW9uRXJyb3JcIixcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIkNhbid0IHN1YnN0cmFjdCBvciBkaXZpZGUgYSBjb2xvciBmcm9tIGEgbnVtYmVyXCIsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gT25seSBjb25jYXRlbmF0ZSBwbGFpbiBzdHJpbmdzLCBiZWNhdXNlIHRoaXMgaXMgZWFzaWx5XG4gICAgLy8gcHJlLXByb2Nlc3NlZFxuICAgIGlmIChhIGluc3RhbmNlb2YgdHJlZS5RdW90ZWQgJiYgYiBpbnN0YW5jZW9mIHRyZWUuUXVvdGVkICYmIHRoaXMub3AgIT09ICcrJykge1xuICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICBtZXNzYWdlOiBcIkNhbid0IHN1YnRyYWN0LCBkaXZpZGUsIG9yIG11bHRpcGx5IHN0cmluZ3MuXCIsXG4gICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICB0eXBlOiAncnVudGltZScsXG4gICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLmZpbGVuYW1lXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXM6ICd1bmRlZmluZWQnLFxuICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRmllbGRzLCBsaXRlcmFscywgZGltZW5zaW9ucywgYW5kIHF1b3RlZCBzdHJpbmdzIGNhbiBiZSBjb21iaW5lZC5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIHRyZWUuRmllbGQgfHwgYiBpbnN0YW5jZW9mIHRyZWUuRmllbGQgfHxcbiAgICAgICAgYSBpbnN0YW5jZW9mIHRyZWUuTGl0ZXJhbCB8fCBiIGluc3RhbmNlb2YgdHJlZS5MaXRlcmFsKSB7XG4gICAgICAgIGlmIChhLmlzID09PSAnY29sb3InIHx8IGIuaXMgPT09ICdjb2xvcicpIHtcbiAgICAgICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICBtZXNzYWdlOiBcIkNhbid0IHN1YnRyYWN0LCBkaXZpZGUsIG9yIG11bHRpcGx5IGNvbG9ycyBpbiBleHByZXNzaW9ucy5cIixcbiAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgdHlwZTogJ3J1bnRpbWUnLFxuICAgICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpczogJ3VuZGVmaW5lZCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICd1bmRlZmluZWQnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLkxpdGVyYWwoYS5ldihlbnYpLnRvU3RyaW5nKHRydWUpICsgdGhpcy5vcCArIGIuZXYoZW52KS50b1N0cmluZyh0cnVlKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYS5vcGVyYXRlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZW52LmVycm9yKHtcbiAgICAgICAgICAgbWVzc2FnZTogJ0Nhbm5vdCBkbyBtYXRoIHdpdGggdHlwZSAnICsgYS5pcyArICcuJyxcbiAgICAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgICAgIHR5cGU6ICdydW50aW1lJyxcbiAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpczogJ3VuZGVmaW5lZCcsXG4gICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gYS5vcGVyYXRlKGVudiwgdGhpcy5vcCwgYik7XG59O1xuXG50cmVlLm9wZXJhdGUgPSBmdW5jdGlvbihvcCwgYSwgYikge1xuICAgIHN3aXRjaCAob3ApIHtcbiAgICAgICAgY2FzZSAnKyc6IHJldHVybiBhICsgYjtcbiAgICAgICAgY2FzZSAnLSc6IHJldHVybiBhIC0gYjtcbiAgICAgICAgY2FzZSAnKic6IHJldHVybiBhICogYjtcbiAgICAgICAgY2FzZSAnJSc6IHJldHVybiBhICUgYjtcbiAgICAgICAgY2FzZSAnLyc6IHJldHVybiBhIC8gYjtcbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5RdW90ZWQgPSBmdW5jdGlvbiBRdW90ZWQoY29udGVudCkge1xuICAgIHRoaXMudmFsdWUgPSBjb250ZW50IHx8ICcnO1xufTtcblxudHJlZS5RdW90ZWQucHJvdG90eXBlID0ge1xuICAgIGlzOiAnc3RyaW5nJyxcblxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbihxdW90ZXMpIHtcbiAgICAgICAgdmFyIGVzY2FwZWRWYWx1ZSA9IHRoaXMudmFsdWVcbiAgICAgICAgICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgICAgIHZhciB4bWx2YWx1ZSA9IGVzY2FwZWRWYWx1ZVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcJy9nLCAnXFxcXFxcJycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxcIi9nLCAnJnF1b3Q7JylcbiAgICAgICAgICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXD4vZywgJyZndDsnKTtcbiAgICAgICAgcmV0dXJuIChxdW90ZXMgPT09IHRydWUpID8gXCInXCIgKyB4bWx2YWx1ZSArIFwiJ1wiIDogZXNjYXBlZFZhbHVlO1xuICAgIH0sXG5cbiAgICAnZXYnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wZXJhdGU6IGZ1bmN0aW9uKGVudiwgb3AsIG90aGVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgdHJlZS5RdW90ZWQodHJlZS5vcGVyYXRlKG9wLCB0aGlzLnRvU3RyaW5nKCksIG90aGVyLnRvU3RyaW5nKHRoaXMuY29udGFpbnNfZmllbGQpKSk7XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIi8vIENhcnRvIHB1bGxzIGluIGEgcmVmZXJlbmNlIGZyb20gdGhlIGBtYXBuaWstcmVmZXJlbmNlYFxuLy8gbW9kdWxlLiBUaGlzIGZpbGUgYnVpbGRzIGluZGV4ZXMgZnJvbSB0aGF0IGZpbGUgZm9yIGl0cyB2YXJpb3VzXG4vLyBvcHRpb25zLCBhbmQgcHJvdmlkZXMgdmFsaWRhdGlvbiBtZXRob2RzIGZvciBwcm9wZXJ0eTogdmFsdWVcbi8vIGNvbWJpbmF0aW9ucy5cbihmdW5jdGlvbih0cmVlKSB7XG5cbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpLFxuICAgIHJlZiA9IHt9O1xuXG5yZWYuc2V0RGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICByZWYuZGF0YSA9IGRhdGE7XG4gICAgcmVmLnNlbGVjdG9yX2NhY2hlID0gZ2VuZXJhdGVTZWxlY3RvckNhY2hlKGRhdGEpO1xuICAgIHJlZi5tYXBuaWtGdW5jdGlvbnMgPSBnZW5lcmF0ZU1hcG5pa0Z1bmN0aW9ucyhkYXRhKTtcblxuICAgIHJlZi5tYXBuaWtGdW5jdGlvbnMubWF0cml4ID0gWzZdO1xuICAgIHJlZi5tYXBuaWtGdW5jdGlvbnMudHJhbnNsYXRlID0gWzEsIDJdO1xuICAgIHJlZi5tYXBuaWtGdW5jdGlvbnMuc2NhbGUgPSBbMSwgMl07XG4gICAgcmVmLm1hcG5pa0Z1bmN0aW9ucy5yb3RhdGUgPSBbMSwgM107XG4gICAgcmVmLm1hcG5pa0Z1bmN0aW9ucy5za2V3WCA9IFsxXTtcbiAgICByZWYubWFwbmlrRnVuY3Rpb25zLnNrZXdZID0gWzFdO1xuXG4gICAgcmVmLnJlcXVpcmVkX2NhY2hlID0gZ2VuZXJhdGVSZXF1aXJlZFByb3BlcnRpZXMoZGF0YSk7XG59O1xuXG5yZWYuc2V0VmVyc2lvbiA9IGZ1bmN0aW9uKHZlcnNpb24pIHtcbiAgICB2YXIgbWFwbmlrX3JlZmVyZW5jZSA9IHJlcXVpcmUoJ21hcG5pay1yZWZlcmVuY2UnKTtcbiAgICBpZiAobWFwbmlrX3JlZmVyZW5jZS52ZXJzaW9uLmhhc093blByb3BlcnR5KHZlcnNpb24pKSB7XG4gICAgICAgIHJlZi5zZXREYXRhKG1hcG5pa19yZWZlcmVuY2UudmVyc2lvblt2ZXJzaW9uXSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG5yZWYuc2VsZWN0b3JEYXRhID0gZnVuY3Rpb24oc2VsZWN0b3IsIGkpIHtcbiAgICBpZiAocmVmLnNlbGVjdG9yX2NhY2hlW3NlbGVjdG9yXSkgcmV0dXJuIHJlZi5zZWxlY3Rvcl9jYWNoZVtzZWxlY3Rvcl1baV07XG59O1xuXG5yZWYudmFsaWRTZWxlY3RvciA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7IHJldHVybiAhIXJlZi5zZWxlY3Rvcl9jYWNoZVtzZWxlY3Rvcl07IH07XG5yZWYuc2VsZWN0b3JOYW1lID0gZnVuY3Rpb24oc2VsZWN0b3IpIHsgcmV0dXJuIHJlZi5zZWxlY3RvckRhdGEoc2VsZWN0b3IsIDIpOyB9O1xucmVmLnNlbGVjdG9yID0gZnVuY3Rpb24oc2VsZWN0b3IpIHsgcmV0dXJuIHJlZi5zZWxlY3RvckRhdGEoc2VsZWN0b3IsIDApOyB9O1xucmVmLnN5bWJvbGl6ZXIgPSBmdW5jdGlvbihzZWxlY3RvcikgeyByZXR1cm4gcmVmLnNlbGVjdG9yRGF0YShzZWxlY3RvciwgMSk7IH07XG5cbmZ1bmN0aW9uIGdlbmVyYXRlU2VsZWN0b3JDYWNoZShkYXRhKSB7XG4gICAgdmFyIGluZGV4ID0ge307XG4gICAgZm9yICh2YXIgaSBpbiBkYXRhLnN5bWJvbGl6ZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGogaW4gZGF0YS5zeW1ib2xpemVyc1tpXSkge1xuICAgICAgICAgICAgaWYgKGRhdGEuc3ltYm9saXplcnNbaV1bal0uaGFzT3duUHJvcGVydHkoJ2NzcycpKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhbZGF0YS5zeW1ib2xpemVyc1tpXVtqXS5jc3NdID0gW2RhdGEuc3ltYm9saXplcnNbaV1bal0sIGksIGpdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVNYXBuaWtGdW5jdGlvbnMoZGF0YSkge1xuICAgIHZhciBmdW5jdGlvbnMgPSB7fTtcbiAgICBmb3IgKHZhciBpIGluIGRhdGEuc3ltYm9saXplcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaiBpbiBkYXRhLnN5bWJvbGl6ZXJzW2ldKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5zeW1ib2xpemVyc1tpXVtqXS50eXBlID09PSAnZnVuY3Rpb25zJykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZGF0YS5zeW1ib2xpemVyc1tpXVtqXS5mdW5jdGlvbnMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gZGF0YS5zeW1ib2xpemVyc1tpXVtqXS5mdW5jdGlvbnNba107XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uc1tmblswXV0gPSBmblsxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9ucztcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVSZXF1aXJlZFByb3BlcnRpZXMoZGF0YSkge1xuICAgIHZhciBjYWNoZSA9IHt9O1xuICAgIGZvciAodmFyIHN5bWJvbGl6ZXJfbmFtZSBpbiBkYXRhLnN5bWJvbGl6ZXJzKSB7XG4gICAgICAgIGNhY2hlW3N5bWJvbGl6ZXJfbmFtZV0gPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaiBpbiBkYXRhLnN5bWJvbGl6ZXJzW3N5bWJvbGl6ZXJfbmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnN5bWJvbGl6ZXJzW3N5bWJvbGl6ZXJfbmFtZV1bal0ucmVxdWlyZWQpIHtcbiAgICAgICAgICAgICAgICBjYWNoZVtzeW1ib2xpemVyX25hbWVdLnB1c2goZGF0YS5zeW1ib2xpemVyc1tzeW1ib2xpemVyX25hbWVdW2pdLmNzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlO1xufVxuXG5yZWYucmVxdWlyZWRQcm9wZXJ0aWVzID0gZnVuY3Rpb24oc3ltYm9saXplcl9uYW1lLCBydWxlcykge1xuICAgIHZhciByZXEgPSByZWYucmVxdWlyZWRfY2FjaGVbc3ltYm9saXplcl9uYW1lXTtcbiAgICBmb3IgKHZhciBpIGluIHJlcSkge1xuICAgICAgICBpZiAoIShyZXFbaV0gaW4gcnVsZXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1Byb3BlcnR5ICcgKyByZXFbaV0gKyAnIHJlcXVpcmVkIGZvciBkZWZpbmluZyAnICtcbiAgICAgICAgICAgICAgICBzeW1ib2xpemVyX25hbWUgKyAnIHN0eWxlcy4nO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLy8gVE9ETzogZmluaXNoIGltcGxlbWVudGF0aW9uIC0gdGhpcyBpcyBkZWFkIGNvZGVcbnJlZi5fdmFsaWRhdGVWYWx1ZSA9IHtcbiAgICAnZm9udCc6IGZ1bmN0aW9uKGVudiwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGVudi52YWxpZGF0aW9uX2RhdGEgJiYgZW52LnZhbGlkYXRpb25fZGF0YS5mb250cykge1xuICAgICAgICAgICAgcmV0dXJuIGVudi52YWxpZGF0aW9uX2RhdGEuZm9udHMuaW5kZXhPZih2YWx1ZSkgIT0gLTE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnJlZi5pc0ZvbnQgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgIHJldHVybiByZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnZhbGlkYXRlID09ICdmb250Jztcbn07XG5cbi8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tLzk4MjkyN1xucmVmLmVkaXREaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpe1xuICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGIubGVuZ3RoO1xuICAgIGlmIChiLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGEubGVuZ3RoO1xuICAgIHZhciBtYXRyaXggPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBiLmxlbmd0aDsgaSsrKSB7IG1hdHJpeFtpXSA9IFtpXTsgfVxuICAgIGZvciAodmFyIGogPSAwOyBqIDw9IGEubGVuZ3RoOyBqKyspIHsgbWF0cml4WzBdW2pdID0gajsgfVxuICAgIGZvciAoaSA9IDE7IGkgPD0gYi5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKGogPSAxOyBqIDw9IGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChiLmNoYXJBdChpLTEpID09IGEuY2hhckF0KGotMSkpIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhbaV1bal0gPSBtYXRyaXhbaS0xXVtqLTFdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhbaV1bal0gPSBNYXRoLm1pbihtYXRyaXhbaS0xXVtqLTFdICsgMSwgLy8gc3Vic3RpdHV0aW9uXG4gICAgICAgICAgICAgICAgICAgIE1hdGgubWluKG1hdHJpeFtpXVtqLTFdICsgMSwgLy8gaW5zZXJ0aW9uXG4gICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpLTFdW2pdICsgMSkpOyAvLyBkZWxldGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRyaXhbYi5sZW5ndGhdW2EubGVuZ3RoXTtcbn07XG5cbmZ1bmN0aW9uIHZhbGlkYXRlRnVuY3Rpb25zKHZhbHVlLCBzZWxlY3Rvcikge1xuICAgIGlmICh2YWx1ZS52YWx1ZVswXS5pcyA9PT0gJ3N0cmluZycpIHJldHVybiB0cnVlO1xuICAgIGZvciAodmFyIGkgaW4gdmFsdWUudmFsdWUpIHtcbiAgICAgICAgZm9yICh2YXIgaiBpbiB2YWx1ZS52YWx1ZVtpXS52YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlLnZhbHVlW2ldLnZhbHVlW2pdLmlzICE9PSAnY2FsbCcpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHZhciBmID0gXy5maW5kKHJlZlxuICAgICAgICAgICAgICAgIC5zZWxlY3RvcihzZWxlY3RvcikuZnVuY3Rpb25zLCBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4WzBdID09IHZhbHVlLnZhbHVlW2ldLnZhbHVlW2pdLm5hbWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIShmICYmIGZbMV0gPT0gLTEpKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBmaWx0ZXIgaXMgdW5rbm93biBvciBnaXZlbiBhbiBpbmNvcnJlY3QgbnVtYmVyIG9mIGFyZ3VtZW50c1xuICAgICAgICAgICAgICAgIGlmICghZiB8fCBmWzFdICE9PSB2YWx1ZS52YWx1ZVtpXS52YWx1ZVtqXS5hcmdzLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUtleXdvcmQodmFsdWUsIHNlbGVjdG9yKSB7XG4gICAgaWYgKHR5cGVvZiByZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiByZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnR5cGVcbiAgICAgICAgICAgIC5pbmRleE9mKHZhbHVlLnZhbHVlWzBdLnZhbHVlKSAhPT0gLTE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYWxsb3cgdW5xdW90ZWQga2V5d29yZHMgYXMgc3RyaW5nc1xuICAgICAgICByZXR1cm4gcmVmLnNlbGVjdG9yKHNlbGVjdG9yKS50eXBlID09PSAnc3RyaW5nJztcbiAgICB9XG59XG5cbnJlZi52YWxpZFZhbHVlID0gZnVuY3Rpb24oZW52LCBzZWxlY3RvciwgdmFsdWUpIHtcbiAgICB2YXIgaSwgajtcbiAgICAvLyBUT0RPOiBoYW5kbGUgaW4gcmV1c2FibGUgd2F5XG4gICAgaWYgKCFyZWYuc2VsZWN0b3Ioc2VsZWN0b3IpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlLnZhbHVlWzBdLmlzID09ICdrZXl3b3JkJykge1xuICAgICAgICByZXR1cm4gdmFsaWRhdGVLZXl3b3JkKHZhbHVlLCBzZWxlY3Rvcik7XG4gICAgfSBlbHNlIGlmICh2YWx1ZS52YWx1ZVswXS5pcyA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBjYXVnaHQgZWFybGllciBpbiB0aGUgY2hhaW4gLSBpZ25vcmUgaGVyZSBzbyB0aGF0XG4gICAgICAgIC8vIGVycm9yIGlzIG5vdCBvdmVycmlkZGVuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAocmVmLnNlbGVjdG9yKHNlbGVjdG9yKS50eXBlID09ICdudW1iZXJzJykge1xuICAgICAgICBmb3IgKGkgaW4gdmFsdWUudmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS52YWx1ZVtpXS5pcyAhPT0gJ2Zsb2F0Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHJlZi5zZWxlY3RvcihzZWxlY3RvcikudHlwZSA9PSAndGFncycpIHtcbiAgICAgICAgaWYgKCF2YWx1ZS52YWx1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIXZhbHVlLnZhbHVlWzBdLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUudmFsdWVbMF0uaXMgPT09ICd0YWcnO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB2YWx1ZS52YWx1ZVswXS52YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHZhbHVlLnZhbHVlWzBdLnZhbHVlW2ldLmlzICE9PSAndGFnJykgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAocmVmLnNlbGVjdG9yKHNlbGVjdG9yKS50eXBlID09ICdmdW5jdGlvbnMnKSB7XG4gICAgICAgIC8vIEZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSwgeW91IGNhbiBzcGVjaWZ5IGEgc3RyaW5nIGZvciBgZnVuY3Rpb25zYC1jb21wYXRpYmxlXG4gICAgICAgIC8vIHZhbHVlcywgdGhvdWdoIHRoZXkgd2lsbCBub3QgYmUgdmFsaWRhdGVkLlxuICAgICAgICByZXR1cm4gdmFsaWRhdGVGdW5jdGlvbnModmFsdWUsIHNlbGVjdG9yKTtcbiAgICB9IGVsc2UgaWYgKHJlZi5zZWxlY3RvcihzZWxlY3RvcikudHlwZSA9PT0gJ3Vuc2lnbmVkJykge1xuICAgICAgICBpZiAodmFsdWUudmFsdWVbMF0uaXMgPT09ICdmbG9hdCcpIHtcbiAgICAgICAgICAgIHZhbHVlLnZhbHVlWzBdLnJvdW5kKCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoKHJlZi5zZWxlY3RvcihzZWxlY3RvcikuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlZi5zZWxlY3RvcihzZWxlY3RvcikudmFsaWRhdGUpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHZhbHVlLnZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlZi5zZWxlY3RvcihzZWxlY3RvcikudHlwZSA9PSB2YWx1ZS52YWx1ZVtpXS5pcyAmJlxuICAgICAgICAgICAgICAgICAgICByZWZcbiAgICAgICAgICAgICAgICAgICAgICAgIC5fdmFsaWRhdGVWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtyZWYuc2VsZWN0b3Ioc2VsZWN0b3IpLnZhbGlkYXRlXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbnYsIHZhbHVlLnZhbHVlW2ldLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcmVmLnNlbGVjdG9yKHNlbGVjdG9yKS50eXBlID09IHZhbHVlLnZhbHVlWzBdLmlzO1xuICAgICAgICB9XG4gICAgfVxufTtcblxudHJlZS5SZWZlcmVuY2UgPSByZWY7XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xuLy8gYSBydWxlIGlzIGEgc2luZ2xlIHByb3BlcnR5IGFuZCB2YWx1ZSBjb21iaW5hdGlvbiwgb3IgdmFyaWFibGVcbi8vIG5hbWUgYW5kIHZhbHVlIGNvbWJpbmF0aW9uLCBsaWtlXG4vLyBwb2x5Z29uLW9wYWNpdHk6IDEuMDsgb3IgQG9wYWNpdHk6IDEuMDtcbnRyZWUuUnVsZSA9IGZ1bmN0aW9uIFJ1bGUobmFtZSwgdmFsdWUsIGluZGV4LCBmaWxlbmFtZSkge1xuICAgIHZhciBwYXJ0cyA9IG5hbWUuc3BsaXQoJy8nKTtcbiAgICB0aGlzLm5hbWUgPSBwYXJ0cy5wb3AoKTtcbiAgICB0aGlzLmluc3RhbmNlID0gcGFydHMubGVuZ3RoID8gcGFydHNbMF0gOiAnX19kZWZhdWx0X18nO1xuICAgIHRoaXMudmFsdWUgPSAodmFsdWUgaW5zdGFuY2VvZiB0cmVlLlZhbHVlKSA/XG4gICAgICAgIHZhbHVlIDogbmV3IHRyZWUuVmFsdWUoW3ZhbHVlXSk7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMuc3ltYm9saXplciA9IHRyZWUuUmVmZXJlbmNlLnN5bWJvbGl6ZXIodGhpcy5uYW1lKTtcbiAgICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWU7XG4gICAgdGhpcy52YXJpYWJsZSA9IChuYW1lLmNoYXJBdCgwKSA9PT0gJ0AnKTtcbn07XG5cbnRyZWUuUnVsZS5wcm90b3R5cGUuaXMgPSAncnVsZSc7XG5cbnRyZWUuUnVsZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2xvbmUgPSBPYmplY3QuY3JlYXRlKHRyZWUuUnVsZS5wcm90b3R5cGUpO1xuICAgIGNsb25lLm5hbWUgPSB0aGlzLm5hbWU7XG4gICAgY2xvbmUudmFsdWUgPSB0aGlzLnZhbHVlO1xuICAgIGNsb25lLmluZGV4ID0gdGhpcy5pbmRleDtcbiAgICBjbG9uZS5pbnN0YW5jZSA9IHRoaXMuaW5zdGFuY2U7XG4gICAgY2xvbmUuc3ltYm9saXplciA9IHRoaXMuc3ltYm9saXplcjtcbiAgICBjbG9uZS5maWxlbmFtZSA9IHRoaXMuZmlsZW5hbWU7XG4gICAgY2xvbmUudmFyaWFibGUgPSB0aGlzLnZhcmlhYmxlO1xuICAgIHJldHVybiBjbG9uZTtcbn07XG5cbnRyZWUuUnVsZS5wcm90b3R5cGUudXBkYXRlSUQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5pZCA9IHRoaXMuem9vbSArICcjJyArIHRoaXMuaW5zdGFuY2UgKyAnIycgKyB0aGlzLm5hbWU7XG59O1xuXG50cmVlLlJ1bGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICdbJyArIHRyZWUuWm9vbS50b1N0cmluZyh0aGlzLnpvb20pICsgJ10gJyArIHRoaXMubmFtZSArICc6ICcgKyB0aGlzLnZhbHVlO1xufTtcblxuZnVuY3Rpb24gZ2V0TWVhbihuYW1lKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRyZWUuUmVmZXJlbmNlLnNlbGVjdG9yX2NhY2hlKS5tYXAoZnVuY3Rpb24oZikge1xuICAgICAgICByZXR1cm4gW2YsIHRyZWUuUmVmZXJlbmNlLmVkaXREaXN0YW5jZShuYW1lLCBmKV07XG4gICAgfSkuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhWzFdIC0gYlsxXTsgfSk7XG59XG5cbi8vIHNlY29uZCBhcmd1bWVudCwgaWYgdHJ1ZSwgb3V0cHV0cyB0aGUgdmFsdWUgb2YgdGhpc1xuLy8gcnVsZSB3aXRob3V0IHRoZSB1c3VhbCBhdHRyaWJ1dGU9XCJjb250ZW50XCIgd3JhcHBpbmcuIFJpZ2h0XG4vLyBub3cgdGhpcyBpcyBqdXN0IGZvciB0aGUgVGV4dFN5bWJvbGl6ZXIsIGJ1dCBhcHBsaWVzIHRvIG90aGVyXG4vLyBwcm9wZXJ0aWVzIGluIHJlZmVyZW5jZS5qc29uIHdoaWNoIHNwZWNpZnkgc2VyaWFsaXphdGlvbj1jb250ZW50XG50cmVlLlJ1bGUucHJvdG90eXBlLnRvWE1MID0gZnVuY3Rpb24oZW52LCBjb250ZW50LCBzZXAsIGZvcm1hdCkge1xuICAgIGlmICghdHJlZS5SZWZlcmVuY2UudmFsaWRTZWxlY3Rvcih0aGlzLm5hbWUpKSB7XG4gICAgICAgIHZhciBtZWFuID0gZ2V0TWVhbih0aGlzLm5hbWUpO1xuICAgICAgICB2YXIgbWVhbl9tZXNzYWdlID0gJyc7XG4gICAgICAgIGlmIChtZWFuWzBdWzFdIDwgMykge1xuICAgICAgICAgICAgbWVhbl9tZXNzYWdlID0gJy4gRGlkIHlvdSBtZWFuICcgKyBtZWFuWzBdWzBdICsgJz8nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgbWVzc2FnZTogXCJVbnJlY29nbml6ZWQgcnVsZTogXCIgKyB0aGlzLm5hbWUgKyBtZWFuX21lc3NhZ2UsXG4gICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgIHR5cGU6ICdzeW50YXgnLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMuZmlsZW5hbWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCh0aGlzLnZhbHVlIGluc3RhbmNlb2YgdHJlZS5WYWx1ZSkgJiZcbiAgICAgICAgIXRyZWUuUmVmZXJlbmNlLnZhbGlkVmFsdWUoZW52LCB0aGlzLm5hbWUsIHRoaXMudmFsdWUpKSB7XG4gICAgICAgIGlmICghdHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3IodGhpcy5uYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ1VucmVjb2duaXplZCBwcm9wZXJ0eTogJyArXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3ludGF4JyxcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdHlwZW5hbWU7XG4gICAgICAgICAgICBpZiAodHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3IodGhpcy5uYW1lKS52YWxpZGF0ZSkge1xuICAgICAgICAgICAgICAgIHR5cGVuYW1lID0gdHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3IodGhpcy5uYW1lKS52YWxpZGF0ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRyZWUuUmVmZXJlbmNlLnNlbGVjdG9yKHRoaXMubmFtZSkudHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICB0eXBlbmFtZSA9ICdrZXl3b3JkIChvcHRpb25zOiAnICsgdHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3IodGhpcy5uYW1lKS50eXBlLmpvaW4oJywgJykgKyAnKSc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHR5cGVuYW1lID0gdHJlZS5SZWZlcmVuY2Uuc2VsZWN0b3IodGhpcy5uYW1lKS50eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVudi5lcnJvcih7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgdmFsdWUgZm9yICcgK1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnLCB0aGUgdHlwZSAnICsgdHlwZW5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnIGlzIGV4cGVjdGVkLiAnICsgdGhpcy52YWx1ZSArXG4gICAgICAgICAgICAgICAgICAgICcgKG9mIHR5cGUgJyArIHRoaXMudmFsdWUudmFsdWVbMF0uaXMgKyAnKSAnICtcbiAgICAgICAgICAgICAgICAgICAgJyB3YXMgZ2l2ZW4uJyxcbiAgICAgICAgICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3ludGF4JyxcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy52YXJpYWJsZSkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSBlbHNlIGlmICh0cmVlLlJlZmVyZW5jZS5pc0ZvbnQodGhpcy5uYW1lKSAmJiB0aGlzLnZhbHVlLnZhbHVlLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdmFyIGYgPSB0cmVlLl9nZXRGb250U2V0KGVudiwgdGhpcy52YWx1ZS52YWx1ZSk7XG4gICAgICAgIHJldHVybiAnZm9udHNldC1uYW1lPVwiJyArIGYubmFtZSArICdcIic7XG4gICAgfSBlbHNlIGlmIChjb250ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlLnRvU3RyaW5nKGVudiwgdGhpcy5uYW1lLCBzZXApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cmVlLlJlZmVyZW5jZS5zZWxlY3Rvck5hbWUodGhpcy5uYW1lKSArXG4gICAgICAgICAgICAnPVwiJyArXG4gICAgICAgICAgICB0aGlzLnZhbHVlLnRvU3RyaW5nKGVudiwgdGhpcy5uYW1lKSArXG4gICAgICAgICAgICAnXCInO1xuICAgIH1cbn07XG5cbi8vIFRPRE86IFJ1bGUgZXYgY2hhaW4gc2hvdWxkIGFkZCBmb250c2V0cyB0byBlbnYuZnJhbWVzXG50cmVlLlJ1bGUucHJvdG90eXBlLmV2ID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgIHJldHVybiBuZXcgdHJlZS5SdWxlKHRoaXMubmFtZSxcbiAgICAgICAgdGhpcy52YWx1ZS5ldihjb250ZXh0KSxcbiAgICAgICAgdGhpcy5pbmRleCxcbiAgICAgICAgdGhpcy5maWxlbmFtZSk7XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5SdWxlc2V0ID0gZnVuY3Rpb24gUnVsZXNldChzZWxlY3RvcnMsIHJ1bGVzKSB7XG4gICAgdGhpcy5zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XG4gICAgdGhpcy5ydWxlcyA9IHJ1bGVzO1xuICAgIC8vIHN0YXRpYyBjYWNoZSBvZiBmaW5kKCkgZnVuY3Rpb25cbiAgICB0aGlzLl9sb29rdXBzID0ge307XG59O1xudHJlZS5SdWxlc2V0LnByb3RvdHlwZSA9IHtcbiAgICBpczogJ3J1bGVzZXQnLFxuICAgICdldic6IGZ1bmN0aW9uKGVudikge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIHJ1bGVzZXQgPSBuZXcgdHJlZS5SdWxlc2V0KHRoaXMuc2VsZWN0b3JzLCB0aGlzLnJ1bGVzLnNsaWNlKDApKTtcbiAgICAgICAgcnVsZXNldC5yb290ID0gdGhpcy5yb290O1xuXG4gICAgICAgIC8vIHB1c2ggdGhlIGN1cnJlbnQgcnVsZXNldCB0byB0aGUgZnJhbWVzIHN0YWNrXG4gICAgICAgIGVudi5mcmFtZXMudW5zaGlmdChydWxlc2V0KTtcblxuICAgICAgICAvLyBFdmFsdWF0ZSBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgZm9yIChpID0gMCwgcnVsZTsgaSA8IHJ1bGVzZXQucnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJ1bGUgPSBydWxlc2V0LnJ1bGVzW2ldO1xuICAgICAgICAgICAgcnVsZXNldC5ydWxlc1tpXSA9IHJ1bGUuZXYgPyBydWxlLmV2KGVudikgOiBydWxlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUG9wIHRoZSBzdGFja1xuICAgICAgICBlbnYuZnJhbWVzLnNoaWZ0KCk7XG5cbiAgICAgICAgcmV0dXJuIHJ1bGVzZXQ7XG4gICAgfSxcbiAgICBtYXRjaDogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gIWFyZ3MgfHwgYXJncy5sZW5ndGggPT09IDA7XG4gICAgfSxcbiAgICB2YXJpYWJsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fdmFyaWFibGVzKSB7IHJldHVybiB0aGlzLl92YXJpYWJsZXM7IH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmFyaWFibGVzID0gdGhpcy5ydWxlcy5yZWR1Y2UoZnVuY3Rpb24oaGFzaCwgcikge1xuICAgICAgICAgICAgICAgIGlmIChyIGluc3RhbmNlb2YgdHJlZS5SdWxlICYmIHIudmFyaWFibGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzaFtyLm5hbWVdID0gcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhc2g7XG4gICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHZhcmlhYmxlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhcmlhYmxlcygpW25hbWVdO1xuICAgIH0sXG4gICAgcnVsZXNldHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fcnVsZXNldHMpIHsgcmV0dXJuIHRoaXMuX3J1bGVzZXRzOyB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3J1bGVzZXRzID0gdGhpcy5ydWxlcy5maWx0ZXIoZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgIHJldHVybiAociBpbnN0YW5jZW9mIHRyZWUuUnVsZXNldCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZmluZDogZnVuY3Rpb24oc2VsZWN0b3IsIHNlbGYpIHtcbiAgICAgICAgc2VsZiA9IHNlbGYgfHwgdGhpcztcbiAgICAgICAgdmFyIHJ1bGVzID0gW10sIHJ1bGUsIG1hdGNoLFxuICAgICAgICAgICAga2V5ID0gc2VsZWN0b3IudG9TdHJpbmcoKTtcblxuICAgICAgICBpZiAoa2V5IGluIHRoaXMuX2xvb2t1cHMpIHsgcmV0dXJuIHRoaXMuX2xvb2t1cHNba2V5XTsgfVxuXG4gICAgICAgIHRoaXMucnVsZXNldHMoKS5mb3JFYWNoKGZ1bmN0aW9uKHJ1bGUpIHtcbiAgICAgICAgICAgIGlmIChydWxlICE9PSBzZWxmKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBydWxlLnNlbGVjdG9ycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IHNlbGVjdG9yLm1hdGNoKHJ1bGUuc2VsZWN0b3JzW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IuZWxlbWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHJ1bGVzLCBydWxlLmZpbmQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyB0cmVlLlNlbGVjdG9yKG51bGwsIG51bGwsIG51bGwsIHNlbGVjdG9yLmVsZW1lbnRzLnNsaWNlKDEpKSwgc2VsZikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBydWxlcy5wdXNoKHJ1bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9va3Vwc1trZXldID0gcnVsZXM7XG4gICAgfSxcbiAgICAvLyBab29tcyBjYW4gdXNlIHZhcmlhYmxlcy4gVGhpcyByZXBsYWNlcyB0cmVlLlpvb20gb2JqZWN0cyBvbiBzZWxlY3RvcnNcbiAgICAvLyB3aXRoIHNpbXBsZSBiaXQtYXJyYXlzIHRoYXQgd2UgY2FuIGNvbXBhcmUgZWFzaWx5LlxuICAgIGV2Wm9vbXM6IGZ1bmN0aW9uKGVudikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgenZhbCA9IHRyZWUuWm9vbS5hbGw7XG4gICAgICAgICAgICBmb3IgKHZhciB6ID0gMDsgeiA8IHRoaXMuc2VsZWN0b3JzW2ldLnpvb20ubGVuZ3RoOyB6KyspIHtcbiAgICAgICAgICAgICAgICB6dmFsID0genZhbCAmIHRoaXMuc2VsZWN0b3JzW2ldLnpvb21bel0uZXYoZW52KS56b29tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZWxlY3RvcnNbaV0uem9vbSA9IHp2YWw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGZsYXR0ZW46IGZ1bmN0aW9uKHJlc3VsdCwgcGFyZW50cywgZW52KSB7XG4gICAgICAgIHZhciBzZWxlY3RvcnMgPSBbXSwgaSwgajtcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0b3JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZW52LmZyYW1lcyA9IGVudi5mcmFtZXMuY29uY2F0KHRoaXMucnVsZXMpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGV2YWx1YXRlIHpvb20gdmFyaWFibGVzIG9uIHRoaXMgb2JqZWN0LlxuICAgICAgICB0aGlzLmV2Wm9vbXMoZW52KTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLnNlbGVjdG9yc1tpXTtcblxuICAgICAgICAgICAgaWYgKCFjaGlsZC5maWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaXMgdGhpcyBpbnRlcm5hbCBpbmNvbnNpc3RlbmN5P1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gaW52YWxpZCBmaWx0ZXJzZXQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwYXJlbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBwYXJlbnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBwYXJlbnRzW2pdO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBtZXJnZWRGaWx0ZXJzID0gcGFyZW50LmZpbHRlcnMuY2xvbmVXaXRoKGNoaWxkLmZpbHRlcnMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWVyZ2VkRmlsdGVycyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlsdGVycyBjb3VsZCBiZSBhZGRlZCwgYnV0IHRoZXkgZGlkbid0IGNoYW5nZSB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpbHRlcnMuIFRoaXMgbWVhbnMgdGhhdCB3ZSBvbmx5IGhhdmUgdG8gY2xvbmUgd2hlblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHpvb20gbGV2ZWxzIG9yIHRoZSBhdHRhY2htZW50IGlzIGRpZmZlcmVudCB0b28uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50Lnpvb20gPT09IChwYXJlbnQuem9vbSAmIGNoaWxkLnpvb20pICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LmZyYW1lX29mZnNldCA9PT0gY2hpbGQuZnJhbWVfb2Zmc2V0ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LmF0dGFjaG1lbnQgPT09IGNoaWxkLmF0dGFjaG1lbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuZWxlbWVudHMuam9pbigpID09PSBjaGlsZC5lbGVtZW50cy5qb2luKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnMucHVzaChwYXJlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZWRGaWx0ZXJzID0gcGFyZW50LmZpbHRlcnM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1lcmdlZEZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBtZXJnZWQgZmlsdGVycyBhcmUgaW52YWxpZCwgdGhhdCBtZWFucyB3ZSBkb24ndFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGF2ZSB0byBjbG9uZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsb25lID0gT2JqZWN0LmNyZWF0ZSh0cmVlLlNlbGVjdG9yLnByb3RvdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lLmZpbHRlcnMgPSBtZXJnZWRGaWx0ZXJzO1xuICAgICAgICAgICAgICAgICAgICBjbG9uZS56b29tID0gcGFyZW50Lnpvb20gJiBjaGlsZC56b29tO1xuICAgICAgICAgICAgICAgICAgICBjbG9uZS5mcmFtZV9vZmZzZXQgPSBjaGlsZC5mcmFtZV9vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lLmVsZW1lbnRzID0gcGFyZW50LmVsZW1lbnRzLmNvbmNhdChjaGlsZC5lbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnQuYXR0YWNobWVudCAmJiBjaGlsZC5hdHRhY2htZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9uZS5hdHRhY2htZW50ID0gcGFyZW50LmF0dGFjaG1lbnQgKyAnLycgKyBjaGlsZC5hdHRhY2htZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgY2xvbmUuYXR0YWNobWVudCA9IGNoaWxkLmF0dGFjaG1lbnQgfHwgcGFyZW50LmF0dGFjaG1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lLmNvbmRpdGlvbnMgPSBwYXJlbnQuY29uZGl0aW9ucyArIGNoaWxkLmNvbmRpdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lLmluZGV4ID0gY2hpbGQuaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKGNsb25lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBydWxlcyA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJ1bGUgPSB0aGlzLnJ1bGVzW2ldO1xuXG4gICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBmbGF0dGVuIGFueSBuZXN0ZWQgcnVsZXNldHNcbiAgICAgICAgICAgIGlmIChydWxlIGluc3RhbmNlb2YgdHJlZS5SdWxlc2V0KSB7XG4gICAgICAgICAgICAgICAgcnVsZS5mbGF0dGVuKHJlc3VsdCwgc2VsZWN0b3JzLCBlbnYpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChydWxlIGluc3RhbmNlb2YgdHJlZS5SdWxlKSB7XG4gICAgICAgICAgICAgICAgcnVsZXMucHVzaChydWxlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocnVsZSBpbnN0YW5jZW9mIHRyZWUuSW52YWxpZCkge1xuICAgICAgICAgICAgICAgIGVudi5lcnJvcihydWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpbmRleCA9IHJ1bGVzLmxlbmd0aCA/IHJ1bGVzWzBdLmluZGV4IDogZmFsc2U7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIEZvciBzcGVjaWZpY2l0eSBzb3J0LCB1c2UgdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBydWxlIHRvIGFsbG93XG4gICAgICAgICAgICAvLyBkZWZpbmluZyBhdHRhY2htZW50cyB0aGF0IGFyZSB1bmRlciBjdXJyZW50IGVsZW1lbnQgYXMgYSBkZXNjZW5kYW50XG4gICAgICAgICAgICAvLyBzZWxlY3Rvci5cbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RvcnNbaV0uaW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyB0cmVlLkRlZmluaXRpb24oc2VsZWN0b3JzW2ldLCBydWxlcy5zbGljZSgpKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn07XG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5TZWxlY3RvciA9IGZ1bmN0aW9uIFNlbGVjdG9yKGZpbHRlcnMsIHpvb20sIGZyYW1lX29mZnNldCwgZWxlbWVudHMsIGF0dGFjaG1lbnQsIGNvbmRpdGlvbnMsIGluZGV4KSB7XG4gICAgdGhpcy5lbGVtZW50cyA9IGVsZW1lbnRzIHx8IFtdO1xuICAgIHRoaXMuYXR0YWNobWVudCA9IGF0dGFjaG1lbnQ7XG4gICAgdGhpcy5maWx0ZXJzID0gZmlsdGVycyB8fCB7fTtcbiAgICB0aGlzLmZyYW1lX29mZnNldCA9IGZyYW1lX29mZnNldDtcbiAgICB0aGlzLnpvb20gPSB0eXBlb2Ygem9vbSAhPT0gJ3VuZGVmaW5lZCcgPyB6b29tIDogdHJlZS5ab29tLmFsbDtcbiAgICB0aGlzLmNvbmRpdGlvbnMgPSBjb25kaXRpb25zO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbn07XG5cbi8vIERldGVybWluZSB0aGUgc3BlY2lmaWNpdHkgb2YgdGhpcyBzZWxlY3RvclxuLy8gYmFzZWQgb24gdGhlIHNwZWNpZmljaXR5IG9mIGl0cyBlbGVtZW50cyAtIGNhbGxpbmdcbi8vIEVsZW1lbnQuc3BlY2lmaWNpdHkoKSBpbiBvcmRlciB0byBkbyBzb1xuLy9cbi8vIFtJRCwgQ2xhc3MsIEZpbHRlcnMsIFBvc2l0aW9uIGluIGRvY3VtZW50XVxudHJlZS5TZWxlY3Rvci5wcm90b3R5cGUuc3BlY2lmaWNpdHkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5yZWR1Y2UoZnVuY3Rpb24obWVtbywgZSkge1xuICAgICAgICB2YXIgc3BlYyA9IGUuc3BlY2lmaWNpdHkoKTtcbiAgICAgICAgbWVtb1swXSArPSBzcGVjWzBdO1xuICAgICAgICBtZW1vWzFdICs9IHNwZWNbMV07XG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgIH0sIFswLCAwLCB0aGlzLmNvbmRpdGlvbnMsIHRoaXMuaW5kZXhdKTtcbn07XG5cbn0pKHJlcXVpcmUoJy4uL3RyZWUnKSk7XG4iLCIoZnVuY3Rpb24odHJlZSkge1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbi8vIEdpdmVuIGEgc3R5bGUncyBuYW1lLCBhdHRhY2htZW50LCBkZWZpbml0aW9ucywgYW5kIGFuIGVudmlyb25tZW50IG9iamVjdCxcbi8vIHJldHVybiBhIHN0cmluZ2lmaWVkIHN0eWxlIGZvciBNYXBuaWtcbnRyZWUuU3R5bGVYTUwgPSBmdW5jdGlvbihuYW1lLCBhdHRhY2htZW50LCBkZWZpbml0aW9ucywgZW52KSB7XG4gICAgdmFyIGV4aXN0aW5nID0ge307XG4gICAgdmFyIGltYWdlX2ZpbHRlcnMgPSBbXSwgaW1hZ2VfZmlsdGVyc19pbmZsYXRlID0gW10sIGRpcmVjdF9pbWFnZV9maWx0ZXJzID0gW10sIGNvbXBfb3AgPSBbXSwgb3BhY2l0eSA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWZpbml0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRlZmluaXRpb25zW2ldLnJ1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0ubmFtZSA9PT0gJ2ltYWdlLWZpbHRlcnMnKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VfZmlsdGVycy5wdXNoKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXS5uYW1lID09PSAnaW1hZ2UtZmlsdGVycy1pbmZsYXRlJykge1xuICAgICAgICAgICAgICAgIGltYWdlX2ZpbHRlcnNfaW5mbGF0ZS5wdXNoKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXS5uYW1lID09PSAnZGlyZWN0LWltYWdlLWZpbHRlcnMnKSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0X2ltYWdlX2ZpbHRlcnMucHVzaChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0ubmFtZSA9PT0gJ2NvbXAtb3AnKSB7XG4gICAgICAgICAgICAgICAgY29tcF9vcC5wdXNoKGRlZmluaXRpb25zW2ldLnJ1bGVzW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkZWZpbml0aW9uc1tpXS5ydWxlc1tqXS5uYW1lID09PSAnb3BhY2l0eScpIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5LnB1c2goZGVmaW5pdGlvbnNbaV0ucnVsZXNbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHJ1bGVzID0gZGVmaW5pdGlvbnMubWFwKGZ1bmN0aW9uKGRlZmluaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb24udG9YTUwoZW52LCBleGlzdGluZyk7XG4gICAgfSk7XG5cbiAgICB2YXIgYXR0cnNfeG1sID0gJyc7XG5cbiAgICBpZiAoaW1hZ2VfZmlsdGVycy5sZW5ndGgpIHtcbiAgICAgICAgYXR0cnNfeG1sICs9ICcgaW1hZ2UtZmlsdGVycz1cIicgKyBfLmNoYWluKGltYWdlX2ZpbHRlcnMpXG4gICAgICAgICAgICAvLyBwcmV2ZW50IGlkZW50aWNhbCBmaWx0ZXJzIGZyb20gYmVpbmcgZHVwbGljYXRlZCBpbiB0aGUgc3R5bGVcbiAgICAgICAgICAgIC51bmlxKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIGkuaWQ7IH0pLm1hcChmdW5jdGlvbihmKSB7XG4gICAgICAgICAgICByZXR1cm4gZi5ldihlbnYpLnRvWE1MKGVudiwgdHJ1ZSwgJywnLCAnaW1hZ2UtZmlsdGVyJyk7XG4gICAgICAgIH0pLnZhbHVlKCkuam9pbignLCcpICsgJ1wiJztcbiAgICB9XG5cbiAgICBpZiAoaW1hZ2VfZmlsdGVyc19pbmZsYXRlLmxlbmd0aCkge1xuICAgICAgICBhdHRyc194bWwgKz0gJyBpbWFnZS1maWx0ZXJzLWluZmxhdGU9XCInICsgaW1hZ2VfZmlsdGVyc19pbmZsYXRlWzBdLnZhbHVlLmV2KGVudikudG9TdHJpbmcoKSArICdcIic7XG4gICAgfVxuXG4gICAgaWYgKGRpcmVjdF9pbWFnZV9maWx0ZXJzLmxlbmd0aCkge1xuICAgICAgICBhdHRyc194bWwgKz0gJyBkaXJlY3QtaW1hZ2UtZmlsdGVycz1cIicgKyBfLmNoYWluKGRpcmVjdF9pbWFnZV9maWx0ZXJzKVxuICAgICAgICAgICAgLy8gcHJldmVudCBpZGVudGljYWwgZmlsdGVycyBmcm9tIGJlaW5nIGR1cGxpY2F0ZWQgaW4gdGhlIHN0eWxlXG4gICAgICAgICAgICAudW5pcShmdW5jdGlvbihpKSB7IHJldHVybiBpLmlkOyB9KS5tYXAoZnVuY3Rpb24oZikge1xuICAgICAgICAgICAgcmV0dXJuIGYuZXYoZW52KS50b1hNTChlbnYsIHRydWUsICcsJywgJ2RpcmVjdC1pbWFnZS1maWx0ZXInKTtcbiAgICAgICAgfSkudmFsdWUoKS5qb2luKCcsJykgKyAnXCInO1xuICAgIH1cblxuICAgIGlmIChjb21wX29wLmxlbmd0aCAmJiBjb21wX29wWzBdLnZhbHVlLmV2KGVudikudmFsdWUgIT0gJ3NyYy1vdmVyJykge1xuICAgICAgICBhdHRyc194bWwgKz0gJyBjb21wLW9wPVwiJyArIGNvbXBfb3BbMF0udmFsdWUuZXYoZW52KS50b1N0cmluZygpICsgJ1wiJztcbiAgICB9XG5cbiAgICBpZiAob3BhY2l0eS5sZW5ndGggJiYgb3BhY2l0eVswXS52YWx1ZS5ldihlbnYpLnZhbHVlICE9IDEpIHtcbiAgICAgICAgYXR0cnNfeG1sICs9ICcgb3BhY2l0eT1cIicgKyBvcGFjaXR5WzBdLnZhbHVlLmV2KGVudikudG9TdHJpbmcoKSArICdcIic7XG4gICAgfVxuICAgIHZhciBydWxlX3N0cmluZyA9IHJ1bGVzLmpvaW4oJycpO1xuICAgIGlmICghYXR0cnNfeG1sICYmICFydWxlX3N0cmluZykgcmV0dXJuICcnO1xuICAgIHJldHVybiAnPFN0eWxlIG5hbWU9XCInICsgbmFtZSArICdcIiBmaWx0ZXItbW9kZT1cImZpcnN0XCInICsgYXR0cnNfeG1sICsgJz5cXG4nICsgcnVsZV9zdHJpbmcgKyAnPC9TdHlsZT4nO1xufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuVVJMID0gZnVuY3Rpb24gVVJMKHZhbCwgcGF0aHMpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsO1xuICAgIHRoaXMucGF0aHMgPSBwYXRocztcbn07XG5cbnRyZWUuVVJMLnByb3RvdHlwZSA9IHtcbiAgICBpczogJ3VyaScsXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS50b1N0cmluZygpO1xuICAgIH0sXG4gICAgZXY6IGZ1bmN0aW9uKGN0eCkge1xuICAgICAgICByZXR1cm4gbmV3IHRyZWUuVVJMKHRoaXMudmFsdWUuZXYoY3R4KSwgdGhpcy5wYXRocyk7XG4gICAgfVxufTtcblxufSkocmVxdWlyZSgnLi4vdHJlZScpKTtcbiIsIihmdW5jdGlvbih0cmVlKSB7XG5cbnRyZWUuVmFsdWUgPSBmdW5jdGlvbiBWYWx1ZSh2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn07XG5cbnRyZWUuVmFsdWUucHJvdG90eXBlID0ge1xuICAgIGlzOiAndmFsdWUnLFxuICAgIGV2OiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZVswXS5ldihlbnYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyB0cmVlLlZhbHVlKHRoaXMudmFsdWUubWFwKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdi5ldihlbnYpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oZW52LCBzZWxlY3Rvciwgc2VwLCBmb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBlLnRvU3RyaW5nKGVudiwgZm9ybWF0KTtcbiAgICAgICAgfSkuam9pbihzZXAgfHwgJywgJyk7XG4gICAgfSxcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvYmogPSBPYmplY3QuY3JlYXRlKHRyZWUuVmFsdWUucHJvdG90eXBlKTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkgb2JqLnZhbHVlID0gdGhpcy52YWx1ZS5zbGljZSgpO1xuICAgICAgICBlbHNlIG9iai52YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICAgIG9iai5pcyA9IHRoaXMuaXM7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfSxcblxuICAgIHRvSlM6IGZ1bmN0aW9uKGVudikge1xuICAgICAgLy92YXIgdiA9IHRoaXMudmFsdWVbMF0udmFsdWVbMF07XG4gICAgICB2YXIgdmFsID0gdGhpcy5ldihlbnYpO1xuICAgICAgdmFyIHYgPSB2YWwudG9TdHJpbmcoKTtcbiAgICAgIGlmKHZhbC5pcyA9PT0gXCJjb2xvclwiIHx8IHZhbC5pcyA9PT0gJ3VyaScgfHwgdmFsLmlzID09PSAnc3RyaW5nJyB8fCB2YWwuaXMgPT09ICdrZXl3b3JkJykge1xuICAgICAgICB2ID0gXCInXCIgKyB2ICsgXCInXCI7XG4gICAgICB9IGVsc2UgaWYgKHZhbC5pcyA9PT0gJ2ZpZWxkJykge1xuICAgICAgICAvLyByZXBsYWNlIFt2YXJpYWJsZV0gYnkgY3R4Wyd2YXJpYWJsZSddXG4gICAgICAgIHYgPSB2LnJlcGxhY2UoL1xcWyguKilcXF0vZywgXCJkYXRhWyckMSddXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFwiX3ZhbHVlID0gXCIgKyB2ICsgXCI7XCI7XG4gICAgfVxuXG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwiKGZ1bmN0aW9uKHRyZWUpIHtcblxudHJlZS5WYXJpYWJsZSA9IGZ1bmN0aW9uIFZhcmlhYmxlKG5hbWUsIGluZGV4LCBmaWxlbmFtZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMuZmlsZW5hbWUgPSBmaWxlbmFtZTtcbn07XG5cbnRyZWUuVmFyaWFibGUucHJvdG90eXBlID0ge1xuICAgIGlzOiAndmFyaWFibGUnLFxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgICB9LFxuICAgIGV2OiBmdW5jdGlvbihlbnYpIHtcbiAgICAgICAgdmFyIHZhcmlhYmxlLFxuICAgICAgICAgICAgdixcbiAgICAgICAgICAgIG5hbWUgPSB0aGlzLm5hbWU7XG5cbiAgICAgICAgaWYgKHRoaXMuX2NzcykgcmV0dXJuIHRoaXMuX2NzcztcblxuICAgICAgICB2YXIgdGhpc2ZyYW1lID0gZW52LmZyYW1lcy5maWx0ZXIoZnVuY3Rpb24oZikge1xuICAgICAgICAgICAgcmV0dXJuIGYubmFtZSA9PSB0aGlzLm5hbWU7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIGlmICh0aGlzZnJhbWUubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc2ZyYW1lWzBdLnZhbHVlLmV2KGVudik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbnYuZXJyb3Ioe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICd2YXJpYWJsZSAnICsgdGhpcy5uYW1lICsgJyBpcyB1bmRlZmluZWQnLFxuICAgICAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICAgICAgICAgIHR5cGU6ICdydW50aW1lJyxcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlzOiAndW5kZWZpbmVkJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG59KShyZXF1aXJlKCcuLi90cmVlJykpO1xuIiwidmFyIHRyZWUgPSByZXF1aXJlKCcuLi90cmVlJyk7XG5cbi8vIFN0b3JhZ2UgZm9yIHpvb20gcmFuZ2VzLiBPbmx5IHN1cHBvcnRzIGNvbnRpbnVvdXMgcmFuZ2VzLFxuLy8gYW5kIHN0b3JlcyB0aGVtIGFzIGJpdC1zZXF1ZW5jZXMgc28gdGhhdCB0aGV5IGNhbiBiZSBjb21iaW5lZCxcbi8vIGludmVydGVkLCBhbmQgY29tcGFyZWQgcXVpY2tseS5cbnRyZWUuWm9vbSA9IGZ1bmN0aW9uKG9wLCB2YWx1ZSwgaW5kZXgpIHtcbiAgICB0aGlzLm9wID0gb3A7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbn07XG5cbnRyZWUuWm9vbS5wcm90b3R5cGUuc2V0Wm9vbSA9IGZ1bmN0aW9uKHpvb20pIHtcbiAgICB0aGlzLnpvb20gPSB6b29tO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxudHJlZS5ab29tLnByb3RvdHlwZS5ldiA9IGZ1bmN0aW9uKGVudikge1xuICAgIHZhciBzdGFydCA9IDAsXG4gICAgICAgIGVuZCA9IEluZmluaXR5LFxuICAgICAgICB2YWx1ZSA9IHBhcnNlSW50KHRoaXMudmFsdWUuZXYoZW52KS50b1N0cmluZygpLCAxMCksXG4gICAgICAgIHpvb20gPSAwO1xuXG4gICAgaWYgKHZhbHVlID4gdHJlZS5ab29tLm1heFpvb20gfHwgdmFsdWUgPCAwKSB7XG4gICAgICAgIGVudi5lcnJvcih7XG4gICAgICAgICAgICBtZXNzYWdlOiAnT25seSB6b29tIGxldmVscyBiZXR3ZWVuIDAgYW5kICcgK1xuICAgICAgICAgICAgICAgIHRyZWUuWm9vbS5tYXhab29tICsgJyBzdXBwb3J0ZWQuJyxcbiAgICAgICAgICAgIGluZGV4OiB0aGlzLmluZGV4XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN3aXRjaCAodGhpcy5vcCkge1xuICAgICAgICBjYXNlICc9JzpcbiAgICAgICAgICAgIHRoaXMuem9vbSA9IDEgPDwgdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgY2FzZSAnPic6XG4gICAgICAgICAgICBzdGFydCA9IHZhbHVlICsgMTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc+PSc6XG4gICAgICAgICAgICBzdGFydCA9IHZhbHVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzwnOlxuICAgICAgICAgICAgZW5kID0gdmFsdWUgLSAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzw9JzpcbiAgICAgICAgICAgIGVuZCA9IHZhbHVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHRyZWUuWm9vbS5tYXhab29tOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPj0gc3RhcnQgJiYgaSA8PSBlbmQpIHtcbiAgICAgICAgICAgIHpvb20gfD0gKDEgPDwgaSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy56b29tID0gem9vbTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbnRyZWUuWm9vbS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy56b29tO1xufTtcblxuLy8gQ292ZXJzIGFsbCB6b29tbGV2ZWxzIGZyb20gMCB0byAyMlxudHJlZS5ab29tLmFsbCA9IDB4N0ZGRkZGO1xuXG50cmVlLlpvb20ubWF4Wm9vbSA9IDIyO1xuXG50cmVlLlpvb20ucmFuZ2VzID0ge1xuICAgICAwOiAxMDAwMDAwMDAwLFxuICAgICAxOiA1MDAwMDAwMDAsXG4gICAgIDI6IDIwMDAwMDAwMCxcbiAgICAgMzogMTAwMDAwMDAwLFxuICAgICA0OiA1MDAwMDAwMCxcbiAgICAgNTogMjUwMDAwMDAsXG4gICAgIDY6IDEyNTAwMDAwLFxuICAgICA3OiA2NTAwMDAwLFxuICAgICA4OiAzMDAwMDAwLFxuICAgICA5OiAxNTAwMDAwLFxuICAgIDEwOiA3NTAwMDAsXG4gICAgMTE6IDQwMDAwMCxcbiAgICAxMjogMjAwMDAwLFxuICAgIDEzOiAxMDAwMDAsXG4gICAgMTQ6IDUwMDAwLFxuICAgIDE1OiAyNTAwMCxcbiAgICAxNjogMTI1MDAsXG4gICAgMTc6IDUwMDAsXG4gICAgMTg6IDI1MDAsXG4gICAgMTk6IDE1MDAsXG4gICAgMjA6IDc1MCxcbiAgICAyMTogNTAwLFxuICAgIDIyOiAyNTAsXG4gICAgMjM6IDEwMFxufTtcblxuLy8gT25seSB3b3JrcyBmb3Igc2luZ2xlIHJhbmdlIHpvb21zLiBgW1hYWC4uLi5YWFhYWC4uLi4uLi4uLl1gIGlzIGludmFsaWQuXG50cmVlLlpvb20ucHJvdG90eXBlLnRvWE1MID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvbmRpdGlvbnMgPSBbXTtcbiAgICBpZiAodGhpcy56b29tICE9IHRyZWUuWm9vbS5hbGwpIHtcbiAgICAgICAgdmFyIHN0YXJ0ID0gbnVsbCwgZW5kID0gbnVsbDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gdHJlZS5ab29tLm1heFpvb207IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuem9vbSAmICgxIDw8IGkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0ID09PSBudWxsKSBzdGFydCA9IGk7XG4gICAgICAgICAgICAgICAgZW5kID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnQgPiAwKSBjb25kaXRpb25zLnB1c2goJyAgICA8TWF4U2NhbGVEZW5vbWluYXRvcj4nICtcbiAgICAgICAgICAgIHRyZWUuWm9vbS5yYW5nZXNbc3RhcnRdICsgJzwvTWF4U2NhbGVEZW5vbWluYXRvcj5cXG4nKTtcbiAgICAgICAgaWYgKGVuZCA8IDIyKSBjb25kaXRpb25zLnB1c2goJyAgICA8TWluU2NhbGVEZW5vbWluYXRvcj4nICtcbiAgICAgICAgICAgIHRyZWUuWm9vbS5yYW5nZXNbZW5kICsgMV0gKyAnPC9NaW5TY2FsZURlbm9taW5hdG9yPlxcbicpO1xuICAgIH1cbiAgICByZXR1cm4gY29uZGl0aW9ucztcbn07XG5cbnRyZWUuWm9vbS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RyID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gdHJlZS5ab29tLm1heFpvb207IGkrKykge1xuICAgICAgICBzdHIgKz0gKHRoaXMuem9vbSAmICgxIDw8IGkpKSA/ICdYJyA6ICcuJztcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn07XG4iLG51bGwsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmIChpc05hTih2YWx1ZSkgfHwgIWlzRmluaXRlKHZhbHVlKSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgICAga2V5LCBpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIihmdW5jdGlvbiAocHJvY2Vzcyl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoJ19wcm9jZXNzJykpIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuTXV0YXRpb25PYnNlcnZlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG5cbiAgICBpZiAoY2FuTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICB2YXIgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlTGlzdCA9IHF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcXVldWVMaXN0LmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGhpZGRlbkRpdiwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBoaWRkZW5EaXYuc2V0QXR0cmlidXRlKCd5ZXMnLCAnbm8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoJ19wcm9jZXNzJyksdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKF9fZGlybmFtZSl7XG52YXIgZnMgPSByZXF1aXJlKCdmcycpLFxuICAgIHBhdGggPSByZXF1aXJlKCdwYXRoJyksXG4gICAgZXhpc3RzU3luYyA9IHJlcXVpcmUoJ2ZzJykuZXhpc3RzU3luYyB8fCByZXF1aXJlKCdwYXRoJykuZXhpc3RzU3luYztcblxuLy8gTG9hZCBhbGwgc3RhdGVkIHZlcnNpb25zIGludG8gdGhlIG1vZHVsZSBleHBvcnRzXG5tb2R1bGUuZXhwb3J0cy52ZXJzaW9uID0ge307XG5cbnZhciByZWZzID0gW1xuICcyLjAuMCcsXG4gJzIuMC4xJyxcbiAnMi4wLjInLFxuICcyLjEuMCcsXG4gJzIuMS4xJyxcbiAnMi4yLjAnLFxuICcyLjMuMCcsXG4gJzMuMC4wJ1xuXTtcblxucmVmcy5tYXAoZnVuY3Rpb24odmVyc2lvbikge1xuICAgIG1vZHVsZS5leHBvcnRzLnZlcnNpb25bdmVyc2lvbl0gPSByZXF1aXJlKHBhdGguam9pbihfX2Rpcm5hbWUsIHZlcnNpb24sICdyZWZlcmVuY2UuanNvbicpKTtcbiAgICB2YXIgZHNfcGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsIHZlcnNpb24sICdkYXRhc291cmNlcy5qc29uJyk7XG4gICAgaWYgKGV4aXN0c1N5bmMoZHNfcGF0aCkpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMudmVyc2lvblt2ZXJzaW9uXS5kYXRhc291cmNlcyA9IHJlcXVpcmUoZHNfcGF0aCkuZGF0YXNvdXJjZXM7XG4gICAgfVxufSk7XG5cbn0pLmNhbGwodGhpcyxcIi9ub2RlX21vZHVsZXMvbWFwbmlrLXJlZmVyZW5jZVwiKSIsIi8vICAgICBVbmRlcnNjb3JlLmpzIDEuNi4wXG4vLyAgICAgaHR0cDovL3VuZGVyc2NvcmVqcy5vcmdcbi8vICAgICAoYykgMjAwOS0yMDE0IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4vLyAgICAgVW5kZXJzY29yZSBtYXkgYmUgZnJlZWx5IGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuKGZ1bmN0aW9uKCkge1xuXG4gIC8vIEJhc2VsaW5lIHNldHVwXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBleHBvcnRzYCBvbiB0aGUgc2VydmVyLlxuICB2YXIgcm9vdCA9IHRoaXM7XG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBfYCB2YXJpYWJsZS5cbiAgdmFyIHByZXZpb3VzVW5kZXJzY29yZSA9IHJvb3QuXztcblxuICAvLyBFc3RhYmxpc2ggdGhlIG9iamVjdCB0aGF0IGdldHMgcmV0dXJuZWQgdG8gYnJlYWsgb3V0IG9mIGEgbG9vcCBpdGVyYXRpb24uXG4gIHZhciBicmVha2VyID0ge307XG5cbiAgLy8gU2F2ZSBieXRlcyBpbiB0aGUgbWluaWZpZWQgKGJ1dCBub3QgZ3ppcHBlZCkgdmVyc2lvbjpcbiAgdmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZSwgRnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4gIC8vIENyZWF0ZSBxdWljayByZWZlcmVuY2UgdmFyaWFibGVzIGZvciBzcGVlZCBhY2Nlc3MgdG8gY29yZSBwcm90b3R5cGVzLlxuICB2YXJcbiAgICBwdXNoICAgICAgICAgICAgID0gQXJyYXlQcm90by5wdXNoLFxuICAgIHNsaWNlICAgICAgICAgICAgPSBBcnJheVByb3RvLnNsaWNlLFxuICAgIGNvbmNhdCAgICAgICAgICAgPSBBcnJheVByb3RvLmNvbmNhdCxcbiAgICB0b1N0cmluZyAgICAgICAgID0gT2JqUHJvdG8udG9TdHJpbmcsXG4gICAgaGFzT3duUHJvcGVydHkgICA9IE9ialByb3RvLmhhc093blByb3BlcnR5O1xuXG4gIC8vIEFsbCAqKkVDTUFTY3JpcHQgNSoqIG5hdGl2ZSBmdW5jdGlvbiBpbXBsZW1lbnRhdGlvbnMgdGhhdCB3ZSBob3BlIHRvIHVzZVxuICAvLyBhcmUgZGVjbGFyZWQgaGVyZS5cbiAgdmFyXG4gICAgbmF0aXZlRm9yRWFjaCAgICAgID0gQXJyYXlQcm90by5mb3JFYWNoLFxuICAgIG5hdGl2ZU1hcCAgICAgICAgICA9IEFycmF5UHJvdG8ubWFwLFxuICAgIG5hdGl2ZVJlZHVjZSAgICAgICA9IEFycmF5UHJvdG8ucmVkdWNlLFxuICAgIG5hdGl2ZVJlZHVjZVJpZ2h0ICA9IEFycmF5UHJvdG8ucmVkdWNlUmlnaHQsXG4gICAgbmF0aXZlRmlsdGVyICAgICAgID0gQXJyYXlQcm90by5maWx0ZXIsXG4gICAgbmF0aXZlRXZlcnkgICAgICAgID0gQXJyYXlQcm90by5ldmVyeSxcbiAgICBuYXRpdmVTb21lICAgICAgICAgPSBBcnJheVByb3RvLnNvbWUsXG4gICAgbmF0aXZlSW5kZXhPZiAgICAgID0gQXJyYXlQcm90by5pbmRleE9mLFxuICAgIG5hdGl2ZUxhc3RJbmRleE9mICA9IEFycmF5UHJvdG8ubGFzdEluZGV4T2YsXG4gICAgbmF0aXZlSXNBcnJheSAgICAgID0gQXJyYXkuaXNBcnJheSxcbiAgICBuYXRpdmVLZXlzICAgICAgICAgPSBPYmplY3Qua2V5cyxcbiAgICBuYXRpdmVCaW5kICAgICAgICAgPSBGdW5jUHJvdG8uYmluZDtcblxuICAvLyBDcmVhdGUgYSBzYWZlIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yIHVzZSBiZWxvdy5cbiAgdmFyIF8gPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgXykgcmV0dXJuIG9iajtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgXykpIHJldHVybiBuZXcgXyhvYmopO1xuICAgIHRoaXMuX3dyYXBwZWQgPSBvYmo7XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgKipOb2RlLmpzKiosIHdpdGhcbiAgLy8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIHRoZSBvbGQgYHJlcXVpcmUoKWAgQVBJLiBJZiB3ZSdyZSBpblxuICAvLyB0aGUgYnJvd3NlciwgYWRkIGBfYCBhcyBhIGdsb2JhbCBvYmplY3QgdmlhIGEgc3RyaW5nIGlkZW50aWZpZXIsXG4gIC8vIGZvciBDbG9zdXJlIENvbXBpbGVyIFwiYWR2YW5jZWRcIiBtb2RlLlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjYuMCc7XG5cbiAgLy8gQ29sbGVjdGlvbiBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUaGUgY29ybmVyc3RvbmUsIGFuIGBlYWNoYCBpbXBsZW1lbnRhdGlvbiwgYWthIGBmb3JFYWNoYC5cbiAgLy8gSGFuZGxlcyBvYmplY3RzIHdpdGggdGhlIGJ1aWx0LWluIGBmb3JFYWNoYCwgYXJyYXlzLCBhbmQgcmF3IG9iamVjdHMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmb3JFYWNoYCBpZiBhdmFpbGFibGUuXG4gIHZhciBlYWNoID0gXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIG9iajtcbiAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIHJlc3VsdHMgb2YgYXBwbHlpbmcgdGhlIGl0ZXJhdG9yIHRvIGVhY2ggZWxlbWVudC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYG1hcGAgaWYgYXZhaWxhYmxlLlxuICBfLm1hcCA9IF8uY29sbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZU1hcCAmJiBvYmoubWFwID09PSBuYXRpdmVNYXApIHJldHVybiBvYmoubWFwKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICB2YXIgcmVkdWNlRXJyb3IgPSAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZSc7XG5cbiAgLy8gKipSZWR1Y2UqKiBidWlsZHMgdXAgYSBzaW5nbGUgcmVzdWx0IGZyb20gYSBsaXN0IG9mIHZhbHVlcywgYWthIGBpbmplY3RgLFxuICAvLyBvciBgZm9sZGxgLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlYCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlID0gXy5mb2xkbCA9IF8uaW5qZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlICYmIG9iai5yZWR1Y2UgPT09IG5hdGl2ZVJlZHVjZSkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZShpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlKGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSB2YWx1ZTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gVGhlIHJpZ2h0LWFzc29jaWF0aXZlIHZlcnNpb24gb2YgcmVkdWNlLCBhbHNvIGtub3duIGFzIGBmb2xkcmAuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VSaWdodGAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZVJpZ2h0ID0gXy5mb2xkciA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZVJpZ2h0ICYmIG9iai5yZWR1Y2VSaWdodCA9PT0gbmF0aXZlUmVkdWNlUmlnaHQpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IpO1xuICAgIH1cbiAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoICE9PSArbGVuZ3RoKSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGluZGV4ID0ga2V5cyA/IGtleXNbLS1sZW5ndGhdIDogLS1sZW5ndGg7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IG9ialtpbmRleF07XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgb2JqW2luZGV4XSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBmaXJzdCB2YWx1ZSB3aGljaCBwYXNzZXMgYSB0cnV0aCB0ZXN0LiBBbGlhc2VkIGFzIGBkZXRlY3RgLlxuICBfLmZpbmQgPSBfLmRldGVjdCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgcGFzcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmaWx0ZXJgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgc2VsZWN0YC5cbiAgXy5maWx0ZXIgPSBfLnNlbGVjdCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVGaWx0ZXIgJiYgb2JqLmZpbHRlciA9PT0gbmF0aXZlRmlsdGVyKSByZXR1cm4gb2JqLmZpbHRlcihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSByZXN1bHRzLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCBhIHRydXRoIHRlc3QgZmFpbHMuXG4gIF8ucmVqZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiAhcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9LCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGV2ZXJ5YCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlIHx8IChwcmVkaWNhdGUgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZUV2ZXJ5ICYmIG9iai5ldmVyeSA9PT0gbmF0aXZlRXZlcnkpIHJldHVybiBvYmouZXZlcnkocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIShyZXN1bHQgPSByZXN1bHQgJiYgcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgYXQgbGVhc3Qgb25lIGVsZW1lbnQgaW4gdGhlIG9iamVjdCBtYXRjaGVzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHNvbWVgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYW55YC5cbiAgdmFyIGFueSA9IF8uc29tZSA9IF8uYW55ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgfHwgKHByZWRpY2F0ZSA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZVNvbWUgJiYgb2JqLnNvbWUgPT09IG5hdGl2ZVNvbWUpIHJldHVybiBvYmouc29tZShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBhcnJheSBvciBvYmplY3QgY29udGFpbnMgYSBnaXZlbiB2YWx1ZSAodXNpbmcgYD09PWApLlxuICAvLyBBbGlhc2VkIGFzIGBpbmNsdWRlYC5cbiAgXy5jb250YWlucyA9IF8uaW5jbHVkZSA9IGZ1bmN0aW9uKG9iaiwgdGFyZ2V0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5hdGl2ZUluZGV4T2YgJiYgb2JqLmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBvYmouaW5kZXhPZih0YXJnZXQpICE9IC0xO1xuICAgIHJldHVybiBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSB0YXJnZXQ7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gSW52b2tlIGEgbWV0aG9kICh3aXRoIGFyZ3VtZW50cykgb24gZXZlcnkgaXRlbSBpbiBhIGNvbGxlY3Rpb24uXG4gIF8uaW52b2tlID0gZnVuY3Rpb24ob2JqLCBtZXRob2QpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgaXNGdW5jID0gXy5pc0Z1bmN0aW9uKG1ldGhvZCk7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiAoaXNGdW5jID8gbWV0aG9kIDogdmFsdWVbbWV0aG9kXSkuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYG1hcGA6IGZldGNoaW5nIGEgcHJvcGVydHkuXG4gIF8ucGx1Y2sgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBfLm1hcChvYmosIF8ucHJvcGVydHkoa2V5KSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIF8ubWF0Y2hlcyhhdHRycykpO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbmRgOiBnZXR0aW5nIHRoZSBmaXJzdCBvYmplY3RcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5maW5kV2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8uZmluZChvYmosIF8ubWF0Y2hlcyhhdHRycykpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IG9yIChlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgLy8gQ2FuJ3Qgb3B0aW1pemUgYXJyYXlzIG9mIGludGVnZXJzIGxvbmdlciB0aGFuIDY1LDUzNSBlbGVtZW50cy5cbiAgLy8gU2VlIFtXZWJLaXQgQnVnIDgwNzk3XShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODA3OTcpXG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSAtSW5maW5pdHksIGxhc3RDb21wdXRlZCA9IC1JbmZpbml0eTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgaWYgKGNvbXB1dGVkID4gbGFzdENvbXB1dGVkKSB7XG4gICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICBsYXN0Q29tcHV0ZWQgPSBjb21wdXRlZDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWluaW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5taW4gPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4uYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9IEluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSBJbmZpbml0eTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgaWYgKGNvbXB1dGVkIDwgbGFzdENvbXB1dGVkKSB7XG4gICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICBsYXN0Q29tcHV0ZWQgPSBjb21wdXRlZDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYW4gYXJyYXksIHVzaW5nIHRoZSBtb2Rlcm4gdmVyc2lvbiBvZiB0aGVcbiAgLy8gW0Zpc2hlci1ZYXRlcyBzaHVmZmxlXShodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Zpc2hlcuKAk1lhdGVzX3NodWZmbGUpLlxuICBfLnNodWZmbGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmFuZDtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzaHVmZmxlZCA9IFtdO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmFuZCA9IF8ucmFuZG9tKGluZGV4KyspO1xuICAgICAgc2h1ZmZsZWRbaW5kZXggLSAxXSA9IHNodWZmbGVkW3JhbmRdO1xuICAgICAgc2h1ZmZsZWRbcmFuZF0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2h1ZmZsZWQ7XG4gIH07XG5cbiAgLy8gU2FtcGxlICoqbioqIHJhbmRvbSB2YWx1ZXMgZnJvbSBhIGNvbGxlY3Rpb24uXG4gIC8vIElmICoqbioqIGlzIG5vdCBzcGVjaWZpZWQsIHJldHVybnMgYSBzaW5nbGUgcmFuZG9tIGVsZW1lbnQuXG4gIC8vIFRoZSBpbnRlcm5hbCBgZ3VhcmRgIGFyZ3VtZW50IGFsbG93cyBpdCB0byB3b3JrIHdpdGggYG1hcGAuXG4gIF8uc2FtcGxlID0gZnVuY3Rpb24ob2JqLCBuLCBndWFyZCkge1xuICAgIGlmIChuID09IG51bGwgfHwgZ3VhcmQpIHtcbiAgICAgIGlmIChvYmoubGVuZ3RoICE9PSArb2JqLmxlbmd0aCkgb2JqID0gXy52YWx1ZXMob2JqKTtcbiAgICAgIHJldHVybiBvYmpbXy5yYW5kb20ob2JqLmxlbmd0aCAtIDEpXTtcbiAgICB9XG4gICAgcmV0dXJuIF8uc2h1ZmZsZShvYmopLnNsaWNlKDAsIE1hdGgubWF4KDAsIG4pKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBnZW5lcmF0ZSBsb29rdXAgaXRlcmF0b3JzLlxuICB2YXIgbG9va3VwSXRlcmF0b3IgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gXy5pZGVudGl0eTtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuICAgIHJldHVybiBfLnByb3BlcnR5KHZhbHVlKTtcbiAgfTtcblxuICAvLyBTb3J0IHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24gcHJvZHVjZWQgYnkgYW4gaXRlcmF0b3IuXG4gIF8uc29ydEJ5ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IoaXRlcmF0b3IpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXg7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24oYmVoYXZpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcihpdGVyYXRvcik7XG4gICAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIF8uaGFzKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldLnB1c2godmFsdWUpIDogcmVzdWx0W2tleV0gPSBbdmFsdWVdO1xuICB9KTtcblxuICAvLyBJbmRleGVzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24sIHNpbWlsYXIgdG8gYGdyb3VwQnlgLCBidXQgZm9yXG4gIC8vIHdoZW4geW91IGtub3cgdGhhdCB5b3VyIGluZGV4IHZhbHVlcyB3aWxsIGJlIHVuaXF1ZS5cbiAgXy5pbmRleEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgfSk7XG5cbiAgLy8gQ291bnRzIGluc3RhbmNlcyBvZiBhbiBvYmplY3QgdGhhdCBncm91cCBieSBhIGNlcnRhaW4gY3JpdGVyaW9uLiBQYXNzXG4gIC8vIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGUgdG8gY291bnQgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZVxuICAvLyBjcml0ZXJpb24uXG4gIF8uY291bnRCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5KSB7XG4gICAgXy5oYXMocmVzdWx0LCBrZXkpID8gcmVzdWx0W2tleV0rKyA6IHJlc3VsdFtrZXldID0gMTtcbiAgfSk7XG5cbiAgLy8gVXNlIGEgY29tcGFyYXRvciBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHRoZSBzbWFsbGVzdCBpbmRleCBhdCB3aGljaFxuICAvLyBhbiBvYmplY3Qgc2hvdWxkIGJlIGluc2VydGVkIHNvIGFzIHRvIG1haW50YWluIG9yZGVyLiBVc2VzIGJpbmFyeSBzZWFyY2guXG4gIF8uc29ydGVkSW5kZXggPSBmdW5jdGlvbihhcnJheSwgb2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IoaXRlcmF0b3IpO1xuICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcbiAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgYXJyYXlbbWlkXSkgPCB2YWx1ZSA/IGxvdyA9IG1pZCArIDEgOiBoaWdoID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG93O1xuICB9O1xuXG4gIC8vIFNhZmVseSBjcmVhdGUgYSByZWFsLCBsaXZlIGFycmF5IGZyb20gYW55dGhpbmcgaXRlcmFibGUuXG4gIF8udG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghb2JqKSByZXR1cm4gW107XG4gICAgaWYgKF8uaXNBcnJheShvYmopKSByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xuICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgcmV0dXJuIF8ubWFwKG9iaiwgXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIF8udmFsdWVzKG9iaik7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4gYW4gb2JqZWN0LlxuICBfLnNpemUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiAwO1xuICAgIHJldHVybiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpID8gb2JqLmxlbmd0aCA6IF8ua2V5cyhvYmopLmxlbmd0aDtcbiAgfTtcblxuICAvLyBBcnJheSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gR2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBmaXJzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYGhlYWRgIGFuZCBgdGFrZWAuIFRoZSAqKmd1YXJkKiogY2hlY2tcbiAgLy8gYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmZpcnN0ID0gXy5oZWFkID0gXy50YWtlID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKChuID09IG51bGwpIHx8IGd1YXJkKSByZXR1cm4gYXJyYXlbMF07XG4gICAgaWYgKG4gPCAwKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIDAsIG4pO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGxhc3QgZW50cnkgb2YgdGhlIGFycmF5LiBFc3BlY2lhbGx5IHVzZWZ1bCBvblxuICAvLyB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiBhbGwgdGhlIHZhbHVlcyBpblxuICAvLyB0aGUgYXJyYXksIGV4Y2x1ZGluZyB0aGUgbGFzdCBOLiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGhcbiAgLy8gYF8ubWFwYC5cbiAgXy5pbml0aWFsID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIDAsIGFycmF5Lmxlbmd0aCAtICgobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKSk7XG4gIH07XG5cbiAgLy8gR2V0IHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGxhc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5sYXN0ID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKChuID09IG51bGwpIHx8IGd1YXJkKSByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBmaXJzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYHRhaWxgIGFuZCBgZHJvcGAuXG4gIC8vIEVzcGVjaWFsbHkgdXNlZnVsIG9uIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nIGFuICoqbioqIHdpbGwgcmV0dXJuXG4gIC8vIHRoZSByZXN0IE4gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKlxuICAvLyBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ucmVzdCA9IF8udGFpbCA9IF8uZHJvcCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIG91dHB1dCkge1xuICAgIGlmIChzaGFsbG93ICYmIF8uZXZlcnkoaW5wdXQsIF8uaXNBcnJheSkpIHtcbiAgICAgIHJldHVybiBjb25jYXQuYXBwbHkob3V0cHV0LCBpbnB1dCk7XG4gICAgfVxuICAgIGVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoXy5pc0FycmF5KHZhbHVlKSB8fCBfLmlzQXJndW1lbnRzKHZhbHVlKSkge1xuICAgICAgICBzaGFsbG93ID8gcHVzaC5hcHBseShvdXRwdXQsIHZhbHVlKSA6IGZsYXR0ZW4odmFsdWUsIHNoYWxsb3csIG91dHB1dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICAvLyBGbGF0dGVuIG91dCBhbiBhcnJheSwgZWl0aGVyIHJlY3Vyc2l2ZWx5IChieSBkZWZhdWx0KSwgb3IganVzdCBvbmUgbGV2ZWwuXG4gIF8uZmxhdHRlbiA9IGZ1bmN0aW9uKGFycmF5LCBzaGFsbG93KSB7XG4gICAgcmV0dXJuIGZsYXR0ZW4oYXJyYXksIHNoYWxsb3csIFtdKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSB2ZXJzaW9uIG9mIHRoZSBhcnJheSB0aGF0IGRvZXMgbm90IGNvbnRhaW4gdGhlIHNwZWNpZmllZCB2YWx1ZShzKS5cbiAgXy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5kaWZmZXJlbmNlKGFycmF5LCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuXG4gIC8vIFNwbGl0IGFuIGFycmF5IGludG8gdHdvIGFycmF5czogb25lIHdob3NlIGVsZW1lbnRzIGFsbCBzYXRpc2Z5IHRoZSBnaXZlblxuICAvLyBwcmVkaWNhdGUsIGFuZCBvbmUgd2hvc2UgZWxlbWVudHMgYWxsIGRvIG5vdCBzYXRpc2Z5IHRoZSBwcmVkaWNhdGUuXG4gIF8ucGFydGl0aW9uID0gZnVuY3Rpb24oYXJyYXksIHByZWRpY2F0ZSkge1xuICAgIHZhciBwYXNzID0gW10sIGZhaWwgPSBbXTtcbiAgICBlYWNoKGFycmF5LCBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAocHJlZGljYXRlKGVsZW0pID8gcGFzcyA6IGZhaWwpLnB1c2goZWxlbSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFtwYXNzLCBmYWlsXTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0b3I7XG4gICAgICBpdGVyYXRvciA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGluaXRpYWwgPSBpdGVyYXRvciA/IF8ubWFwKGFycmF5LCBpdGVyYXRvciwgY29udGV4dCkgOiBhcnJheTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZWFjaChpbml0aWFsLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIGlmIChpc1NvcnRlZCA/ICghaW5kZXggfHwgc2VlbltzZWVuLmxlbmd0aCAtIDFdICE9PSB2YWx1ZSkgOiAhXy5jb250YWlucyhzZWVuLCB2YWx1ZSkpIHtcbiAgICAgICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKF8udW5pcShhcnJheSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KHJlc3QsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfLmNvbnRhaW5zKG90aGVyLCBpdGVtKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFRha2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBvbmUgYXJyYXkgYW5kIGEgbnVtYmVyIG9mIG90aGVyIGFycmF5cy5cbiAgLy8gT25seSB0aGUgZWxlbWVudHMgcHJlc2VudCBpbiBqdXN0IHRoZSBmaXJzdCBhcnJheSB3aWxsIHJlbWFpbi5cbiAgXy5kaWZmZXJlbmNlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gIV8uY29udGFpbnMocmVzdCwgdmFsdWUpOyB9KTtcbiAgfTtcblxuICAvLyBaaXAgdG9nZXRoZXIgbXVsdGlwbGUgbGlzdHMgaW50byBhIHNpbmdsZSBhcnJheSAtLSBlbGVtZW50cyB0aGF0IHNoYXJlXG4gIC8vIGFuIGluZGV4IGdvIHRvZ2V0aGVyLlxuICBfLnppcCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsZW5ndGggPSBfLm1heChfLnBsdWNrKGFyZ3VtZW50cywgJ2xlbmd0aCcpLmNvbmNhdCgwKSk7XG4gICAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRzW2ldID0gXy5wbHVjayhhcmd1bWVudHMsICcnICsgaSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4ge307XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwbHkgdXMgd2l0aCBpbmRleE9mIChJJ20gbG9va2luZyBhdCB5b3UsICoqTVNJRSoqKSxcbiAgLy8gd2UgbmVlZCB0aGlzIGZ1bmN0aW9uLiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuXG4gIC8vIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBpbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gKGlzU29ydGVkIDwgMCA/IE1hdGgubWF4KDAsIGxlbmd0aCArIGlzU29ydGVkKSA6IGlzU29ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBfLnNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2ldID09PSBpdGVtID8gaSA6IC0xO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBhcnJheS5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtLCBpc1NvcnRlZCk7XG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGxhc3RJbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGhhc0luZGV4ID0gZnJvbSAhPSBudWxsO1xuICAgIGlmIChuYXRpdmVMYXN0SW5kZXhPZiAmJiBhcnJheS5sYXN0SW5kZXhPZiA9PT0gbmF0aXZlTGFzdEluZGV4T2YpIHtcbiAgICAgIHJldHVybiBoYXNJbmRleCA/IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0sIGZyb20pIDogYXJyYXkubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfVxuICAgIHZhciBpID0gKGhhc0luZGV4ID8gZnJvbSA6IGFycmF5Lmxlbmd0aCk7XG4gICAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IGFyZ3VtZW50c1syXSB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgQXJyYXkobGVuZ3RoKTtcblxuICAgIHdoaWxlKGlkeCA8IGxlbmd0aCkge1xuICAgICAgcmFuZ2VbaWR4KytdID0gc3RhcnQ7XG4gICAgICBzdGFydCArPSBzdGVwO1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldXNhYmxlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBwcm90b3R5cGUgc2V0dGluZy5cbiAgdmFyIGN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgdmFyIGFyZ3MsIGJvdW5kO1xuICAgIGlmIChuYXRpdmVCaW5kICYmIGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBpZiAoIV8uaXNGdW5jdGlvbihmdW5jKSkgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSkgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIHNlbGYgPSBuZXcgY3RvcjtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgaWYgKE9iamVjdChyZXN1bHQpID09PSByZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuIF8gYWN0c1xuICAvLyBhcyBhIHBsYWNlaG9sZGVyLCBhbGxvd2luZyBhbnkgY29tYmluYXRpb24gb2YgYXJndW1lbnRzIHRvIGJlIHByZS1maWxsZWQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYm91bmRBcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBwb3NpdGlvbiA9IDA7XG4gICAgICB2YXIgYXJncyA9IGJvdW5kQXJncy5zbGljZSgpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFyZ3NbaV0gPT09IF8pIGFyZ3NbaV0gPSBhcmd1bWVudHNbcG9zaXRpb24rK107XG4gICAgICB9XG4gICAgICB3aGlsZSAocG9zaXRpb24gPCBhcmd1bWVudHMubGVuZ3RoKSBhcmdzLnB1c2goYXJndW1lbnRzW3Bvc2l0aW9uKytdKTtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQmluZCBhIG51bWJlciBvZiBhbiBvYmplY3QncyBtZXRob2RzIHRvIHRoYXQgb2JqZWN0LiBSZW1haW5pbmcgYXJndW1lbnRzXG4gIC8vIGFyZSB0aGUgbWV0aG9kIG5hbWVzIHRvIGJlIGJvdW5kLiBVc2VmdWwgZm9yIGVuc3VyaW5nIHRoYXQgYWxsIGNhbGxiYWNrc1xuICAvLyBkZWZpbmVkIG9uIGFuIG9iamVjdCBiZWxvbmcgdG8gaXQuXG4gIF8uYmluZEFsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBmdW5jcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBpZiAoZnVuY3MubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ2JpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXMnKTtcbiAgICBlYWNoKGZ1bmNzLCBmdW5jdGlvbihmKSB7IG9ialtmXSA9IF8uYmluZChvYmpbZl0sIG9iaik7IH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW8gPSB7fTtcbiAgICBoYXNoZXIgfHwgKGhhc2hlciA9IF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBrZXkgPSBoYXNoZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBfLmhhcyhtZW1vLCBrZXkpID8gbWVtb1trZXldIDogKG1lbW9ba2V5XSA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBEZWxheXMgYSBmdW5jdGlvbiBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIGFuZCB0aGVuIGNhbGxzXG4gIC8vIGl0IHdpdGggdGhlIGFyZ3VtZW50cyBzdXBwbGllZC5cbiAgXy5kZWxheSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpeyByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTsgfSwgd2FpdCk7XG4gIH07XG5cbiAgLy8gRGVmZXJzIGEgZnVuY3Rpb24sIHNjaGVkdWxpbmcgaXQgdG8gcnVuIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzXG4gIC8vIGNsZWFyZWQuXG4gIF8uZGVmZXIgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgcmV0dXJuIF8uZGVsYXkuYXBwbHkoXywgW2Z1bmMsIDFdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIHdoZW4gaW52b2tlZCwgd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBhdCBtb3N0IG9uY2VcbiAgLy8gZHVyaW5nIGEgZ2l2ZW4gd2luZG93IG9mIHRpbWUuIE5vcm1hbGx5LCB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHdpbGwgcnVuXG4gIC8vIGFzIG11Y2ggYXMgaXQgY2FuLCB3aXRob3V0IGV2ZXIgZ29pbmcgbW9yZSB0aGFuIG9uY2UgcGVyIGB3YWl0YCBkdXJhdGlvbjtcbiAgLy8gYnV0IGlmIHlvdSdkIGxpa2UgdG8gZGlzYWJsZSB0aGUgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2UsIHBhc3NcbiAgLy8gYHtsZWFkaW5nOiBmYWxzZX1gLiBUbyBkaXNhYmxlIGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSwgZGl0dG8uXG4gIF8udGhyb3R0bGUgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRleHQsIGFyZ3MsIHJlc3VsdDtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgdmFyIHByZXZpb3VzID0gMDtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IF8ubm93KCk7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbm93ID0gXy5ub3coKTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuXG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGFzdCA9IF8ubm93KCkgLSB0aW1lc3RhbXA7XG4gICAgICBpZiAobGFzdCA8IHdhaXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBpZiAoIWltbWVkaWF0ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHRpbWVzdGFtcCA9IF8ubm93KCk7XG4gICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICB9XG4gICAgICBpZiAoY2FsbE5vdykge1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIGF0IG1vc3Qgb25lIHRpbWUsIG5vIG1hdHRlciBob3dcbiAgLy8gb2Z0ZW4geW91IGNhbGwgaXQuIFVzZWZ1bCBmb3IgbGF6eSBpbml0aWFsaXphdGlvbi5cbiAgXy5vbmNlID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocmFuKSByZXR1cm4gbWVtbztcbiAgICAgIHJhbiA9IHRydWU7XG4gICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgZnVuYyA9IG51bGw7XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGZ1bmN0aW9uIHBhc3NlZCBhcyBhbiBhcmd1bWVudCB0byB0aGUgc2Vjb25kLFxuICAvLyBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGFyZ3VtZW50cywgcnVuIGNvZGUgYmVmb3JlIGFuZCBhZnRlciwgYW5kXG4gIC8vIGNvbmRpdGlvbmFsbHkgZXhlY3V0ZSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXG4gIF8ud3JhcCA9IGZ1bmN0aW9uKGZ1bmMsIHdyYXBwZXIpIHtcbiAgICByZXR1cm4gXy5wYXJ0aWFsKHdyYXBwZXIsIGZ1bmMpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZvciAodmFyIGkgPSBmdW5jcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcmdzID0gW2Z1bmNzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gW107XG4gICAgaWYgKG5hdGl2ZUtleXMpIHJldHVybiBuYXRpdmVLZXlzKG9iaik7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBwYWlycyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhaXJzW2ldID0gW2tleXNbaV0sIG9ialtrZXlzW2ldXV07XG4gICAgfVxuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtvYmpba2V5c1tpXV1dID0ga2V5c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoIV8uY29udGFpbnMoa2V5cywga2V5KSkgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdm9pZCAwKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT0gMSAvIGI7XG4gICAgLy8gQSBzdHJpY3QgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBgbnVsbCA9PSB1bmRlZmluZWRgLlxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gYSA9PT0gYjtcbiAgICAvLyBVbndyYXAgYW55IHdyYXBwZWQgb2JqZWN0cy5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIF8pIGEgPSBhLl93cmFwcGVkO1xuICAgIGlmIChiIGluc3RhbmNlb2YgXykgYiA9IGIuX3dyYXBwZWQ7XG4gICAgLy8gQ29tcGFyZSBgW1tDbGFzc11dYCBuYW1lcy5cbiAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKTtcbiAgICBpZiAoY2xhc3NOYW1lICE9IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAvLyBQcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCB3cmFwcGVycyBhcmUgZXF1aXZhbGVudDsgdGh1cywgYFwiNVwiYCBpc1xuICAgICAgICAvLyBlcXVpdmFsZW50IHRvIGBuZXcgU3RyaW5nKFwiNVwiKWAuXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgIC8vIGBOYU5gcyBhcmUgZXF1aXZhbGVudCwgYnV0IG5vbi1yZWZsZXhpdmUuIEFuIGBlZ2FsYCBjb21wYXJpc29uIGlzIHBlcmZvcm1lZCBmb3JcbiAgICAgICAgLy8gb3RoZXIgbnVtZXJpYyB2YWx1ZXMuXG4gICAgICAgIHJldHVybiBhICE9ICthID8gYiAhPSArYiA6IChhID09IDAgPyAxIC8gYSA9PSAxIC8gYiA6IGEgPT0gK2IpO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09ICtiO1xuICAgICAgLy8gUmVnRXhwcyBhcmUgY29tcGFyZWQgYnkgdGhlaXIgc291cmNlIHBhdHRlcm5zIGFuZCBmbGFncy5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAgIHJldHVybiBhLnNvdXJjZSA9PSBiLnNvdXJjZSAmJlxuICAgICAgICAgICAgICAgYS5nbG9iYWwgPT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIGEubXVsdGlsaW5lID09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICAgICAgICBhLmlnbm9yZUNhc2UgPT0gYi5pZ25vcmVDYXNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICAvLyBBc3N1bWUgZXF1YWxpdHkgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGUgYWxnb3JpdGhtIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAgLy8gc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AuXG4gICAgdmFyIGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAvLyBMaW5lYXIgc2VhcmNoLiBQZXJmb3JtYW5jZSBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAgIGlmIChhU3RhY2tbbGVuZ3RoXSA9PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT0gYjtcbiAgICB9XG4gICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgKGFDdG9yIGluc3RhbmNlb2YgYUN0b3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgKGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpKVxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgKCdjb25zdHJ1Y3RvcicgaW4gYSAmJiAnY29uc3RydWN0b3InIGluIGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIEFkZCB0aGUgZmlyc3Qgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucHVzaChhKTtcbiAgICBiU3RhY2sucHVzaChiKTtcbiAgICB2YXIgc2l6ZSA9IDAsIHJlc3VsdCA9IHRydWU7XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgaWYgKGNsYXNzTmFtZSA9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIHNpemUgPSBhLmxlbmd0aDtcbiAgICAgIHJlc3VsdCA9IHNpemUgPT0gYi5sZW5ndGg7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIC8vIERlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXMuXG4gICAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBlcShhW3NpemVdLCBiW3NpemVdLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEZWVwIGNvbXBhcmUgb2JqZWN0cy5cbiAgICAgIGZvciAodmFyIGtleSBpbiBhKSB7XG4gICAgICAgIGlmIChfLmhhcyhhLCBrZXkpKSB7XG4gICAgICAgICAgLy8gQ291bnQgdGhlIGV4cGVjdGVkIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICAvLyBEZWVwIGNvbXBhcmUgZWFjaCBtZW1iZXIuXG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gXy5oYXMoYiwga2V5KSAmJiBlcShhW2tleV0sIGJba2V5XSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIEVuc3VyZSB0aGF0IGJvdGggb2JqZWN0cyBjb250YWluIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBmb3IgKGtleSBpbiBiKSB7XG4gICAgICAgICAgaWYgKF8uaGFzKGIsIGtleSkgJiYgIShzaXplLS0pKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSAhc2l6ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVtb3ZlIHRoZSBmaXJzdCBvYmplY3QgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnBvcCgpO1xuICAgIGJTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFBlcmZvcm0gYSBkZWVwIGNvbXBhcmlzb24gdG8gY2hlY2sgaWYgdHdvIG9iamVjdHMgYXJlIGVxdWFsLlxuICBfLmlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGVxKGEsIGIsIFtdLCBbXSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiBhcnJheSwgc3RyaW5nLCBvciBvYmplY3QgZW1wdHk/XG4gIC8vIEFuIFwiZW1wdHlcIiBvYmplY3QgaGFzIG5vIGVudW1lcmFibGUgb3duLXByb3BlcnRpZXMuXG4gIF8uaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSkgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBET00gZWxlbWVudD9cbiAgXy5pc0VsZW1lbnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gISEob2JqICYmIG9iai5ub2RlVHlwZSA9PT0gMSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhbiBhcnJheT9cbiAgLy8gRGVsZWdhdGVzIHRvIEVDTUE1J3MgbmF0aXZlIEFycmF5LmlzQXJyYXlcbiAgXy5pc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSBhbiBvYmplY3Q/XG4gIF8uaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgfTtcblxuICAvLyBBZGQgc29tZSBpc1R5cGUgbWV0aG9kczogaXNBcmd1bWVudHMsIGlzRnVuY3Rpb24sIGlzU3RyaW5nLCBpc051bWJlciwgaXNEYXRlLCBpc1JlZ0V4cC5cbiAgZWFjaChbJ0FyZ3VtZW50cycsICdGdW5jdGlvbicsICdTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnLCAnUmVnRXhwJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBfWydpcycgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCAnICsgbmFtZSArICddJztcbiAgICB9O1xuICB9KTtcblxuICAvLyBEZWZpbmUgYSBmYWxsYmFjayB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgaW4gYnJvd3NlcnMgKGFoZW0sIElFKSwgd2hlcmVcbiAgLy8gdGhlcmUgaXNuJ3QgYW55IGluc3BlY3RhYmxlIFwiQXJndW1lbnRzXCIgdHlwZS5cbiAgaWYgKCFfLmlzQXJndW1lbnRzKGFyZ3VtZW50cykpIHtcbiAgICBfLmlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gISEob2JqICYmIF8uaGFzKG9iaiwgJ2NhbGxlZScpKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gT3B0aW1pemUgYGlzRnVuY3Rpb25gIGlmIGFwcHJvcHJpYXRlLlxuICBpZiAodHlwZW9mICgvLi8pICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgXy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9O1xuICB9XG5cbiAgLy8gSXMgYSBnaXZlbiBvYmplY3QgYSBmaW5pdGUgbnVtYmVyP1xuICBfLmlzRmluaXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XG4gIH07XG5cbiAgLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGBOYU5gPyAoTmFOIGlzIHRoZSBvbmx5IG51bWJlciB3aGljaCBkb2VzIG5vdCBlcXVhbCBpdHNlbGYpLlxuICBfLmlzTmFOID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT0gK29iajtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgYm9vbGVhbj9cbiAgXy5pc0Jvb2xlYW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB0cnVlIHx8IG9iaiA9PT0gZmFsc2UgfHwgdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGVxdWFsIHRvIG51bGw/XG4gIF8uaXNOdWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIHVuZGVmaW5lZD9cbiAgXy5pc1VuZGVmaW5lZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHZvaWQgMDtcbiAgfTtcblxuICAvLyBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHByb3BlcnR5IGRpcmVjdGx5XG4gIC8vIG9uIGl0c2VsZiAoaW4gb3RoZXIgd29yZHMsIG5vdCBvbiBhIHByb3RvdHlwZSkuXG4gIF8uaGFzID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gIH07XG5cbiAgLy8gVXRpbGl0eSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSdW4gVW5kZXJzY29yZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgX2AgdmFyaWFibGUgdG8gaXRzXG4gIC8vIHByZXZpb3VzIG93bmVyLiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcm9vdC5fID0gcHJldmlvdXNVbmRlcnNjb3JlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIEtlZXAgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIGFyb3VuZCBmb3IgZGVmYXVsdCBpdGVyYXRvcnMuXG4gIF8uaWRlbnRpdHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICBfLmNvbnN0YW50ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG4gIH07XG5cbiAgXy5wcm9wZXJ0eSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmpba2V5XTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBwcmVkaWNhdGUgZm9yIGNoZWNraW5nIHdoZXRoZXIgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHNldCBvZiBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5tYXRjaGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICBpZiAob2JqID09PSBhdHRycykgcmV0dXJuIHRydWU7IC8vYXZvaWQgY29tcGFyaW5nIGFuIG9iamVjdCB0byBpdHNlbGYuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgaWYgKGF0dHJzW2tleV0gIT09IG9ialtrZXldKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfTtcblxuICAvLyBSdW4gYSBmdW5jdGlvbiAqKm4qKiB0aW1lcy5cbiAgXy50aW1lcyA9IGZ1bmN0aW9uKG4sIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGFjY3VtID0gQXJyYXkoTWF0aC5tYXgoMCwgbikpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSBhY2N1bVtpXSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgaSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIGFuZCBtYXggKGluY2x1c2l2ZSkuXG4gIF8ucmFuZG9tID0gZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICBpZiAobWF4ID09IG51bGwpIHtcbiAgICAgIG1heCA9IG1pbjtcbiAgICAgIG1pbiA9IDA7XG4gICAgfVxuICAgIHJldHVybiBtaW4gKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpO1xuICB9O1xuXG4gIC8vIEEgKHBvc3NpYmx5IGZhc3Rlcikgd2F5IHRvIGdldCB0aGUgY3VycmVudCB0aW1lc3RhbXAgYXMgYW4gaW50ZWdlci5cbiAgXy5ub3cgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuXG4gIC8vIExpc3Qgb2YgSFRNTCBlbnRpdGllcyBmb3IgZXNjYXBpbmcuXG4gIHZhciBlbnRpdHlNYXAgPSB7XG4gICAgZXNjYXBlOiB7XG4gICAgICAnJic6ICcmYW1wOycsXG4gICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICc+JzogJyZndDsnLFxuICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICBcIidcIjogJyYjeDI3OydcbiAgICB9XG4gIH07XG4gIGVudGl0eU1hcC51bmVzY2FwZSA9IF8uaW52ZXJ0KGVudGl0eU1hcC5lc2NhcGUpO1xuXG4gIC8vIFJlZ2V4ZXMgY29udGFpbmluZyB0aGUga2V5cyBhbmQgdmFsdWVzIGxpc3RlZCBpbW1lZGlhdGVseSBhYm92ZS5cbiAgdmFyIGVudGl0eVJlZ2V4ZXMgPSB7XG4gICAgZXNjYXBlOiAgIG5ldyBSZWdFeHAoJ1snICsgXy5rZXlzKGVudGl0eU1hcC5lc2NhcGUpLmpvaW4oJycpICsgJ10nLCAnZycpLFxuICAgIHVuZXNjYXBlOiBuZXcgUmVnRXhwKCcoJyArIF8ua2V5cyhlbnRpdHlNYXAudW5lc2NhcGUpLmpvaW4oJ3wnKSArICcpJywgJ2cnKVxuICB9O1xuXG4gIC8vIEZ1bmN0aW9ucyBmb3IgZXNjYXBpbmcgYW5kIHVuZXNjYXBpbmcgc3RyaW5ncyB0by9mcm9tIEhUTUwgaW50ZXJwb2xhdGlvbi5cbiAgXy5lYWNoKFsnZXNjYXBlJywgJ3VuZXNjYXBlJ10sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIF9bbWV0aG9kXSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgaWYgKHN0cmluZyA9PSBudWxsKSByZXR1cm4gJyc7XG4gICAgICByZXR1cm4gKCcnICsgc3RyaW5nKS5yZXBsYWNlKGVudGl0eVJlZ2V4ZXNbbWV0aG9kXSwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIGVudGl0eU1hcFttZXRob2RdW21hdGNoXTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIElmIHRoZSB2YWx1ZSBvZiB0aGUgbmFtZWQgYHByb3BlcnR5YCBpcyBhIGZ1bmN0aW9uIHRoZW4gaW52b2tlIGl0IHdpdGggdGhlXG4gIC8vIGBvYmplY3RgIGFzIGNvbnRleHQ7IG90aGVyd2lzZSwgcmV0dXJuIGl0LlxuICBfLnJlc3VsdCA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgdmFyIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlLmNhbGwob2JqZWN0KSA6IHZhbHVlO1xuICB9O1xuXG4gIC8vIEFkZCB5b3VyIG93biBjdXN0b20gZnVuY3Rpb25zIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5taXhpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goXy5mdW5jdGlvbnMob2JqKSwgZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBfW25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbdGhpcy5fd3JhcHBlZF07XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdCc6ICAgICAndCcsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdHxcXHUyMDI4fFxcdTIwMjkvZztcblxuICAvLyBKYXZhU2NyaXB0IG1pY3JvLXRlbXBsYXRpbmcsIHNpbWlsYXIgdG8gSm9obiBSZXNpZydzIGltcGxlbWVudGF0aW9uLlxuICAvLyBVbmRlcnNjb3JlIHRlbXBsYXRpbmcgaGFuZGxlcyBhcmJpdHJhcnkgZGVsaW1pdGVycywgcHJlc2VydmVzIHdoaXRlc3BhY2UsXG4gIC8vIGFuZCBjb3JyZWN0bHkgZXNjYXBlcyBxdW90ZXMgd2l0aGluIGludGVycG9sYXRlZCBjb2RlLlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgZGF0YSwgc2V0dGluZ3MpIHtcbiAgICB2YXIgcmVuZGVyO1xuICAgIHNldHRpbmdzID0gXy5kZWZhdWx0cyh7fSwgc2V0dGluZ3MsIF8udGVtcGxhdGVTZXR0aW5ncyk7XG5cbiAgICAvLyBDb21iaW5lIGRlbGltaXRlcnMgaW50byBvbmUgcmVndWxhciBleHByZXNzaW9uIHZpYSBhbHRlcm5hdGlvbi5cbiAgICB2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgICAgIC5yZXBsYWNlKGVzY2FwZXIsIGZ1bmN0aW9uKG1hdGNoKSB7IHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTsgfSk7XG5cbiAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChldmFsdWF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGUgKyBcIlxcbl9fcCs9J1wiO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIC8vIElmIGEgdmFyaWFibGUgaXMgbm90IHNwZWNpZmllZCwgcGxhY2UgZGF0YSB2YWx1ZXMgaW4gbG9jYWwgc2NvcGUuXG4gICAgaWYgKCFzZXR0aW5ncy52YXJpYWJsZSkgc291cmNlID0gJ3dpdGgob2JqfHx7fSl7XFxuJyArIHNvdXJjZSArICd9XFxuJztcblxuICAgIHNvdXJjZSA9IFwidmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLFwiICtcbiAgICAgIFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG4gICAgICBzb3VyY2UgKyBcInJldHVybiBfX3A7XFxuXCI7XG5cbiAgICB0cnkge1xuICAgICAgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIGlmIChkYXRhKSByZXR1cm4gcmVuZGVyKGRhdGEsIF8pO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgZnVuY3Rpb24gc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonKSArICcpe1xcbicgKyBzb3VyY2UgKyAnfSc7XG5cbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH07XG5cbiAgLy8gQWRkIGEgXCJjaGFpblwiIGZ1bmN0aW9uLCB3aGljaCB3aWxsIGRlbGVnYXRlIHRvIHRoZSB3cmFwcGVyLlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8ob2JqKS5jaGFpbigpO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdGhpcy5fY2hhaW4gPyBfKG9iaikuY2hhaW4oKSA6IG9iajtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ3BvcCcsICdwdXNoJywgJ3JldmVyc2UnLCAnc2hpZnQnLCAnc29ydCcsICdzcGxpY2UnLCAndW5zaGlmdCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzLl93cmFwcGVkO1xuICAgICAgbWV0aG9kLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgIGlmICgobmFtZSA9PSAnc2hpZnQnIHx8IG5hbWUgPT0gJ3NwbGljZScpICYmIG9iai5sZW5ndGggPT09IDApIGRlbGV0ZSBvYmpbMF07XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgb2JqKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBBZGQgYWxsIGFjY2Vzc29yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG1ldGhvZC5hcHBseSh0aGlzLl93cmFwcGVkLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9KTtcblxuICBfLmV4dGVuZChfLnByb3RvdHlwZSwge1xuXG4gICAgLy8gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICAgIGNoYWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2NoYWluID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBFeHRyYWN0cyB0aGUgcmVzdWx0IGZyb20gYSB3cmFwcGVkIGFuZCBjaGFpbmVkIG9iamVjdC5cbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fd3JhcHBlZDtcbiAgICB9XG5cbiAgfSk7XG5cbiAgLy8gQU1EIHJlZ2lzdHJhdGlvbiBoYXBwZW5zIGF0IHRoZSBlbmQgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBBTUQgbG9hZGVyc1xuICAvLyB0aGF0IG1heSBub3QgZW5mb3JjZSBuZXh0LXR1cm4gc2VtYW50aWNzIG9uIG1vZHVsZXMuIEV2ZW4gdGhvdWdoIGdlbmVyYWxcbiAgLy8gcHJhY3RpY2UgZm9yIEFNRCByZWdpc3RyYXRpb24gaXMgdG8gYmUgYW5vbnltb3VzLCB1bmRlcnNjb3JlIHJlZ2lzdGVyc1xuICAvLyBhcyBhIG5hbWVkIG1vZHVsZSBiZWNhdXNlLCBsaWtlIGpRdWVyeSwgaXQgaXMgYSBiYXNlIGxpYnJhcnkgdGhhdCBpc1xuICAvLyBwb3B1bGFyIGVub3VnaCB0byBiZSBidW5kbGVkIGluIGEgdGhpcmQgcGFydHkgbGliLCBidXQgbm90IGJlIHBhcnQgb2ZcbiAgLy8gYW4gQU1EIGxvYWQgcmVxdWVzdC4gVGhvc2UgY2FzZXMgY291bGQgZ2VuZXJhdGUgYW4gZXJyb3Igd2hlbiBhblxuICAvLyBhbm9ueW1vdXMgZGVmaW5lKCkgaXMgY2FsbGVkIG91dHNpZGUgb2YgYSBsb2FkZXIgcmVxdWVzdC5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgndW5kZXJzY29yZScsIFtdLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBfO1xuICAgIH0pO1xuICB9XG59KS5jYWxsKHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHM9e1xuICBcIm5hbWVcIjogXCJjYXJ0b1wiLFxuICBcInZlcnNpb25cIjogXCIwLjE0LjBcIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIk1hcG5payBTdHlsZXNoZWV0IENvbXBpbGVyXCIsXG4gIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL21hcGJveC9jYXJ0b1wiLFxuICBcInJlcG9zaXRvcnlcIjoge1xuICAgIFwidHlwZVwiOiBcImdpdFwiLFxuICAgIFwidXJsXCI6IFwiaHR0cDovL2dpdGh1Yi5jb20vbWFwYm94L2NhcnRvLmdpdFwiXG4gIH0sXG4gIFwiYXV0aG9yXCI6IHtcbiAgICBcIm5hbWVcIjogXCJNYXBib3hcIixcbiAgICBcInVybFwiOiBcImh0dHA6Ly9tYXBib3guY29tL1wiLFxuICAgIFwiZW1haWxcIjogXCJpbmZvQG1hcGJveC5jb21cIlxuICB9LFxuICBcImtleXdvcmRzXCI6IFtcbiAgICBcIm1hcG5pa1wiLFxuICAgIFwibWFwc1wiLFxuICAgIFwiY3NzXCIsXG4gICAgXCJzdHlsZXNoZWV0c1wiXG4gIF0sXG4gIFwiY29udHJpYnV0b3JzXCI6IFtcbiAgICBcIlRvbSBNYWNXcmlnaHQgPG1hY3dyaWdodEBnbWFpbC5jb20+XCIsXG4gICAgXCJLb25zdGFudGluIEvDpGZlclwiLFxuICAgIFwiQWxleGlzIFNlbGxpZXIgPHNlbGZAY2xvdWRoZWFkLm5ldD5cIlxuICBdLFxuICBcImxpY2Vuc2VzXCI6IFtcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJBcGFjaGVcIlxuICAgIH1cbiAgXSxcbiAgXCJiaW5cIjoge1xuICAgIFwiY2FydG9cIjogXCIuL2Jpbi9jYXJ0b1wiXG4gIH0sXG4gIFwibWFuXCI6IFwiLi9tYW4vY2FydG8uMVwiLFxuICBcIm1haW5cIjogXCIuL2xpYi9jYXJ0by9pbmRleFwiLFxuICBcImVuZ2luZXNcIjoge1xuICAgIFwibm9kZVwiOiBcIj49MC40LnhcIlxuICB9LFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJ1bmRlcnNjb3JlXCI6IFwifjEuNi4wXCIsXG4gICAgXCJtYXBuaWstcmVmZXJlbmNlXCI6IFwifjYuMC4yXCIsXG4gICAgXCJvcHRpbWlzdFwiOiBcIn4wLjYuMFwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIm1vY2hhXCI6IFwiMS4xMi54XCIsXG4gICAgXCJqc2hpbnRcIjogXCIwLjIueFwiLFxuICAgIFwic2F4XCI6IFwiMC4xLnhcIixcbiAgICBcImlzdGFuYnVsXCI6IFwifjAuMi4xNFwiLFxuICAgIFwiY292ZXJhbGxzXCI6IFwifjIuMTAuMVwiLFxuICAgIFwiYnJvd3NlcmlmeVwiOiBcIn43LjAuMFwiXG4gIH0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJwcmV0ZXN0XCI6IFwibnBtIGluc3RhbGxcIixcbiAgICBcInRlc3RcIjogXCJtb2NoYSAtUiBzcGVjXCIsXG4gICAgXCJjb3ZlcmFnZVwiOiBcImlzdGFuYnVsIGNvdmVyIC4vbm9kZV9tb2R1bGVzLy5iaW4vX21vY2hhICYmIGNvdmVyYWxscyA8IC4vY292ZXJhZ2UvbGNvdi5pbmZvXCJcbiAgfVxufVxuIl19
