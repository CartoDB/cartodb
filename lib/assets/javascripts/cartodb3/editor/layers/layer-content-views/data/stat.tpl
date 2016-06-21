<div class="StatsList-item">
  <div class="WidgetList-option">
    <input class="CDB-Checkbox js-checkbox" type="checkbox" <% if (isSelected) { %>checked="checked"<% } %> />
    <span class="u-iBlock CDB-Checkbox-face"></span>
  </div>

  <div class="WidgetList-inner js-inner">
    <div class="StatsList-header">
      <h3 class="u-ellipsis CDB-Text CDB-Size-medium u-bSpace--xl"><%- _t('editor.data.stats.add-widget') %></h3>
      <a class="StatsList-style CDB-Text CDB-Size-small js-style <% if (!isSelected) { %> is-hidden <% } %>" href="#"><div class="StatsList-arrow CDB-Shape-Arrow is-blue u-iBlock  u-rSpace--m"></div> <%- _t('editor.data.stats.style') %></a>
    </div>
    <div class="StatsList-details u-bSpace--xl">
      <h2 class="u-ellipsis CDB-Text CDB-Size-large u-rSpace--m"><%- column %></h2>
      <div class="StatsList-tag CDB-Text CDB-Size-small u-upperCase"><%- type %></div>
    </div>
    <div class="u-bSpace--xl js-stat"></div>
  </div>
</div>
