// This file is part of the "jQuery.Syntax" project, and is licensed under the GNU AGPLv3.
// Copyright 2010 Samuel Williams. All rights reserved.
// For more information, please see <http://www.oriontransfer.co.nz/software/jquery-syntax>

Syntax.layouts.plain=function(options,code,container){var toolbar=jQuery('<div class="toolbar">');var scrollContainer=jQuery('<div class="syntax plain highlighted">');code.removeClass('syntax');scrollContainer.append(code);return jQuery('<div class="syntax-container">').append(toolbar).append(scrollContainer);};