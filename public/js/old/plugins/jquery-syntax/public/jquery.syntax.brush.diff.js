// This file is part of the "jQuery.Syntax" project, and is licensed under the GNU AGPLv3.
// Copyright 2010 Samuel Williams. All rights reserved.
// For more information, please see <http://www.oriontransfer.co.nz/software/jquery-syntax>

Syntax.register('diff',function(brush){brush.push({pattern:/^\+\+\+.*$/gm,klass:'add'});brush.push({pattern:/^\-\-\-.*$/gm,klass:'del'});brush.push({pattern:/^@@.*@@/gm,klass:'offset'});brush.push({pattern:/^\+[^\+]{1}.*$/gm,klass:'insert'});brush.push({pattern:/^\-[^\-]{1}.*$/gm,klass:'remove'});brush.postprocess=function(options,html,container){$('.insert',html).closest('.source').addClass('insert-line');$('.remove',html).closest('.source').addClass('remove-line');$('.offset',html).closest('.source').addClass('offset-line');return html;};});