<div class="Bubble-container u-flex u-justifySpace">
  <ul class="Bubble-numbers u-flex u-justifySpace">
    <% if (hasCustomLabels) { %>
      <li class="Bubble-numbersItem CDB-Text CDB-Size-small" style="bottom: 0%"><%- labels[0] %></li>
      <li class="Bubble-numbersItem CDB-Text CDB-Size-small" style="bottom: 100%"><%- labels[1] %></li>
    <% } else { %>
      <% for (var i = 0; i<labels.length; i++) { %>
        <li class="Bubble-numbersItem CDB-Text CDB-Size-small" style="bottom: <%- labelPositions[i] %>%"><%= formatter.formatNumber(labels[i]) %></li>
      <% } %>
    <% } %>
  </ul>

  <div class="Bubble-inner">
    <ul class="Bubble-list <% if (hasCustomLabels && labels[0] === '') { %>Bubble-list--custom<% } %>">
      <% for (var i in bubbleSizes) { %>
        <%
          var customCssClass = '';
          if (hasCustomLabels && labels[1] === '' && i === 0 ||
              hasCustomLabels && i > 0 && i !== bubbleSizes.length - 1) {
            customCssClass = 'Bubble-item--custom';
          }
        %>
        <li class="js-bubbleItem Bubble-item Bubble-item—-<%- i+1 %> <%- customCssClass %>" style="height: <%- bubbleSizes[i] %>%; width: <%- bubbleSizes[i] %>%">
          <span class="Bubble-itemCircle" style=" <%- fillColor ? 'opacity:1; background-color:' + fillColor + ';': ''%>" ></span>
        </li>
      <% } %>
    </ul>
    <p class="Bubble-average CDB-Text CDB-Size-small u-altTextColor <% if (hasCustomLabels) { %>Bubble-average--custom<% } %>" style="bottom: <%- avgSize %>%;">
      <% if (!hasCustomLabels) { %> AVG: <%= formatter.formatNumber(avgLabel) %> <% } %>
    </p>
  </div>
</div>
