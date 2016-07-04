<button type="button" class="CDB-ListDecoration-itemLink u-ellipsis
    <% if (isSelected) { %> is-selected <% } %>
    <% if (isDestructive) { %>
      u-errorTextColor
    <% } if (isDisabled) { %>
      u-hintTextColor
    <% } else { %>
      u-actionTextColor
    <% } %>
  " title="<%- name %>">
  <%- name %>
</button>
