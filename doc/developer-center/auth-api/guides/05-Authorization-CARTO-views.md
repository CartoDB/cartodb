## Authorization for CARTO views

With the [CARTO Auth API](https://carto.com/developers/auth-api/), it is possible to create API Keys not only for tables in CARTO (aka datasets), but also for Views in CARTO.

CARTO use PostgreSQL as the database to store your datasets, so you can create a View in CARTO in the same way that it is created in PostgreSQL. We would recommend checking [this section](https://www.postgresql.org/docs/9.5/static/tutorial-views.html) of the PostgreSQL documentation if you want to learn more about how Views are created in PostgreSQL.

What is the advantage of using a View with the CARTO Auth API? Well, in order to answer that question, let's assume that you have a dataset in CARTO and you want to restrict partial information of your dataset when publishing a map or using the SQL API. For example, you might have a dataset named `clients` with [private privacy](https://carto.com/learn/guides/publish-share/privacy-settings-for-protecting-maps-and-data/) and you want to build a map with clients of New York area only, so you can create a View as it is done in the next block of code:

```sql
CREATE VIEW clients_nyc AS (
    SELECT * FROM clients WHERE area = 'NY'
);
```

Now, you would need to use the Auth API in order to create the API Key for the View with a payload that sets the permissions of the new API Key that will be created. In this example, we are giving read-only or select permission to our View so it can only be available when using the API key with the [CARTO Maps API](https://carto.com/developers/maps-api/) or [CARTO.js](https://carto.com/developers/carto-js/).

```json
{
  "name": "Clients-NYC",
  "grants": [
    {
      "type": "apis",
      "apis": [
        "maps"
      ]
    },
    {
      "type": "database",
      "tables": [
        {
          "schema": "public",
          "name": "clients_nyc",
          "permissions": [
            "select"
          ]
        }
      ]
    }
  ]
}
```

If you try to access to the data of this View using the [CARTO SQL API](https://carto.com/developers/sql-api/), you will receive a forbidden error, because this API Key do not have permissions to be accessed using the CARTO SQL API.

So, by creating API Keys for the Views in CARTO using the Auth API, we can display the information partial information that we want and at the same time, keeping our data private.
