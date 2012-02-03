class AddQuotaToUserMigration < Sequel::Migration

  def up
    add_column :users, :table_quota, :bigint, :default => 5
    add_column :users, :account_type, String, :default => 'FREE'
  end

  def down
    drop_column :users, :quota_in_bytes
    drop_column :users, :account_type    
  end

end
