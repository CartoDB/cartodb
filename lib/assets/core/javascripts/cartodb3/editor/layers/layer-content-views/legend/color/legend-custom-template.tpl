<ul>
  <% for(var i in items) { %>
    <li class="Legend-categoryListItem u-flex u-justifySpace u-alignCenter">
      <p class="Legend-categoryTitle CDB-Text CDB-Size-small u-upperCase u-ellipsis" title="<%= items[i].title %>"><%= items[i].title %></p>
      <% if (items[i].color) { %>
        <span class="Legend-categoryCircle" style="opacity:1; background: <%= items[i].color %>;"></span>
      <% } else if (items[i].icon) { %>
        <span class="Legend-categoryIcon" style="opacity:1; background-image: <%= items[i].icon %>;"></span>
      <% } %>
    </li>
  <% } %>
</ul>
