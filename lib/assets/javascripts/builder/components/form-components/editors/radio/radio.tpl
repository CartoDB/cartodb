<% _.each(items, function(item, index) { %>
  <li class="u-flex u-alignCenter <%- (index === (items.length - 1)) ? '' : 'u-rSpace--xl' %>">
    <input type="radio" class="CDB-Radio u-iBlock<% if (item.className) { %> <%- item.className %> <% } %>"
    name="<%- item.name %>" value="<%- item.value %>" id="<%- item.id %>-<%- index %>"
        <% if (item.selected) { %>
          checked="checked"
        <% } else if (item.disabled) { %>
          disabled="disabled"
        <% } %>
      />
    <span class="u-rSpace CDB-Radio-face"></span>
      <% if (item.help) { %>
        <span class="js-help is-underlined u-lSpace" data-tooltip="<%- item.help %>">
      <% } %>
      <label for="<%- item.id %>-<%- index %>"><%- item.label %></label>
      <% if (item.help) { %>
        </span>
      <% } %>
  </li>
<% }); %>
