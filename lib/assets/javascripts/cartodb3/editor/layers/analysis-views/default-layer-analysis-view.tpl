<div class="Editor-ListAnalysis-itemInfo u-rSpace--m CDB-Text is-semibold CDB-Size-small u-upperCase"
    <% if (!isPending) { %>
      style="background: #E27D61; color: #fff"
    <% } %>
  >
  <% if (isPending) { %>
    <div class="CDB-LoaderIcon">
      <div class="CDB-LoaderIcon-item"></div>
    </div>
  <% } else { %>
    <span class="CDB-Text is-light u-rSpace">
      <%- id %>
    </span>
    <i class="CDB-IconFont CDB-IconFont-ray CDB-Size-medium HorizontalBlockList-item-icon"></i>
  <% } %>
</div>
<p class="Editor-ListAnalysis-title CDB-Text CDB-Size-small u-secondaryTextColor u-ellipsis" title="<%- title %>"><%- title %></p>
