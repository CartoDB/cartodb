class AddAdminFlagToUsersMigration < Sequel::Migration
  def up
    add_column :users, :admin, :boolean
  end

  def down
    drop_column :users, :admin
  end
end
