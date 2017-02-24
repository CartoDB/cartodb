Sequel.migration do
  up do
    add_column :user_tables, :aliases, :text
  end

  down do
    drop_column :user_tables, :aliases
  end
end
