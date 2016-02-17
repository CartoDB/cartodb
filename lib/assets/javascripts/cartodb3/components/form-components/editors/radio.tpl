<% _.each(items, function(item) { %>
  <li class="u-iBlock u-rSpace--xl">
    <input type="radio" class="CDB-Radio u-iBlock" name="<%- item.name %>" value="<%- item.value %>" id="<%- item.id %>" />
    <span class="u-iBlock CDB-Radio-face"></span>
    <label class="u-iBlock u-lSpace" for="<%- item.id %>"><%- item.label %></label>
  </li>
<% }); %>
