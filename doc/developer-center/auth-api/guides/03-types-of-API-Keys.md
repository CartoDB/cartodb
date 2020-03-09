## Types of API Keys

In CARTO, you can find 3 types of API Keys:

- Regular 
- Default public 
- Master


#### Regular

Regular API Keys are the most common type of API Keys. They provide access to APIs and database tables (AKA datasets) in a granular and flexible manner.

For example one API key can provide access to:
  
- The SQL API 
- The `world_population` dataset with select permission 
- The `liked_cities` dataset with select/insert permissions 
- Creating new datasets in the user account
- Listing existing datasets in the user account
  
With this API Key you can: 

- Access the SQL API, but not the Maps API.
- Run a `SELECT SQL` query to the `world_population` dataset, but not an `UPDATE`, `DELETE` or `INSERT`.
- Run an `INSERT` to the `liked_cities` dataset, but not to `national_incomes`.
- Run `CREATE TABLE AS...` SQL queries to create new tables in the user account. As the owner of the tables created you'll also be able to `DROP` and `ALTER` the created tables.
- Read metadata (like name or privacy) from `national_incomes`, but not its content.

It's possible to create as many regular API Keys as you want. Moreover, to enforce security, we encourage you to create as many regular API Keys as apps/maps you produce. Since regular API Keys can be independently revoked, you have complete control of the lifecycle of your API credentials.

An important property to keep in mind about regular API Keys is that they are *not editable*. You can not add/delete datasets nor APIs. It’s designed this way on purpose for security reasons.

Another important property of Regular API keys is that they inherit all the datasets permissions from the Default Public API Key.

You can see below an example of a real API key as it is displayed in a CARTO account.

![Capture Auth API key section in dashboard](../img/capture-auth-apikey.png)

#### Default Public

Default public are a kind of regular API Keys. They too provide access to APIs and datasets, but for the latter in a read-only way.

Every user has one and only one Default Public API Key. That means that on user creation a Default API Key is issued for that user, and that these type of keys are not revocable/deletable.

For example one Default Public API Key can provide access to 

- the SQL API 
- the Maps API 
- the `world_population` dataset with read permission 
- the `liked_cities` dataset with read permission 

As you can see, API and read-only selected datasets access are possible.

At the beginning of this authentication section we stated that all API requests require an API Key. Well, we lied a little bit. If none is provided, the Default Public API Key is used as a fall back. 

**Warning:** This is done for backwards compatibility reasons. Don’t expect this behaviour to be maintained in the long term, it can be deprecated. 

Get used to always send an API Key, even if it’s the Default Public.

A cosmetic difference compared to the other API Key types is the code/token that identifies these API Keys, it’s just: _default_public_. It’s a simple human-readable constant string, no randoms involved.


#### Master

Master keys are a very special kind of API Keys. As it happens with the Default Public type, every user has one and only one Master non revocable API Key.

The special thing about Master API Keys is that they grant access to EVERYTHING: APIs and datasets (select/insert/create/delete). Additionally, a Master API Key is required to access most of the Auth API endpoints.

Your Master API key carries many privileges, so be sure to keep it secret. Do not share it in publicly accessible areas such as GitHub or client-side code. 

Below you have an example of a master API key.

![Capture Master Auth API key section in dashboard](../img/capture-auth-apikey-master.png)

**Tip:** If you think is has been compromised, regenerate it immediately.

Actually, you should use Master API Keys sparingly. Try to limit its direct use only to interact programmatically with the [Auth API]({{site.authapi_docs}}/reference/). Issue and use regular API Keys for the rest of use cases.
