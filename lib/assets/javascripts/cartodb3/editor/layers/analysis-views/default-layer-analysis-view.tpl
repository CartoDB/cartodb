<div class="Editor-ListAnalysis-itemInfo u-rSpace--m CDB-Text is-semibold CDB-Size-small u-upperCase" style="background: <%- bgColor %>; color: #fff">
  <% if (isDone) { %>
    <span class="CDB-Text is-light u-rSpace">
      <%- id %>
    </span>
    <i class="CDB-IconFont CDB-IconFont-ray CDB-Size-medium"></i>
  <% } else { %>
    <div class="CDB-LoaderIcon is-bg">
      <div class="CDB-LoaderIcon-item">
        <span class="CDB-LoaderIcon-itemClose" style="background: <%- bgColor %>"></span>
        <span class="CDB-LoaderIcon-itemCircle" style="background: <%- bgColor %>"></span>
      </div>
    </div>
  <% } %>
</div>
<p class="Editor-ListAnalysis-title CDB-Text CDB-Size-small u-secondaryTextColor u-ellipsis" title="<%- title %>"><%- title %></p>
