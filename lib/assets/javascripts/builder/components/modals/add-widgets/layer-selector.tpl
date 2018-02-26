<% layerNames.forEach(function (name, i) { %>
  <option value="<%- i %>" <% if (i === layerIndex) { %>selected="selected"<% } %>>
    <%- name %>
  </option>
<% }) %>
