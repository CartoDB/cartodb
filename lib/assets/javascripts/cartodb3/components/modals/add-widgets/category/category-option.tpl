<div class="WidgetList-option">
  <input class="CDB-Checkbox js-checkbox" type="checkbox" <% if (isSelected) { %>checked="checked"<% } %> />
  <span class="u-iBlock CDB-Checkbox-face"></span>
</div>

<div class="WidgetList-inner js-inner">
  <h3 class="u-ellipsis CDB-Text CDB-Size-large u-bSpace--xl"><%- columnName %></h3>
  <ul id="catstats" class="u-flex CDB-Text CDB-Size-small u-upperCase" style="display: none;">
  	<li class='u-rSpace'></li>
  	<li class='u-rSpace'></li>
  </ul>
  <div class="u-bSpace--xl" id='Category-bar'></div>
</div>
