## General Concepts

The following concepts are the same for every endpoint in the API except when it is noted explicitly.


### Auth

Manipulating data on a CARTO account requires prior authentication using a unique identifier as a password. For the import API, a special identifier known as the API Key is used as a proof of authentication for each user account to authorize access to its data.

To execute an authorized request, `api_key=YOURAPIKEY` should be added to the request URL. This parameter can be also passed as a POST parameter. We **strongly advise** using HTTPS when you are performing requests that include your `api_key`.

---

### Errors

Errors are reported using standard HTTP codes and extended information encoded in the HTML language, as shown in the following example:

```html
<html>
  <head>
    <title>411 Length Required</title>
  </head>
  <body bgcolor="white">
    <center>
      <h1>411 Length Required</h1>
    </center>
    <hr>
    <center>nginx</center>
  </body>
</html>
```

Depending on the specific case, additional information regarding the error may be presented. See support section for details about known error codes and solutions.
