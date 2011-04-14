class AddDatabaseNameToUserTablesMigration < Sequel::Migration

  def up
    add_column :user_tables, :database_name, String
  end

  def down
    drop_column :user_tables, :database_name
  end

end
