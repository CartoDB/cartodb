class RemoveStoredSchemaFromUserTablesMigration < Sequel::Migration

  def up
    drop_column :user_tables, :stored_schema
  end

  def down
    add_column :user_tables, :stored_schema, 'character varying[]'
  end

end
