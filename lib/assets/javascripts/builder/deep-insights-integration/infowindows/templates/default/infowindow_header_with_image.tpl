<div class="CDB-infowindow CDB-infowindow--light js-infowindow" data-cover="true">
  <div class="CDB-infowindow-close js-close"></div>
  <section class="CDB-infowindow-container">
    <header class="CDB-infowindow-header CDB-infowindow-headerMedia js-header js-cover">
      <% if (content.fields.length) { %>
        <div class="CDB-infowindow-mediaTitle">
          <% if (content.fields[0].value) { %>
            <h4 class="CDB-infowindow-title">
              <span><%= content.fields[0].value %></span>
            </h4>
          <% } %>
        </div>
      <% } %>
    </header>
  </section>

  <section class="CDB-infowindow-inner js-inner">
    <ul class="CDB-infowindow-list js-content">
      <% _.each(content.fields, function (field, index) { %>
        <% if (index !== 0) { %>
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
        <% } %>
      <% }) %>
    </ul>
  </section>

  <div class="CDB-hook">
    <div class="CDB-hook-inner"></div>
  </div>
</section>
