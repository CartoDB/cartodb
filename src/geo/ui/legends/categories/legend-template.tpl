<% if (categories && categories.length > 0) { %>
  <ul>
    <% for(var i in categories) { %>
      <li class="Legend-categoryListItem u-flex u-alignCenter">
        <span class="Legend-categoryCircle" style="opacity:1; background: <%= categories[i].value %>;"></span>
        <p class="Legend-categoryTitle CDB-Text CDB-Size-small u-upperCase u-ellipsis" title="<%= categories[i].label %>"><%= categories[i].label %></p>
      </li>
    <% } %>
  </ul>
<% }%>
