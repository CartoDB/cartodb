Sequel.migration do
  up do
    add_column :users, :obs_snapshot_quota, :integer, null: false, default: 0
    add_column :users, :obs_snapshot_block_price, :integer
    add_column :users, :soft_obs_snapshot_limit, :boolean
    add_column :organizations, :obs_snapshot_quota, :integer, null: false, default: 0
    add_column :organizations, :obs_snapshot_block_price, :integer
    add_column :user_creations, :soft_obs_snapshot_limit, :boolean
  end

  down do
    drop_column :users, :obs_snapshot_quota
    drop_column :users, :obs_snapshot_block_price
    drop_column :users, :soft_obs_snapshot_limit
    drop_column :organizations, :obs_snapshot_quota
    drop_column :organizations, :obs_snapshot_block_price
    drop_column :user_creations, :soft_obs_snapshot_limit
  end
end
