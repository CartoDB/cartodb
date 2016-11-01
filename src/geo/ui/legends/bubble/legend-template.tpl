<div class="Bubble-container u-flex u-justifySpace">
  <ul class="Bubble-numbers u-flex u-justifySpace">
    <% for (var i = 0; i<labels.length; i++) { %>
      <li class="Bubble-numbersItem CDB-Text CDB-Size-small" style="bottom: <%- labelPositions[i] %>%"><%= formatter.formatNumber(labels[i]) %></li>
    <% } %>
  </ul>

  <div class="Bubble-inner">
    <ul class="Bubble-list">
      <% for (var i in bubbleSizes) { %>
        <li class="js-bubbleItem Bubble-item Bubble-item—-<%- i+1 %>" style="height: <%- bubbleSizes[i] %>%; width: <%- bubbleSizes[i] %>%">
          <span class="Bubble-itemCircle" style=" <%- fillColor ? 'background-color:' + fillColor + ';': ''%>" ></span>
        </li>
      <% } %>
    </ul>
    <p class="Bubble-average CDB-Text CDB-Size-small u-altTextColor" style="bottom: <%- avgSize %>%">AVG: <%= formatter.formatNumber(avgLabel) %></p>
  </div>
</div>
