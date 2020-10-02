class AddQuotaToUserMigration < Sequel::Migration

  def up
    add_column :users, :quota_in_bytes, :bigint, default: 104_857_600
  end

  def down
    drop_column :users, :quota_in_bytes
  end

end
