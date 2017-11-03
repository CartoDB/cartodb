Sequel.migration do
  no_transaction # indexes need to be created outside of the transaction

  up do
    SequelRails.connection.run %{
      CREATE INDEX CONCURRENTLY "visualizations_state_id_index" ON "visualizations" ("state_id");
    }
  end

  down do
    SequelRails.connection.run %{
      DROP INDEX CONCURRENTLY IF EXISTS "visualizations_state_id_index";
    }
  end
end
