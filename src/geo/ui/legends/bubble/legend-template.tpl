<!-- <p>FILL COLOR: <%= fillColor %></p>-->
<div class="Bubble-container u-flex u-justifySpace">
  <% if (bubbles && bubbles.length > 0) { %>

    <ul class="Bubble-numbers">
      <% for(var i = 0, l = bubbles.length; i<l; i++) { %>
        <li class="Bubble-numbersItem CDB-Text CDB-Size-small"><%- bubbles[i] %></li>
      <% } %>
    </ul>

    <div class="Bubble-inner">
      <ul class="Bubble-list">
        <% for(var i = 0, l = bubbles.length; i<l; i++) { %>
          <li class="js-bubbleItem Bubble-item Bubble-item—-<%- i+1 %>">
            <span class="Bubble-itemCircle" style="background-color: <%= fillColor %>; height: <%- bubbles[i] %>px; width: <%- bubbles[i] %>px"></span>
          </li>
        <% } %>
      </ul>
      <% if (avg) { %>
        <p class="Bubble-average CDB-Text CDB-Size-small u-altTextColor" style="top: 50%;">AVG: <%= avg %></p>
      <% } %>
    </div>
  <% } %>
</div>


