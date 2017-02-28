Sequel.migration do
  up do
    add_column :user_tables, :name_alias, :text
    add_column :user_tables, :column_aliases, :json
  end

  down do
    drop_column :user_tables, :name_alias
    drop_column :user_tables, :column_aliases
  end
end
