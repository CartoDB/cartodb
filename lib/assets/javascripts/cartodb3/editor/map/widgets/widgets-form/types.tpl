<select>
  <% _.each(types, function(type) { %>
  <option value="<%- type.value %>"><%- type.label %></option>
  <% }); %>
</select>
