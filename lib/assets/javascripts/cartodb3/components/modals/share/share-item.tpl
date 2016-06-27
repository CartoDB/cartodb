<div class="Dialog-headerIcon Card-icon u-bSpace--xl">
  <i class="CDB-IconFont <%- icon %>"></i>
</div>

<div class="Card-body CDB-Text is-light u-bSpace--xl">
  <div class="CDB-Size-large u-mainTextColor u-bSpace--m"><%- title %></div>
  <div class="CDB-Size-medium u-altTextColor">
    <%- body %>
    <% if (url) { %>
    <a href="<%- url %>" class="Share-link js-link"><%- link %></a>
    <% } %>
  </div>
</div>

<div class="Share-input">
  <input type="text" id="<%- id %>" value="<%- content %>" class="Share-input-field CDB-InputText CDB-Text CDB-Size-medium u-ellipsis js-input">
  <button class="Share-copy CDB-Button CDB-Button--small js-copy" data-clipboard-target="#<%- id %>">
    <span class="CDB-Button-Text CDB-Text CDB-Size-small u-actionTextColor"><%- copy %></span>
  </button>
</div>
