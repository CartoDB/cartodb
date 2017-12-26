Sequel.migration do
  change do
    alter_table :users do
      add_column :sync_tables_enabled, :boolean, :default => false
    end
  end
end
