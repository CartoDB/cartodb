<form class="Form js-form">
  <div class="Form-row">
    <div class="Form-rowLabel">
      <label class="CDB-Text CDB-Size-medium">Enter a URL</label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="CDB-Text CDB-Size-medium Form-input Form-input--longer has-submit js-textInput" value="" placeholder="Paste here your ArcGIS Server&trade; table URL" />
      <button type="submit" class="Button Button--secondary Form-inputSubmit"><span>submit</span></button>
      <div class="Form-inputError">Error. Your URL doesn’t look correct.</div>
    </div>
  </div>
  <div class="Form-row">
    <div class="Form-rowLabel"></div>
    <div class="Form-rowData Form-rowData--longer">
      <p class="CDB-Text CDB-Size-small Form-rowInfoText--centered Form-rowInfoText--block u-altTextColor">
        Format: http://&#60;host&#62;/arcgis/rest/services/&#60;folder&#62;/&#60;serviceName&#62;/&#60;serviceType&#62;<br/>
        To retrieve a particular layer, add the layer index at the end of the URL
      </p>
    </div>
  </div>
</form>
