## Import API Limits

Developers interact with CARTO platform through our APIs. Either directly or via any of our libraries and SDKs, APIs give access to data, maps and everything that is required to build geospatial applications with CARTO. Therefore, APIs play a fundamental role in our platform.

We encourage developers to follow the documented best practices for each API when they use them. However, our APIs provide such degrees of flexibility that we cannot enforce correct use of our APIs at every moment. Therefore, in order to guarantee the performance of those APIs for every user of the CARTO platform and prevent abuse, we have set up some general limitations and restrictions on how they work. Read the [fundamentals about limits in the CARTO platform]({{site.fundamental_docs}}/limits/), if you want to understand the different types of limits.

When you develop with the Import API, you have to be aware of the following limits.

Import API Usage Limits | Account Plan
--- | ---
| **Free** | **Personal** | **Enterprise**
Maximum concurrent imports | 3 imports enqueued per request | 3 imports enqueued per request | 3 imports enqueued per request
Maximum row count | 500K | 500K | 1M
Maximum file size | 150MB | 500MB | 1GB
Maximum feature vertex count | 10K | 10K | 10K
Maximum number of tables | 2000 tables | 2000 tables | 2000 tables
