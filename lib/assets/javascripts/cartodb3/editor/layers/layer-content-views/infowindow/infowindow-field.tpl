<div class="CDB-Text CDB-Fieldset u-tSpace-xl">
  <div class="CDB-Legend CDB-Legend--big u-ellipsis CDB-Text CDB-Size-medium u-rSpace--m">
    <div class="CDB-Shape u-iblock u-malign">
      <div class="CDB-Shape-rectsHandle is-small">
        <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-first"></div>
        <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-second"></div>
        <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-third"></div>
      </div>
    </div>
    <input class="CDB-Checkbox js-checkbox" type="checkbox" <% if (isSelected) { %>checked="checked"<% } %>">
    <span class="u-iBlock CDB-Checkbox-face u-rSpace"></span>
    <label class="u-rSpace--m" title="<%- name %>"><%- name %></label>
  </div>
  <input type="text" name="text" placeholder='"<%- name %>"' value="<% if (!isSelected) { %><%- name %><% } else { %><% if (title) { %><% if (alternativeName) { %><%- alternativeName %><% } else { %><%- name %><% } %><% } %><% } %>" class="CDB-InputText js-input" <% if (!isSelected) { %>disabled<% } %>>
</div>
