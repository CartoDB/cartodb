## Authorization for CARTO views

With the [CARTO Auth API](https://carto.com/developers/auth-api/), it is possible to create API Keys not only for tables in CARTO (aka datasets), but also for Views in CARTO.

CARTO use PostgreSQL as the database to store your datasets, so you can create a View in CARTO in the same way that is created in PostgreSQL. In [this section](https://www.postgresql.org/docs/9.5/static/tutorial-views.html) of PostgreSQL documentation you can find detailed information about how Views are created.

What is the advantage of using a View with the CARTO Auth API? Well, in order to answer that questions, let's assume that you have a dataset in CARTO and you want to restrict partial information of your dataset when publishing a map or using the SQL API. 

For example, you might have a `clients` dataset with [private privacy](https://carto.com/learn/guides/publish-share/privacy-settings-for-protecting-maps-and-data/) and you want ot build a location intelligence app with clients of New York area only:

```sql
CREATE VIEW clients_nyc AS (
    SELECT * FROM clients WHERE area = 'NY'
);
```

Now, you would need to use the Auth API in order to create the API Key for the View by making a POST request using a [HTTP Basic Authentication](https://carto.com/developers/auth-api/guides/how-to-send-API-Keys/#http-basic-authentication). The payload to create the API Key using the CARTO Auth API and giving Maps permission to the view would be the next:

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