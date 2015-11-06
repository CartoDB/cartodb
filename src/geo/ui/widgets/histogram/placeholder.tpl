<ul class="Widget-chart Widget-chart--fake">
  <% for (var i = 0; i < 15; i++) { %>
  <li class="Widget-chartItem Widget-chartItem--<%- _.sample(['small', 'medium', 'big'], 1)[0] %> Widget-chartItem--fake"></li>
  <% } %>
</ul>
