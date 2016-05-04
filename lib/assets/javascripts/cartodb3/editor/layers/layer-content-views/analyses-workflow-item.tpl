<% if (isDone) { %>
  <button class="HorizontalBlockList-item-actionBlock CDB-Text CDB-Size-small u-upperCase">
    <span class="HorizontalBlockList-item-text">
      <%- nodeId %>
    </span>
    <i class="CDB-IconFont CDB-IconFont-ray CDB-Size-medium HorizontalBlockList-item-icon"></i>
  </button>
<% } else { %>
  <div class="CDB-LoaderIcon is-bg">
    <div class="CDB-LoaderIcon-item">
      <span class="CDB-LoaderIcon-itemClose" style="background: <%- bgColor %>"></span>
      <span class="CDB-LoaderIcon-itemCircle" style="background: <%- bgColor %>"></span>
    </div>
  </div>
<% } %>
