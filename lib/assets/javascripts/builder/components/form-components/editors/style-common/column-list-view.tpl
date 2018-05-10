<% if (headerTitle) { %>
<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <button class="u-actionTextColor js-back u-rSpace">
        <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
      </button>
      <%- headerTitle%>
    </li>
  </ul>
</div>
<% } %>
<div class="js-content"></div>
