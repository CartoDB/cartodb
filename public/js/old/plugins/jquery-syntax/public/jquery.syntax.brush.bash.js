// This file is part of the "jQuery.Syntax" project, and is licensed under the GNU AGPLv3.
// Copyright 2010 Samuel Williams. All rights reserved.
// For more information, please see <http://www.oriontransfer.co.nz/software/jquery-syntax>

Syntax.brushes.dependency('bash','bash-script');Syntax.register('bash',function(brush){brush.push({pattern:/^([\w@:~ ]*?[\$|\#])\s+(.*?)$/gm,matches:Syntax.extractMatches({klass:'prompt'},{brush:'bash-script'})});brush.push({pattern:/^\-\- .*$/gm,klass:'comment',allow:['href']});brush.push(Syntax.lib.singleQuotedString);brush.push(Syntax.lib.doubleQuotedString);brush.push(Syntax.lib.stringEscape);brush.push(Syntax.lib.decimalNumber);brush.push(Syntax.lib.hexNumber);brush.push(Syntax.lib.webLink);});