<div class="Bubble-container">
  <ul class="Bubble-list<% if (hasCustomLabels && labels[1] === '') { %> Bubble-list--custom<% } %>">
    <% for (var i in bubbleSizes) { %>
      <%
        var customCssClass = '';
        var index = +i;
        if (hasCustomLabels) {
          customCssClass = (labels[0] !== '' && index === 0) ? '' : 'Bubble-item--custom';
        }
      %>
      <li class="js-bubbleItem Bubble-item <%- customCssClass %>">
        <% if (!hasCustomLabels || (hasCustomLabels && index === 0)) {%>
          <div class="Bubble-label CDB-Text CDB-Size-small" style="height: <%- bubbleSizes[i] %>%;">
            <div class="Bubble-numbersItem CDB-Text CDB-Size-small"><%= formatter.formatNumber(labels[i]) %></div>
          </div>
        <% } %>
        <div class="Bubble-circle">
          <span class="Bubble-itemCircle" style="height: <%- bubbleSizes[i] %>%; width: <%- bubbleSizes[i] %>%; <%- fillColor ? 'opacity:1; background-color:' + fillColor + ';': ''%>" ></span>
        </div>
      </li>
    <% } %>

    <% if (labels[labels.length - 1]) { %>
      <li class="js-bubbleItem Bubble-item">
        <div class="Bubble-label CDB-Text CDB-Size-small" style="height: 0%;">
          <div class="Bubble-numbersItem CDB-Text CDB-Size-small"><%= formatter.formatNumber(labels[labels.length - 1]) %></div>
        </div>
      </li>
    <% } %>
  </ul>

  <% if (!hasCustomLabels) { %>
    <p class="Bubble-average CDB-Text CDB-Size-small u-altTextColor <% if (hasCustomLabels) { %>Bubble-average--custom<% } %>" style="bottom: <%- avgSize %>%;">
      AVG: <%= formatter.formatNumber(avgLabel) %>
    </p>
  <% } %>
</div>
