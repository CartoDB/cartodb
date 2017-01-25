Sequel.migration do
  no_transaction # indexes need to be created outside of the transaction

  # This index is used for metrics gathering per database host. See #10115
  up do
    Rails::Sequel.connection.run %{
      CREATE INDEX CONCURRENTLY "users_database_host_index" ON "users" ("database_host");
    }
  end

  down do
    Rails::Sequel.connection.run %{
      DROP INDEX CONCURRENTLY IF EXISTS "users_database_host_index";
    }
  end
end
