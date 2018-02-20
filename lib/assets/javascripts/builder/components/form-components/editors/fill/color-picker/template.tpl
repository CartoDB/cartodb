<div class="Editor-boxModalContent">
  <div class="ColorPicker-pickerWrapper js-colorPicker"></div>
  <div class="ColorPicker-inputs">
    <div class="ColorPicker-inputWrapper CDB-Text">
      <input type="text" class="CDB-Text CDB-InputText ColorPicker-input is-color js-hex" value="<%- hex %>"/>
      <span class="ColorPicker-inputLabel u-upperCase">HEX</span>
    </div>
    <div class="ColorPicker-inputWrapper CDB-Text">
      <input type="text" class="CDB-Text CDB-InputText ColorPicker-input js-inputColor js-r" value="<%- r %>"/>
      <span class="ColorPicker-inputLabel u-upperCase">R</span>
    </div>
    <div class="ColorPicker-inputWrapper CDB-Text">
      <input type="text" class="CDB-Text CDB-InputText ColorPicker-input js-inputColor js-g" value="<%- g %>" />
      <span class="ColorPicker-inputLabel u-upperCase">G</span>
    </div>
    <div class="ColorPicker-inputWrapper CDB-Text">
      <input type="text" class="CDB-Text CDB-InputText ColorPicker-input js-inputColor js-b" value="<%- b %>" />
      <span class="ColorPicker-inputLabel u-upperCase">B</span>
    </div>
    <div class="ColorPicker-inputWrapper CDB-Text">
      <input type="text" class="CDB-Text CDB-InputText ColorPicker-input js-a<% if (opacityDisabled) { %> is-disabled<% } %>" value="<%- opacity %>" <% if (opacityDisabled) { %>disabled<% } %> />
      <span class="ColorPicker-inputLabel u-upperCase">A</span>
    </div>
  </div>
</div>
