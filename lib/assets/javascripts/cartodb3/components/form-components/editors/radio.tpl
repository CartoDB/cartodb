<% _.each(items, function(item, index) { %>
  <li class="u-iBlock <%- (index === (items.length - 1)) ? '' : 'u-rSpace--xl' %>">
    <input type="radio" class="CDB-Radio u-iBlock"
        name="<%- item.name %>" value="<%- item.value %>" id="<%- item.id %>"
        <% if (item.selected) { %>
          selected="selected"
        <% } else if (disabled) { %>
          disabled="disabled"
        <% } %>
      />
    <span class="u-iBlock CDB-Radio-face"></span>
    <label class="u-iBlock u-lSpace" for="<%- item.id %>"><%- item.label %></label>
  </li>
<% }); %>
