<div class="CDB-Text Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--neutral Dialog-headerIcon--small">
    <i class="CDB-IconFont CDB-IconFont-markup"></i>
  </div>
  <p class="Dialog-headerTitle">Query this table</p>
  <p class="Dialog-headerText">Using the <a href="https://docs.carto.com/cartodb-platform/sql-api.html" target="_blank">CARTO SQL API</a> you can perform any SQL query to either yours or other users tables.</p>
</div>

<div class="Dialog-body Dialog-body--tall u-inner OptionCards">
  <code class="OptionCard OptionCard--static OptionCard--code OptionCard--codeRequest">
    <pre><%- url %>?q=<%- sql %></pre>
  </code>
  <code class="OptionCard OptionCard--static OptionCard--code OptionCard--codeResult">
    <pre>{
  rows: [<% _.each(rows, function(row, i) { %>
    {<% var j = 0 %><% _.each(row.attributes, function(val, key) { %>
      "<%- key %>": "<%- val %>"<% if (j !== _.size(row.attributes)-1) { %>,<% } %><% j++ %><% }) %>
    }<% if (i !== rows.length-1) { %>,<% } %><% }) %>
  }],
  time: 0.013,
  fields: {<% _.each(schema, function(field, i) { %>
    "<%- field[0] %>": { "type": "<%- field[1] %>" }<% if (i !== schema.length-1) { %>,<% } %><% }) %>
  },
  total_rows: 20
}</pre>
    <div class="OptionCard-shadow"></div>
  </code>
</div>

<div class="Dialog-footer Dialog-footer--simple u-inner">
  <button class="CDB-Text CDB-Button CDB-Button--secondary u-upperCase CDB-Size-medium cancel js-close">
    <span>Close</span>
  </button>
</div>