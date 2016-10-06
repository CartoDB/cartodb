<% _.each(items, function(item, index) { %>
  <li class="u-flex u-alignCenter <%- (index === (items.length - 1)) ? '' : 'u-rSpace--xl' %>">
    <input type="radio" class="CDB-Radio u-iBlock"
        name="<%- item.name %>" value="<%- item.value %>" id="<%- item.id %>"
        <% if (item.selected) { %>
          selected="selected"
        <% } else if (item.disabled) { %>
          disabled="disabled"
        <% } %>
      />
    <span class="u-rSpace CDB-Radio-face"></span>
      <% if (item.help) { %>
        <span class="js-help is-underlined u-lSpace" data-tooltip="<%- item.help %>">
      <% } %>
      <%- item.label %>
      <% if (item.help) { %>
        </span>
      <% } %>
  </li>
<% }); %>
