class AddSchemaToTablesMigration < Sequel::Migration

  def up
    add_column :user_tables, :stored_schema, 'character varying[]'
  end

  def down
    drop_column :user_tables, :stored_schema
  end

end
