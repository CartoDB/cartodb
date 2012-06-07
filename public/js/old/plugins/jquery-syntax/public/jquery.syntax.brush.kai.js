// This file is part of the "jQuery.Syntax" project, and is licensed under the GNU AGPLv3.
// Copyright 2010 Samuel Williams. All rights reserved.
// For more information, please see <http://www.oriontransfer.co.nz/software/jquery-syntax>

Syntax.register('kai',function(brush){brush.push(['(',')','[',']','{','}'],{klass:'operator'});brush.push(Syntax.lib.perlStyleComment);brush.push(Syntax.lib.decimalNumber);brush.push(Syntax.lib.webLink);brush.push({pattern:/\(([^\s\(\)]+)/gi,matches:Syntax.extractMatches({klass:'function'})});brush.push({pattern:/`[a-z]*/gi,klass:'constant'})
brush.push(Syntax.lib.multiLineDoubleQuotedString);brush.push(Syntax.lib.stringEscape);});