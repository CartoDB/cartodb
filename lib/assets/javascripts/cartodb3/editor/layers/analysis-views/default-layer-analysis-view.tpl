<div class="Editor-ListAnalysis-itemInfo u-rSpace--m CDB-Text is-semibold CDB-Size-small u-upperCase" style="background: <%- bgColor %>; color: #fff">
  <% if (isDone) { %>
    <span class="CDB-Text u-rSpace">
      <%- id %>
    </span>
    <i class="CDB-IconFont CDB-IconFont-ray CDB-Size-medium"></i>
  <% } else { %>
    <div class="CDB-LoaderIcon">
      <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </div>
  <% } %>
</div>
<p class="Editor-ListAnalysis-title CDB-Text CDB-Size-small u-secondaryTextColor u-ellipsis" title="<%- title %>"><%- title %></p>

<% if (hasError) { %>
<div class="Editor-ListAnalysis-itemError"></div>
<% } %>
