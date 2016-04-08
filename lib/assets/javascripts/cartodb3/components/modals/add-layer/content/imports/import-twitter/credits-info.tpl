<% if (value <= remaining) { %>
  <%- per %>% of your <%- remainingFormatted %> Twitter credits left
<% } else if (remaining <= 0 && !hardLimit) { %>
  Twitter credits for this period consumed - <strong>$<%- block_price/100 %>/<%- block_size %> extra tweets</strong> will be charged
<% } else { %>
  No limits - <strong>$<%- block_price/100 %>/<%- block_size %> extra tweets</strong> will be charged
<% } %>
