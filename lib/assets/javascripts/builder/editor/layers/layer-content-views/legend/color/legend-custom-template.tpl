<ul>
  <% for(var i in items) { %>
    <li class="Legend-categoryListItem u-flex u-alignCenter">
      <% if (items[i].icon) { %>
        <span class="Legend-categoryIcon js-image-container" data-icon="<%= items[i].icon %>" <% if (items[i].color) { %>data-color="<%= items[i].color %>"<% } %>></span>
      <% } else if (items[i].color) { %>
        <span class="Legend-categoryCircle" style="opacity:1; background: <%= items[i].color %>;"></span>
      <% } %>

      <p class="Legend-categoryTitle CDB-Text CDB-Size-small u-upperCase u-ellipsis" title="<%= items[i].title %>"><%= items[i].title %></p>
    </li>
  <% } %>
</ul>
