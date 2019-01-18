<% _.each(items, function(item, index) { %>
  <% if (item.selected) { %>
    <li class="u-tSpace">
      <input type="radio" class="Editor-toggleRadio" name="<%= item.name %>" value="<%- item.value %>" id="<%= item.id %>" checked="checked" />
      <% if (item.help) { %><p class="Editor-toggleHelp CDB-Text CDB-Size-small u-altTextColor"><%= item.help %></p><% } %>
    </li>
  <% } else { %>
    <li class="u-tSpace u-txt-right">
      <input type="radio" name="<%= item.name %>" value="<%- item.value %>" id="<%= item.id %>" />
      <label class="u-upperCase u-actionTextColor CDB-Text is-semibold CDB-Size-small u-iBlock" for="<%= item.id %>"><% if (item.labelHTML){ %><%= item.labelHTML %><% }else{ %><%- item.label %><% } %></label>
    </li>
  <% } %>
<% }); %>
