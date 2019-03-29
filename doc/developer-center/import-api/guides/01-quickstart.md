## Quickstart

For this example (and the rest of the ones illustrated here) we will be using a command-line tool known as `cURL`. For more info about this tool see [this blog post](http://quickleft.com/blog/command-line-tutorials-curl) or type `man curl` in bash.

### Uploading a Local File

Suppose you have a CARTO account whose username is *documentation*, and you want to upload a local file named *prism_tour.csv* (located in the *Documents* folder). This requires that you execute the following command on a Terminal window:

#### Call

```bash
curl -v -F file=@/home/documentation/Documents/prism_tour.csv
"https://documentation.carto.com/api/v1/imports/?api_key=3102343c42da0f1ffe6014594acea8b1c4e7fd64"
```

Note that the *api_key* element has an alphanumeric value that is exclusive to the *documentation* CARTO account.

The response to this request appears in the following format, where a successful value indicates that the import process is enqueued:

#### Response

```
{
  "item_queue_id": "efa9925c-31dd-11e4-a95e-0edbca4b5057",
  "success": true
}
```

The `item_queue_id` value is a unique identifier that references the import process. Once this process has started, its information can be obtained doing a request to the imports endpoint as explained in the ["Check the status of an import process]({{site.importapi_docs}}/guides/standard-tables/#check-the-status-of-an-import-process) section.

### Uploading from a Remote URL

Suppose you have a server at the hostname *examplehost.com*, with a csv named *sample.csv* already uploaded. Creating a table from the URL requires that you execute the following command on a Terminal window:

#### Call

```bash
curl -v -H "Content-Type: application/json" -d '{"url":"https://examplehost.com/sample.csv"}'
"https://documentation.carto.com/api/v1/imports/?api_key=3102343c42da0f1ffe6014594acea8b1c4e7fd64"
```

The response to this request returns the following format, returning a success value if the import process is correctly enqueued:

#### Response

```
{
  "item_queue_id": "efa9925c-31dd-11e4-a95e-0edbca4b5057",
  "success": true
}
```

### Connecting to a Database

Suppose you have an external MySQL database named _mydb_ that you want to connect to. For the purpose of this example, you will access a server with the address of _mydbserver.com_. Your username is _myuser_, and your password is _mypass_. Connect a CARTO dataset to a remote table, named _mytable_, by executing the following command on a Terminal window:

#### Call

```bash
curl -v -H "Content-Type: application/json" -d '{
  "connector": {
    "provider": "mysql",
    "connection": {
      "server":"mydatabaserver.com",
      "database":"mydb",
      "username":"myuser,
      "password":"mypass"
    },
    "table": "mytable"
  }
}' "https://documentation.carto.com/api/v1/imports/?api_key=3102343c42da0f1ffe6014594acea8b1c4e7fd64"
```

#### Response

```
{
  "item_queue_id": "tyf9925c-32dd-11f4-a95f-0fdbca4b5058",
  "success": true
}
```
