Sequel.migration do
  up do
    add_column :users, :database_schema, :text, default: 'public'
  end

  down do
    drop_column :users, :database_schema
  end
end
