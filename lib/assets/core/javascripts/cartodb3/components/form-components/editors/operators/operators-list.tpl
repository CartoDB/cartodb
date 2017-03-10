<ul class="Editor-dropdownCalculations CDB-Text is-semibold">
  <li class="Editor-dropdownCalculationsElement CDB-Fieldset">
    <input class="CDB-Radio" type="radio" name="operator" value="count" <% if (operator === 'count') { %>checked<% } %>>
    <span class="u-iBlock CDB-Radio-face"></span>
    <label class="u-iBlock u-lSpace"><%- _t('operators.count') %></label>
  </li>
  <li class="Editor-dropdownCalculationsElement CDB-Fieldset">
    <input class="CDB-Radio" type="radio" name="operator" value="sum" <% if (operator === 'sum') { %>checked<% } %>>
    <span class="u-iBlock CDB-Radio-face"></span>
    <label class="u-iBlock u-lSpace"><%- _t('operators.sum') %></label>
  </li>
  <li class="Editor-dropdownCalculationsElement CDB-Fieldset">
    <input class="CDB-Radio" type="radio" name="operator" value="avg" <% if (operator === 'avg') { %>checked<% } %>>
    <span class="u-iBlock CDB-Radio-face"></span>
    <label class="u-iBlock u-lSpace"><%- _t('operators.avg') %></label>
  </li>
  <li class="Editor-dropdownCalculationsElement CDB-Fieldset">
    <input class="CDB-Radio" type="radio" name="operator" value="max" <% if (operator === 'max') { %>checked<% } %>>
    <span class="u-iBlock CDB-Radio-face"></span>
    <label class="u-iBlock u-lSpace"><%- _t('operators.max') %></label>
  </li>
  <li class="Editor-dropdownCalculationsElement CDB-Fieldset">
    <input class="CDB-Radio" type="radio" name="operator" value="min" <% if (operator === 'min') { %>checked<% } %>>
    <span class="u-iBlock CDB-Radio-face"></span>
    <label class="u-iBlock u-lSpace"><%- _t('operators.min') %></label>
  </li>
</ul>
<div class="js-list"></div>
