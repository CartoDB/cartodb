class AddPrivateTablesToUserMigration < Sequel::Migration
  def up
    add_column :users, :private_tables_enabled, :boolean, :default => false
  end

  def down
    drop_column :users, :private_tables_enabled  
  end
end
