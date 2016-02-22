<input type="radio" class="js-radio" style="-webkit-appearance: radio"
  <% if (isSelected) { %>checked="checked"<% } %> />
<h3 class="DefaultTitle"><%- columnName %></h3>
<select class="js-layers">
  <% layerNames.forEach(function (name, i) { %>
    <option value="<%- i %>" <% if (i === layerIndex) { %>selected="selected"<% } %>>
      <%- name %>
    </option>
  <% }) %>
</select>
