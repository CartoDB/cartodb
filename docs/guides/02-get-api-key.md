## Get API Key

To use the CARTO.js library, you must register your project in your CARTO account and get an API key which you can add to your app or website.

### Quick guide to getting a key

#### Step 1: Get an API Key from your CARTO account

Start creating your API key, [registering a project](https://carto.com/login) in the CARTO Platform.

Notes:

  - **Tip**: During development and testing, you can register a project for testing purposes in the CARTO Platform and use a generic, unrestricted API key. When you are ready to move your app or website into production, register a separate project for production, create a restricted API key, and add the key to your application.
  - **Enterprise customers**: For production-ready apps, you must use a restricted API key. 

For more information, see the [fundamentals about authorization]({{site.fundamental_docs}}/authorization/).

#### Step 2: Add the API key and username to your application

After loading the CARTO.js library, substitute YOUR_API_KEY in the code below with the API key you got from the previous step.

```javascript
var client = new carto.Client({
  apiKey: '{YOUR_API_KEY}',
  username: '{username}'
});
```

You can get your username following these steps:

  - Login into to your CARTO account.
  - Go to your account from the left menu.
  - Copy the username under the plan information.

#### More about API keys

The API key allows you to control your applications in the CARTO Platform.

If you are a Trial Plan customer, with an API key you have access to all the Engine features.

If you are an Engine Plan customer, you must use an API key to access all the custom features and benefits of your Engine Plan.

#### Detailed guide for users of the CARTO.js library

Follow these steps to get an API key:

  - Go to your CARTO account.
  - Go to your API Keys dashboard.
  - Click "NEW API KEY" to create a new one.
  - If you want to manage projects, you can regenerate or delete them.
  - On the API key page, configure it giving a name and the APIs and Datasets you want to use. 

For more information on using the CARTO Platform, see our [fundamentals]({{site.fundamental_docs}}/).


#### Troubleshooting authorization issues

If your API key is malformed or you supply an invalid username, the CARTO.js library returns an HTTP 403 (Forbidden) error.

CARTO Enterprise customers have access to enterprise-level support through CARTO’s support representatives available at enterprise-support@carto.com.
