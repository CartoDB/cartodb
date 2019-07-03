## Column names normalization

When data is uploaded into CARTO using the Import API, the resulting dataset in CARTO might have different column names than the original dataset.

This is because as part of the import workflow there's a process to normalize the column names to avoid unsupported column names in the datasets created after the import process finishes. Some of the actions taken when normalizing column names are:

- Remove accents
- Convert multiple consecutive underscores and hyphens to a single underscore
- Remove unsupported characters ([]{}&%$+, etc.)
- Remove white spaces
- Avoid duplicated column names
- Avoid column names longer than 63 characters
- Avoid reserved words
- Force lower case names
- Force column names to start by a character

### Some examples of column name normalization

Find below a table with some examples of column names and how they are normalized by the Import API:

| *original column name* | *normalized column name* |
| Field: 2 | field_
| 2 Items | _2_item
| Unnamed: 0 | unnamed_0
| 201moore | _201moore
| 201moore | _201moore_1
| Acadia 1.2.3 | acadia_1_2_3
| _testingTesting | _testingtesting
| 1 | _1
| 1.0 | _1_0
| SELECT | _select
| à | a
| longcolumnshouldbesplittedsomehowanditellyouwhereitsgonnabesplittedrightnow | longcolumnshouldbesplittedsomehowanditellyouwhereitsgonnabespli 
| longcolumnshouldbesplittedsomehowanditellyouwhereitsgonnabesplittedrightnow | longcolumnshouldbesplittedsomehowanditellyouwhereitsgonnabe_1 
| all | _all

### Changing column names

In some cases you may want to preserve some of the column names in your original data. For example, let's say you have a column name `column__1` which indeed is a valid column name for PostgreSQL and the Import API renamed it as `column_1`. In the case you want to preserve `column__1` as the column name, right after the import process finished you can update the column name using the [CARTO SQL API](https://carto.com/developers/sql-api/) with a query like this:

```sql
  ALTER TABLE test_1 RENAME COLUMN column_1 to column__1;
  SELECT CDB_TableMetadataTouch('test_1');
```
