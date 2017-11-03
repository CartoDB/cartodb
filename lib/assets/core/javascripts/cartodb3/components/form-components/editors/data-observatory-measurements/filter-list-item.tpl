<button type="button" class="CDB-ListDecoration-itemLink u-actionTextColor
  <% if (isSelected) { %> is-selected <% } %>
  " title="<%= name %>">
  <div class="u-flex">
    <div class="u-iBlock u-rSpace--m">
      <input class="CDB-Checkbox js-input" type="checkbox" name="" value="" <% if (isSelected) { %>checked<% } %> <% if (isDisabled) { %>disabled<% } %> />
      <span class="u-iBlock CDB-Checkbox-face"></span>
    </div>
    <div>
      <div class="u-bSpace"><%= name %></div>
      <div class="CDB-Size-small u-altTextColor"><%- description %></div>
    </div>
  </div>
</button>
