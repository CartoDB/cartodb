<input
  class="js-slider"
  type="range"
  min="<%- min %>"
  max="<%- max %>"
  data-orientation="<%- orientation %>"
  <% if (disabled) { %>
    disabled="true"
  <% } %>
  value="<%- value %>"
>
<div class="rangeslider-ticks js-ticks"></div>
<div class="rangeslider-label CDB-Text CDB-Size-medium js-label"></div>
