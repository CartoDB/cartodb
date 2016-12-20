<div class="StatsList-item">
  <div class="u-rSpace--m">
    <input class="CDB-Checkbox js-checkbox" type="checkbox" <% if (isSelected) { %>checked="checked"<% } %> />
    <span class="u-iBlock CDB-Checkbox-face"></span>
  </div>

  <div class="WidgetList-inner js-inner">
    <div class="StatsList-header u-flex u-justifySpace u-alignCenter u-bSpace--m">
      <h3 class="u-ellipsis CDB-Text CDB-Size-medium"><%- _t('editor.data.stats.add-widget') %></h3>
      <% if (isSelected) { %>
      <button class="StatsList-style CDB-Text CDB-Size-small js-style u-actionTextColor">
        <div class="StatsList-arrow CDB-Shape-Arrow is-blue u-iBlock  u-rSpace--m"></div> <%- _t('editor.data.stats.edit') %>
      </button>
      <% } %>
    </div>
    <div class="u-flex u-alignCenter u-bSpace">
      <h2 class="js-title u-ellipsis CDB-Text CDB-Size-large u-rSpace--m"><%- column %></h2>
      <div class="StatsList-tag Tag Tag--outline Tag-outline--grey CDB-Text CDB-Size-small u-upperCase"><%- type %></div>
    </div>
    <div class="js-stat"></div>
  </div>
</div>
