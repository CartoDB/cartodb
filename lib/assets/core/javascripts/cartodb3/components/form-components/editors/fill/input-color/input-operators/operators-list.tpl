<ul class="Editor-dropdownCalculations CDB-Text is-semibold">
  <li class="Editor-dropdownCalculationsElement CDB-Fieldset">
    <input class="CDB-Radio" type="radio" name="operator" value="avg" <% if (operator === 'avg') { %>checked<% } %>>
    <span class="u-iBlock CDB-Radio-face"></span>
    <label class="u-iBlock u-lSpace"><%- _t('operators.avg') %></label>
  </li>
</ul>
<div class="js-operatorsList"></div>
