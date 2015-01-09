Sequel.migration do
  up do
    add_column :users, :ghost_tables_enabled, :boolean, default: false
  end
  
  down do
    drop_column :users, :ghost_tables_enabled
  end
end
