<input type="checkbox" class="js-checkbox" style="-webkit-appearance: checkbox"
  <% if (isSelected) { %>checked="checked"<% } %> />
<h3 class="DefaultTitle"><%- title %></h3>
<select class="js-layers">
  <% layerNames.forEach(function (name, i) { %>
    <option value="<%- i %>" <% if (i === layerIndex) { %>selected="selected"<% } %>>
      <%- name %>
    </option>
  <% }) %>
</select>
