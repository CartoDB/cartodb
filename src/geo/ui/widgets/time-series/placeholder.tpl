<div class="Widget-header Widget-header--timeSeries">
  <% if (hasTorqueLayer) { %>
    <div class="Widget-timeSeriesFakeControl"></div>
    <div class="Widget-timeSeriesTimeInfo Widget-timeSeriesTimeInfo--fake"></div>
  <% } %>
</div>
<div class="Widget-content Widget-content--timeSeries">
  <div class="Widget-timeSeriesFakeChart">
    <% for (var i = 0; i < 50; i++) { %>
      <div class="Widget-timeSeriesFakeChartItem" style="height: <%- Math.floor(Math.random() * 100) %>%"></div>
    <% } %>
  </div>
</div>
