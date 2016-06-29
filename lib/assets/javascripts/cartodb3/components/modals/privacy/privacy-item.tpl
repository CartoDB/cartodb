<div class="Card-body CDB-Text is-light u-bSpace--xl">
  <% if (privacy) { %>
  <div class="u-bSpace--xl">
    <i class="Tag Tag--outline <%- cssClass %> CDB-Text CDB-Size-small u-upperCase"><%- privacy %></i>
  </div>
  <% } %>
  <div class="CDB-Size-large u-mainTextColor u-bSpace--m"><%- title %></div>
  <div class="CDB-Size-medium u-altTextColor">
    <% if (body) { %>
      <%- body %>
    <% } else { %>
      <input type="password" class="CDB-InputText CDB-Text CDB-Size-medium js-input" value="<%- password %>">
    <% } %>
  </div>
</div>
