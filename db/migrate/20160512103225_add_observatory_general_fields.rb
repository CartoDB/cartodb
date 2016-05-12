Sequel.migration do
  up do
    add_column :users, :obs_general_quota, :integer, null: false, default: 0
    add_column :users, :obs_general_block_price, :integer
    add_column :users, :soft_obs_general_limit, :boolean
    add_column :organizations, :obs_general_quota, :integer, null: false, default: 0
    add_column :organizations, :obs_general_block_price, :integer
    add_column :user_creations, :soft_obs_general_limit, :boolean
  end

  down do
    drop_column :users, :obs_general_quota
    drop_column :users, :obs_general_block_price
    drop_column :users, :soft_obs_general_limit
    drop_column :organizations, :obs_general_quota
    drop_column :organizations, :obs_general_block_price
    drop_column :user_creations, :soft_obs_general_limit
  end
end