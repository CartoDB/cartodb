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
  <%- name %>
</button>
