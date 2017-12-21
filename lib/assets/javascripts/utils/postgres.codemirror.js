/*
 * Postgres Model for codemirror based on:
 *  MySQL Mode for CodeMirror 2 by MySQL-Tools
 *    @author James Thorne (partydroid)
 *    @link   http://github.com/partydroid/MySQL-Tools
 *    @link   http://mysqltools.org
 *    @version 02/Jan/2012
*/
CodeMirror.defineMode("postgres", function(config) {
  var indentUnit = config.indentUnit;
  var curPunc;

  function wordRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }
  var ops = wordRegexp(["str", "lang", "langmatches", "datatype", "bound", "sameterm", "isiri", "isuri",
                        "isblank", "isliteral", "union", "a"]);
  var keywords = wordRegexp([
    ('ABS'),('ACCESSIBLE'),('ADD'),('ALL'),('ALTER'),('ANALYZE'),('AND'),('ANY'),('ARRAY'),('ARRAY_AGG'),('ARRAY_MAX_CARDINALITY'),('AS'),('ASC'),('ASENSITIVE'),('AT'),('AVG'),('BEFORE'),('BEGIN'),
    ('BETWEEN'),('BIGINT'),('BINARY'),('BLOB'),('BOOLEAN'),('BOTH'),('BY'),('CALL'),('CASCADE'),('CASE'),('CAST'),('CEIL'),('CEILING'),('CHANGE'),('CHAR'),('CHARACTER'),('CHARACTER_LENGTH'),
    ('CHAR_LENGTH'),('CHECK'),('CLOB'),('CLOSE'),('COLLATE'),('COLLECT'),('COLUMN'),('COLUMNS'),('CONDITION'),('CONSTRAINT'),('CONTAINS'),('CONTINUE'),('CONVERT'),('CORR'),('COUNT'),('CREATE'),
    ('CROSS'),('CUBE'),('CURRENT_DATE'),('CURRENT_TIME'),('CURRENT_TIMESTAMP'),('CURRENT_USER'),('CURSOR'),('CYCLE'),('DATABASE'),('DATABASES'),('DATE'),('DAY'),('DAY_HOUR'),('DAY_MICROSECOND'),
    ('DAY_MINUTE'),('DAY_SECOND'),('DEC'),('DECIMAL'),('DECLARE'),('DEFAULT'),('DELAYED'),('DELETE'),('DESC'),('DESCRIBE'),('DETERMINISTIC'),('DISTINCT'),('DISTINCTROW'),('DIV'),('DOUBLE'),('DROP'),
    ('DUAL'),('EACH'),('ELEMENT'),('ELSE'),('ELSEIF'),('ENCLOSED'),('END'),('EQUALS'),('ESCAPE'),('ESCAPED'),('EVERY'),('EXCEPT'),('EXEC'),('EXISTS'),('EXIT'),('EXP'),('EXPLAIN'),('EXTRACT'),
    ('FALSE'),('FETCH'),('FILTER'),('FLOAT'),('FLOAT4'),('FLOAT8'),('FLOOR'),('FOR'),('FORCE'),('FOREIGN'),('FROM'),('FULL'),('FULLTEXT'),('GRANT'),('GROUP'),('GROUPS'),('HAVING'),('HIGH_PRIORITY'),
    ('HOLD'),('HOUR'),('HOUR_MICROSECOND'),('HOUR_MINUTE'),('HOUR_SECOND'),('IDENTITY'),('IF'),('IGNORE'),('ILIKE'),('IN'),('INDEX'),('INFILE'),('INNER'),('INOUT'),('INSENSITIVE'),('INSERT'),('INT'),
    ('INT1'),('INT2'),('INT3'),('INT4'),('INT8'),('INTEGER'),('INTERSECT'),('INTERSECTION'),('INTERVAL'),('INTO'),('IS'),('ITERATE'),('JOIN'),('KEY'),('KEYS'),('KILL'),('LAG'),('LARGE'),('LEADING'),
    ('LEAVE'),('LEFT'),('LIKE'),('LIKE_REGEX'),('LIMIT'),('LINEAR'),('LINES'),('LN'),('LOAD'),('LOCALTIME'),('LOCALTIMESTAMP'),('LOCK'),('LONG'),('LONGBLOB'),('LONGTEXT'),('LOOP'),('LOWER'),
    ('LOW_PRIORITY'),('MASTER_SSL_VERIFY_SERVER_CERT'),('MATCH'),('MAX'),('MEDIUMBLOB'),('MEDIUMINT'),('MEDIUMTEXT'),('MIDDLEINT'),('MIN'),('MINUTE'),('MINUTE_MICROSECOND'),('MINUTE_SECOND'),('MOD'),
    ('MODIFIES'),('MODULE'),('MONTH'),('MULTISET'),('NATURAL'),('NO'),('NONE'),('NORMALIZE'),('NOT'),('NO_WRITE_TO_BINLOG'),('NULL'),('NULLIF'),('NUMERIC'),('OF'),('OFFSET'),('OLD'),('ON'),('ONLY'),
    ('OPEN'),('OPTIMIZE'),('OPTION'),('OPTIONALLY'),('OR'),('ORDER'),('OUT'),('OUTER'),('OUTFILE'),('OVER'),('OVERLAY'),('PARAMETER'),('PERCENT'),('PERIOD'),('POSITION'),('POWER'),('PRECISION'),
    ('PRIMARY'),('PROCEDURE'),('PURGE'),('RANGE'),('READ'),('READS'),('READ_WRITE'),('REAL'),('REFERENCES'),('REGEXP'),('RELEASE'),('RENAME'),('REPEAT'),('REPLACE'),('REQUIRE'),('RESTRICT'),
    ('RESULT'),('RETURN'),('REVOKE'),('RIGHT'),('RLIKE'),('ROWS'),('SCHEMA'),('SCHEMAS'),('SECOND_MICROSECOND'),('SELECT'),('SENSITIVE'),('SEPARATOR'),('SET'),('SHOW'),('SIMILAR'),('SMALLINT'),
    ('SOME'),('SPATIAL'),('SPECIFIC'),('SQL'),('SQLEXCEPTION'),('SQLSTATE'),('SQLWARNING'),('SQL_BIG_RESULT'),('SQL_CALC_FOUND_ROWS'),('SQL_SMALL_RESULT'),('SQRT'),('SSL'),('STARTING'),('STDEV'),
    ('STRAIGHT_JOIN'),('SUBSTRING'),('SUM'),('TABLE'),('TERMINATED'),('THEN'),('TIME'),('TIMESTAMP'),('TINYBLOB'),('TINYINT'),('TINYTEXT'),('TO'),('TRAILING'),('TRIGGER'),('TRIM'),('TRIM_ARRAY'),
    ('TRUE'),('TRUNCATE'),('UNDO'),('UNION'),('UNIQUE'),('UNKNOWN'),('UNLOCK'),('UNSIGNED'),('UPDATE'),('UPPER'),('USAGE'),('USE'),('USING'),('UTC_DATE'),('UTC_TIME'),('UTC_TIMESTAMP'),('VALUE'),
    ('VALUES'),('VALUE_OF'),('VARBINARY'),('VARCHAR'),('VARCHARACTER'),('VARYING'),('WHEN'),('WHENEVER'),('WHERE'),('WHILE'),('WITH'),('WITHIN'),('WITHOUT'),('WRITE'),('XOR'),('YEAR_MONTH'),('ZEROFILL')
  ]);
  var operatorChars = /[*+\-<>=&|]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    curPunc = null;
    if (ch == "$" || ch == "?") {
      stream.match(/^[\w\d]*/);
      return "variable-2";
    }
    else if (ch == "<" && !stream.match(/^[\s\u00a0=]/, false)) {
      stream.match(/^[^\s\u00a0>]*>?/);
      return "atom";
    }
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenLiteral(ch);
      return state.tokenize(stream, state);
    }
    else if (ch == "`") {
      state.tokenize = tokenOpLiteral(ch);
      return state.tokenize(stream, state);
    }
    else if (/[{}\(\),\.;\[\]]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    else if (ch == "-") {
      var ch2 = stream.next();
      if (ch2=="-") {
        stream.skipToEnd();
        return "comment";
      }
    }
    else if (operatorChars.test(ch)) {
      stream.eatWhile(operatorChars);
      return null;
    }
    else if (ch == ":") {
      stream.eatWhile(/[\w\d\._\-]/);
      return "atom";
    }
    else {
      stream.eatWhile(/[_\w\d]/);
      if (stream.eat(":")) {
        stream.eatWhile(/[\w\d_\-]/);
        return "atom";
      }
      var word = stream.current(), type;
      if (ops.test(word))
        return null;
      else if (keywords.test(word))
        return "keyword";
      else
        return "variable";
    }
  }

  function tokenLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "string";
    };
  }

  function tokenOpLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "variable-2";
    };
  }


  function pushContext(state, type, col) {
    state.context = {prev: state.context, indent: state.indent, col: col, type: type};
  }
  function popContext(state) {
    state.indent = state.context.indent;
    state.context = state.context.prev;
  }

  return {
    startState: function(base) {
      return {tokenize: tokenBase,
              context: null,
              indent: 0,
              col: 0};
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (state.context && state.context.align == null) state.context.align = false;
        state.indent = stream.indentation();
      }
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      if (style != "comment" && state.context && state.context.align == null && state.context.type != "pattern") {
        state.context.align = true;
      }

      if (curPunc == "(") pushContext(state, ")", stream.column());
      else if (curPunc == "[") pushContext(state, "]", stream.column());
      else if (curPunc == "{") pushContext(state, "}", stream.column());
      else if (/[\]\}\)]/.test(curPunc)) {
        while (state.context && state.context.type == "pattern") popContext(state);
        if (state.context && curPunc == state.context.type) popContext(state);
      }
      else if (curPunc == "." && state.context && state.context.type == "pattern") popContext(state);
      else if (/atom|string|variable/.test(style) && state.context) {
        if (/[\}\]]/.test(state.context.type))
          pushContext(state, "pattern", stream.column());
        else if (state.context.type == "pattern" && !state.context.align) {
          state.context.align = true;
          state.context.col = stream.column();
        }
      }

      return style;
    },

    indent: function(state, textAfter) {
      var firstChar = textAfter && textAfter.charAt(0);
      var context = state.context;
      if (/[\]\}]/.test(firstChar))
        while (context && context.type == "pattern") context = context.prev;

      var closing = context && firstChar == context.type;
      if (!context)
        return 0;
      else if (context.type == "pattern")
        return context.col;
      else if (context.align)
        return context.col + (closing ? 0 : 1);
      else
        return context.indent + (closing ? 0 : indentUnit);
    }
  };
});

CodeMirror.defineMIME("text/x-postgres", "postgres");
