Sequel.migration do
    up do
        add_column :user_tables, :alias, :text
        add_column :user_tables, :alias_columns, :text
    end

    down do
        drop_column :user_tables, :alias
        drop_column :user_tables, :alias_columns
    end
end