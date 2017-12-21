class AddEnabledFieldToUsersMigration < Sequel::Migration

  def up
    add_column :users, :enabled, :boolean, :default => false
  end

  def down
    drop_column :users, :enabled
  end

end
