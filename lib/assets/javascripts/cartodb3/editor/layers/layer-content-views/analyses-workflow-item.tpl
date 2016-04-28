<% if (isDone) { %>
  <button class="HorizontalBlockList-item-actionBlock CDB-Text CDB-Size-small u-upperCase">
    <span class="HorizontalBlockList-item-text">
      <%- nodeId %>
    </span>
    <i class="CDB-IconFont CDB-IconFont-ray CDB-Size-medium HorizontalBlockList-item-icon"></i>
  </button>
<% } else { %>
  <button>
    <div class="CDB-LoaderIcon">
      <div class="CDB-LoaderIcon-item"></div>
    </div>
  </button>
<% } %>
