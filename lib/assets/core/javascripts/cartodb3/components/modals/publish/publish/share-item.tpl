<div class="Card-icon u-bSpace--xl js-icon"></div>

<div class="Card-body u-bSpace--xl">
  <% if (isPrivate) { %>
    <h3 class="CDB-Text CDB-Size-large u-altTextColor u-bSpace--m"><%- title %></h3>
  <% } else { %>
    <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-bSpace--m"><%- title %></h3>
  <% } %>
  <div class="CDB-Text CDB-Size-medium u-altTextColor">
    <%= body %>
    <br/>
    <% if (url && !isPrivate) { %>
    <a href="<%- url %>" class="Share-link js-link"><%- link %></a>
    <% } %>
  </div>
</div>

<% if (!isPrivate && isPublished) { %>
  <div class="Share-input">
    <input type="text" id="<%- id %>" value="<%- content %>" class="Share-input-field CDB-InputText is-disabled CDB-Text CDB-Size-medium u-ellipsis js-input" readonly>
    <button class="Share-copy CDB-Button CDB-Button--small js-copy" data-clipboard-target="#<%- id %>">
      <span class="CDB-Button-Text CDB-Text CDB-Size-small u-actionTextColor"><%- copy %></span>
    </button>
  </div>
<% } %>
