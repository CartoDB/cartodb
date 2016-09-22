<div class="Bubble-container u-flex u-justifySpace">
  <ul class="Bubble-numbers">
    <% for (var i in labels) { %>
      <li class="Bubble-numbersItem CDB-Text CDB-Size-small"><%- labels[i] %></li>
    <% } %>
  </ul>

  <div class="Bubble-inner">
    <ul class="Bubble-list">
      <% for (var i in bubbleSizes) { %>
        <li class="js-bubbleItem Bubble-item Bubble-item—-<%- i+1 %>">
          <span class="Bubble-itemCircle" style="background-color: <%= fillColor %>; height: <%- bubbleSizes[i] %>%; width: <%- bubbleSizes[i] %>%"></span>
        </li>
      <% } %>
    </ul>
    <p class="Bubble-average CDB-Text CDB-Size-small u-altTextColor" style="bottom: <%- avgSize %>%">AVG: <%- avgLabel %></p>
  </div>
</div>
