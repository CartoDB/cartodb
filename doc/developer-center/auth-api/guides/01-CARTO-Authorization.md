## CARTO Authorization 

All requests to CARTO's APIs (Maps, Sql, etc.) require you to authenticate with an API Key.
API Keys identify your project and provide a powerful and flexible primitive for managing access to CARTO's resources like APIs and Datasets.

These API Keys can be provisioned, revoked and regenerated through the [Auth API]({{site.authapi_docs}}/reference/) or the dashboard. You are able to manage authorization through the UI, by [logging on to your CARTO account](https://carto.com) and managing everything in there. Here you have an example of the authorization dashboard in a real CARTO account.

![Authorization dashboard image 1](../img/capture-dashboard-auth.png)

And here you can see the process of creating a new API key, managing its name and resources in terms of APIs and Datasets, including its permissions.

![Authorization dashboard image 2](../img/capture-auth-new-apikey.png)

**Warning:** Changes to the key permissions are not possible once key is generated.
