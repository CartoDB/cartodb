Sequel.migration do
  up do
    drop_column :users, :ghost_tables_enabled
  end
  
  down do
    add_column :users, :ghost_tables_enabled, :boolean
  end
end
