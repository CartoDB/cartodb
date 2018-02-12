## Errors

CARTO.js emits error objects when something goes wrong. Errors appear in your developer console if not caught. The error object has a code and a description to help you identify the problem and troubleshoot.

_Note: Some descriptions are still in the process of being defined. More details will appear as we continue to enhance CARTO.js._

### CARTO.js API Error Codes

If you encounter an error while loading CARTO.js, the following table contains a list of known errors codes and possible solutions.

<table id="errors-table" class="paramsTable u-vspace--24">
  <thead>
    <tr>
      <th class="error"><h5 class="title is-small is-regular">Error Code</h5></th>
      <th class="message"><h5 class="title is-small is-regular">Message</h5></th>
      <th class="description"><h5 class="title is-small is-regular">Description</h5></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tdParams error"><span class="params">api-key-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">apiKey property is required.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">The API key is not included in the script element that loads the API. You need to include an API Key.</p>

        <p class="text is-small u-tspace--4"><a href="/documentation/carto-js/reference/#authentication">See <em>Requesting an API key</em>.</a></p>
      </td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">api-key-string</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">apiKey property must be a string.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">The API key included in the script element that loads the API is not a string. You need to include a string.</p>
      </td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">username-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">username property is required.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">The username is not included in the script element that loads the API. You need to include your CARTO username.</p>
      </td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">username-string</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">username property must be a string.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">The username included in the script element that loads the API is not a string. You need to include a username as a string.</p>
      </td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">non-valid-server-url</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">serverUrl is not a valid URL.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">The URL included in the script element is not a valid. Check to make sure that you are using a valid URL.</p>

        <p class="text is-small u-tspace--4"><a href="http://localhost:9000/documentation/carto-js/reference/#cartoclient">See <code>carto.Client</code>.</a></p>
      </td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">non-matching-server-url</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">serverUrl doesn't match the username.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">The URL included in the script element does not match the provided username. Ensure that you are using your correct CARTO username.</p>
      </td>
    </tr>
  </tbody>
</table>


### CARTO.js Error Codes

If you find a validation error on Chrome JavaScript Console, Firefox Web Console, or any other equivalent tools in your browser, please reference the tables below to find explanations for the validation errors. Each table gives specific error information for the different components of CARTO.js.


### Dataview

<table id="errors-table" class="paramsTable u-vspace--24">
  <thead>
    <tr>
      <th class="error"><h5 class="title is-small is-regular">Error Code</h5></th>
      <th class="message"><h5 class="title is-small is-regular">Message</h5></th>
      <th class="description"><h5 class="title is-small is-regular">Description</h5></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tdParams error"><span class="params">source-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Source property is required.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">Dataviews are a way to extract data from a CARTO account in predefined ways. You need to include the data source (dataset, sql query) that your Dataviews are pointing to. </p>

        <p class="text is-small u-tspace--4"><a href="/documentation/carto-js/reference/#cartodataviewbasegetsource">See <code>getSource</code> for <code>carto.dataview.Base</code>.</a></p>
      </td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">column-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Column property is required.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">Once you have a Dataview source (dataset, sql query), you need to point to a column.</p>

        <p class="text is-small u-tspace--4"><a href="/documentation/carto-js/reference/#cartodataviewbasegetcolumn">See <code>getColumn</code> for <code>carto.dataview.Base</code></a></p>
      </td>
	</tr>
    <tr>
      <td class="tdParams error"><span class="params">column-string</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Column property must be a string.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">The column you are pointing to, within a Dataview source, must be a string.</p>
      </td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">empty-column</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Column property must be not empty.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">The column you are pointing to, within a Dataview source, cannot be empty.</p>
      </td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">filter-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Filter property is required.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">time-series-options-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Options object to create a time series dataview is required.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">time-series-invalid-aggregation</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Time aggregation must be a valid value. Use carto.dataview.timeAggregation.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">time-series-invalid-offset</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Offset must an integer value between -12 and 14.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">time-series-invalid-uselocaltimezone</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">useLocalTimezone must be a boolean value.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">histogram-options-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Options object to create a histogram dataview is required.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">histogram-invalid-bins</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Bins must be a positive integer value.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">formula-options-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Formula dataview options are not defined.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">formula-invalid-operation</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Operation for formula dataview is not valid. Use carto.operation.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">category-options-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Category dataview options are not defined.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">category-limit-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Limit for category dataview is required.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">category-limit-number</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Limit for category dataview must be a number.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">category-limit-positive</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Limit for category dataview must be greater than 0.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">category-invalid-operation</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Operation for category dataview is not valid. Use carto.operation.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">category-operation-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Operation column for category dataview is required.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">category-operation-string</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Operation column for category dataview must be a string.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">category-operation-empty</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Operation column for category dataview must be not empty.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
  </tbody>
</table>


### Filter

<table id="errors-table" class="paramsTable u-vspace--24">
  <thead>
    <tr>
      <th class="error"><h5 class="title is-small is-regular">Error Code</h5></th>
      <th class="message"><h5 class="title is-small is-regular">Message</h5></th>
      <th class="description"><h5 class="title is-small is-regular">Description</h5></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tdParams error"><span class="params">invalid-bounds-object</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Bounds object is not valid. Use a <code>carto.filter.Bounds object</code>.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
  </tbody>
</table>

### Layer

<table id="errors-table" class="paramsTable u-vspace--24">
  <thead>
    <tr>
      <th class="error"><h5 class="title is-small is-regular">Error Code</h5></th>
      <th class="message"><h5 class="title is-small is-regular">Message</h5></th>
      <th class="description"><h5 class="title is-small is-regular">Description</h5></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tdParams error"><span class="params">non-valid-source</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">The given object is not a valid source. See <code>carto.source.Base</code>.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">bad-layer-type</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">The given object is not a layer.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">non-valid-style</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">The given object is not a valid style. See <code>carto.style.Base</code>.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">source-with-different-client</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">A layer can't have a source which belongs to a different client.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">style-with-different-client</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">A layer can't have a style which belongs to a different client.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
  </tbody>
</table>

### Source

<table id="errors-table" class="paramsTable u-vspace--24">
  <thead>
    <tr>
      <th class="error"><h5 class="title is-small is-regular">Error Code</h5></th>
      <th class="message"><h5 class="title is-small is-regular">Message</h5></th>
      <th class="description"><h5 class="title is-small is-regular">Description</h5></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tdParams error"><span class="params">query-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">SQL Source must have a SQL query.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">query-string</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">SQL Query must be a string.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">no-dataset-name</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Table name is required.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">dataset-string</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Table name must be a string.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">dataset-required</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">Table name must be a string.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
  </tbody>
</table>

### Style

<table id="errors-table" class="paramsTable u-vspace--24">
  <thead>
    <tr>
      <th class="error"><h5 class="title is-small is-regular">Error Code</h5></th>
      <th class="message"><h5 class="title is-small is-regular">Message</h5></th>
      <th class="description"><h5 class="title is-small is-regular">Description</h5></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tdParams error"><span class="params">required-css</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">CartoCSS is required.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">css-string</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">CartoCSS must be a string.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
  </tbody>
</table>

### CARTO.js Platform Error Codes for Developers

If you find an error on Chrome JavaScript Console, Firefox Web Console, or any other equivalent tools on your browsers (regarding platform (aka. backend services)), please reference the table below to find explanations for the error codes.

<table id="errors-table" class="paramsTable u-vspace--24">
  <thead>
    <tr>
      <th class="error"><h5 class="title is-small is-regular">Error Code</h5></th>
      <th class="message"><h5 class="title is-small is-regular">Message</h5></th>
      <th class="description"><h5 class="title is-small is-regular">Description</h5></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tdParams error"><span class="params">over-platform-limits</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">You are over platform's limits.</p>
      </td>
      <td class="tdParams description">
        <p class="text is-small u-tspace--4">Depending on your account plan, the following limits are enforced when using CARTO Engine. All usage limits are based per user. For Enterprise account plans, the usage limits apply to each user in the organization.</p>

        <p class="text is-small u-tspace--4"><a href="https://carto.com/reference/faqs/carto-engine-usage-limits/">See <em>CARTO Engine Usage Limits</em>.</a></p>
      </td>
    </tr>
    <tr>
      <td class="tdParams error"><span class="params">generic-limit-error</span></td>
      <td class="tdParams message">
        <p class="text is-small u-tspace--4">The server is taking too long to respond, due to poor conectivity or a temporary error with our servers. Please try again soon.</p>
      </td>
      <td class="tdParams description"></td>
    </tr>
  </tbody>
</table>

### Checking Errors in your Browser

CARTO.js writes error messages to `window.console` if they are not caught. Please check the developer documentation for your browser in order to understand how you can check it.

If any errors occurred when loading CARTO.js, they appear as one or more lines in the console. You can check the [error codes table](#errors above to find te error in the error message. You can also find the details about the error message in the [Full Reference API](https://carto.com/documentation/carto-js/reference/).

Ensure that you are using a [supported browser](https://carto.com/documentation/carto-js/support/browsers/).