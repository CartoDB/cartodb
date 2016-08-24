Sequel.migration do
  up do
    execute "commit;" # indexes need to be created outside of the transaction
    execute %{
      CREATE INDEX CONCURRENTLY "visualizations_state_id_index" ON "visualizations" ("state_id");
    }
  end

  down do
    execute %{ DROP INDEX "visualizations_state_id_index"; }
  end
end
