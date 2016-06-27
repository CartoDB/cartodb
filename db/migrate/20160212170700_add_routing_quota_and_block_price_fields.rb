Sequel.migration do
  up do
    add_column :users, :here_isolines_quota, :integer, null: false, default: 0
    add_column :users, :here_isolines_block_price, :integer
    add_column :users, :soft_here_isolines_limit, :boolean
    add_column :organizations, :here_isolines_quota, :integer, null: false, default: 0
    add_column :organizations, :here_isolines_block_price, :integer
    add_column :user_creations, :soft_here_isolines_limit, :boolean
  end

  down do
    drop_column :users, :here_isolines_quota
    drop_column :users, :here_isolines_block_price
    drop_column :users, :soft_here_isolines_limit
    drop_column :organizations, :here_isolines_quota
    drop_column :organizations, :here_isolines_block_price
    drop_column :user_creations, :soft_here_isolines_limit
  end
end
