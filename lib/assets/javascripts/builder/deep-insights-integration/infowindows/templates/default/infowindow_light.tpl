<section class="CDB-infowindow CDB-infowindow--light js-infowindow">
  <div class="CDB-infowindow-close js-close"></div>
  <section class="CDB-infowindow-container">
    <div class="CDB-infowindow-bg">
      <div class="CDB-infowindow-inner js-inner">
        <ul class="CDB-infowindow-list js-content">
          <% _.each(content.fields, function (field) { %>
            <li class="CDB-infowindow-listItem">
              <% if (field.title) { %>
                <h5 class="CDB-infowindow-subtitle"><%= field.title %></h5>
              <% } %>
              <% if (field.value) { %>
                <h4 class="CDB-infowindow-title"><%= field.value %></h4>
              <% } else { %>
                <h4 class="CDB-infowindow-title">null</h4>
              <% } %>
            </li>
          <% }) %>
        </ul>
      </div>
    </div>
    <div class="CDB-hook">
      <div class="CDB-hook-inner"></div>
    </div>
  </section>
</section>
