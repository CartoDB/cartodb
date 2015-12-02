<div class="CDB-Widget-header CDB-Widget-header--timeSeries">
  <% if (hasTorqueLayer) { %>
    <div class="CDB-Widget-timeSeriesFakeControl"></div>
    <div class="CDB-Widget-timeSeriesTimeInfo CDB-Widget-timeSeriesTimeInfo--fake"></div>
  <% } %>
</div>
<div class="CDB-Widget-content CDB-Widget-content--timeSeries">
  <div class="CDB-Widget-timeSeriesFakeChart <% if (hasTorqueLayer) { %>CDB-Widget-timeSeriesFakeChart--torque<% } %>">
    <% for (var i = 0; i < 50; i++) { %>
      <div class="CDB-Widget-timeSeriesFakeChartItem" style="height: <%- Math.floor(Math.random() * 100) %>%"></div>
    <% } %>
  </div>
</div>
