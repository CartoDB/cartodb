<div class="
  VerticalRadioList-itemInner
  <% if (hasError) { %> has-error<% } %>
">
  <% if (isDone) { %>
    <div class="VerticalRadioList-radio u-rSpace--m">
      <input class="CDB-Radio" type="radio" <%- isDone && isSelected ? 'checked' : '' %>>
      <span class="u-iBlock CDB-Radio-face"></span>
    </div>
  <% } else { %>
    <div class="CDB-LoaderIcon is-blue u-rSpace--m">
      <svg class="CDB-LoaderIcon-spinner" viewbox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"/>
      </svg>
    </div>
  <% } %>

  <div class="CDB-Text CDB-Size-small is-semibold u-rSpace u-upperCase u-flex u-alignCenter" style="color: <%- bgColor %>;">
    <span class="u-rSpace--s"><%- nodeId %></span>
    <i class="CDB-IconFont CDB-IconFont-ray CDB-Size-small"></i>
  </div>

  <div class="VerticalRadioList-label CDB-Text CDB-Size-medium js-analysis-name js-tooltip">
    <%- name %>
  </div>

  <div class="VerticalRadioList-spacer"></div>

  <%= linkContent %>
</div>
