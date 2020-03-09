## How to send API Keys

A CARTO API Key is physically a token/code of 12+ random alphanumeric characters.

You can pass in the API Key to our APIs either by using the HTTP Basic authentication header or by sending an `api_key` parameter via the query string or request body. 

**Tip:** If you use our client library CARTO.js, you only need to follow the authorization section and we will handle API Keys automatically for you.

The examples shown to illustrate the different methods of how to send API Keys use the following parameters:

```
- user: username 
- API Key: 1234567890123456789012345678901234567890 
- API endpoint: https://username.carto.com/endpoint/ 
```


### HTTP Basic Authentication

Basic Access Authentication is the simplest technique of handling access control and authorization in a standardized way. It consists essentially of an `HTTP Authorization Basic` header followed by the user credentials (username and password) encoded using base64.

If that looks complicated to you, don’t worry. Most client software provide simple mechanisms to use HTTP Basic Authentication, like [curl](https://ec.haxx.se/http-auth.html), [Request](https://github.com/request/request#http-authentication) (JavaScript) and [Requests](http://docs.python-requests.org/en/master/user/authentication/#basic-authentication) (Python).

For requests to CARTO’s APIs, take the API Key as the password, and the username as the user who issued that API Key.

#### Examples:

##### Curl

```bash
curl -X GET \
  'https://username.carto.com/endpoint/' \
  -H 'authorization: Basic dXNlcm5hbWU6MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA==' 
```

##### Request (JavaScript)

```javascript
request.get('https://username.carto.com/endpoint/', {
  'auth': {
    'user': 'username',
    'pass': 1234567890123456789012345678901234567890
  }
});
```

##### Requests (Python)
```python
r = requests.get('https://username.carto.com/endpoint/', auth=(username, 1234567890123456789012345678901234567890))
```

### Query string/Request body parameter

Alternatively, you can use an URL query string parameter or a field in the request body. In both cases, the name of the parameter is `api_key`.

#### Examples:

```bash
curl -X GET 'https://username.carto.com/endpoint/?api_key=1234567890123456789012345678901234567890'
```

```bash
curl -X POST \
  'https://username.carto.com/endpoint/' \
  -H 'content-type: application/json' \
  -d '{
	"api_key": "1234567890123456789012345678901234567890"
  }'
```


If, for some mysterious reason, you submit the API Key with more than one of the available methods, the order of precedence is as follows:

1. HTTP Basic Authentication header 
2. URL query string parameter 
3. Request body field 

Likewise, for security reasons and future-proofing, we recommend that you use that same order when choosing a method for sending the API Key. In other words, favour the use of HTTP Basic Authentication over the URL query string, and try to avoid the body field. We support this method just for backwards compatibility. 
