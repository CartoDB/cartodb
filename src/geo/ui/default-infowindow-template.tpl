<div class="CDB-infowindow CDB-infowindow--light js-infowindow">
  <div class="CDB-infowindow-container">
    <% if (typeof loading !== 'undefined' && loading) { %>
      <div class="CDB-Loader js-loader is-visible"></div>
    <% } %>
    <div class="CDB-infowindow-bg">
      <div class="CDB-infowindow-inner">
        <ul class="CDB-infowindow-list js-content">
          <% if (content.fields) { %>
            <% _.each(content.fields, function (field) { %>
              <li class="CDB-infowindow-listItem">
                <% if (field.title) { %><h5 class="CDB-infowindow-subtitle"><%- field.title %></h5><% } %>
                <% if (field.value) { %><h4 class="CDB-infowindow-title"><%- field.value %></h4><% } %>
                <% if (!field.title) { %><h4 class="CDB-infowindow-title">null</h4><% } %>
              </li>
              <% }) %>
          <% } %>
        </ul>
      </div>
    </div>
    <div class="CDB-hook">
      <div class="CDB-hook-inner"></div>
    </div>
  </div>
</div>