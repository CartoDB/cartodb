<div class="VerticalRadioList-radio u-rSpace--m">
  <input class="CDB-Radio" type="radio" <%- isDone && isSelected ? 'checked' : '' %>>
  <span class="u-iBlock CDB-Radio-face"></span>
</div>

<div class="CDB-Text CDB-Size-medium u-rSpace--m u-upperCase" style="color: <%- bgColor %>;">
  <%- nodeId %>
  <% if (!isNew) { %>
    <i class="CDB-IconFont CDB-IconFont-ray CDB-Size-medium VerticalRadioList-item-icon"></i>
  <% } %>
</div>

<div class="CDB-Text CDB-Size-medium js-analysis-name">
  <%- name %>
  <% if (!isDone) { %> Loading... <% } %>
  <% if (hasError) { %>
    <div class="Editor-ListAnalysis-itemError"></div>
  <% } %>
</div>
