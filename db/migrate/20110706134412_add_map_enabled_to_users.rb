class AddMapEnabledToUsersMigration < Sequel::Migration

  def up
    add_column :users, :map_enabled, :boolean, :default => true
  end

  def down
    drop_column :users, :map_enabled
  end

end
