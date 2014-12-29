Sequel.migration do
  up do
    drop_column :users, :ghost_tables_enabled
  end
  
  down do
    alter_table :users do
      add_column :users, :ghost_tables_enabled, :boolean, default: false
    end
  end
end
