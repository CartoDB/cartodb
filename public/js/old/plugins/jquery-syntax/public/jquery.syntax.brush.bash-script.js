// This file is part of the "jQuery.Syntax" project, and is licensed under the GNU AGPLv3.
// Copyright 2010 Samuel Williams. All rights reserved.
// For more information, please see <http://www.oriontransfer.co.nz/software/jquery-syntax>

Syntax.register('bash-script',function(brush){var keywords=["break","case","continue","do","done","elif","else","eq","fi","for","function","ge","gt","if","in","le","lt","ne","return","then","until","while"];brush.push(keywords,{klass:'keyword'});var operators=["&","|",">","<","=","`","--"];brush.push(operators,{klass:'operator'});brush.push({pattern:/^\s*((?:\S+=\S+\s+)*)\s*(\S+)\s+((?:.*?)?)$/gmi,matches:Syntax.extractMatches({klass:'env'},{klass:'function'},{klass:'remainder',allow:'*'})});brush.push({pattern:/(?:\||&&)\s+(\S+)/g,matches:Syntax.extractMatches({klass:'function',only:['remainder']})});brush.push({pattern:/\$\w+/g,klass:'variable'})
brush.push({pattern:/\s\-+\w+/g,klass:'option'})
brush.push(Syntax.lib.perlStyleComment);brush.push(jQuery.extend({},Syntax.lib.singleQuotedString,{allow:'*'}));brush.push(jQuery.extend({},Syntax.lib.doubleQuotedString,{allow:'*'}));brush.push(Syntax.lib.webLink);});