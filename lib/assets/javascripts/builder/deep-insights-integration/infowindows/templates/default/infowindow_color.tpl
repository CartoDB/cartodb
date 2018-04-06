<section class="CDB-infowindow CDB-infowindow--light js-infowindow">
  <div class="CDB-infowindow-close js-close"></div>
  <section class="CDB-infowindow-container">
    <header class="CDB-infowindow-header CDB-infowindow-headerBg CDB-infowindow-headerBg--light js-header" style="background: <%= headerColor.fixed %>; opacity: <%= headerColor.opacity %>;">
      <% if (content.fields.length) { %>
        <div class="CDB-infowindow-listItem">
          <% if (content.fields[0].title) { %>
            <h5 class="CDB-infowindow-subtitle"><%= content.fields[0].title %></h5>
          <% } %>
          <% if (content.fields[0].value) { %>
            <h4 class="CDB-infowindow-title"><%= content.fields[0].type %> <%= content.fields[0].value %></h4>
          <% } %>
        </div>
      <% } %>
    </header>

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
</section>
