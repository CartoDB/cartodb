<button type="button" class="CDB-ListDecoration-itemLink u-ellipsis
  <% if (isSelected) { %> is-selected <% } %>
  <% if (isDestructive) { %>
  u-errorTextColor
  <% } else if (isDisabled) { %>
  u-hintTextColor
  <% } else { %>
  u-actionTextColor
  <% } %>
  " title="<%- name %>">

  <div class="u-iBlock u-rSpace">
    <input class="CDB-Checkbox js-input" type="checkbox" name="" value="" <% if (isSelected) { %>checked<% } %> <% if (isDisabled) { %>disabled<% } %> />
    <span class="u-iBlock CDB-Checkbox-face"></span>
  </div>
  <%- name %>
</button>
