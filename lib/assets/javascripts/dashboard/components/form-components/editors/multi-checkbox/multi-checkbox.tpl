<div class="FormAccount-rowData">
  <% inputs.forEach(function (input) { %>
    <div class="u-iblock CDB-Text CDB-Size-medium u-lSpace--xl">
      <input
        class="CDB-Checkbox js-checkbox"
        type="checkbox"
        name="<%- input[0] %>"
        <%- values[input] ? 'checked' : '' %>
        <%- isDisabled ? 'disabled' : '' %>
      >
      <span class="u-iBlock CDB-Checkbox-face"></span>
      <label class="u-iBlock u-lSpace u-upperCase u-rSpace"><%- input %></label>
    </div>
  <% }) %>
</div>
