Sequel.migration do
  up do
    add_column :users, :mapzen_routing_quota, :integer
    add_column :users, :mapzen_routing_block_price, :integer
    add_column :users, :soft_mapzen_routing_limit, :boolean
    add_column :organizations, :mapzen_routing_quota, :integer
    add_column :organizations, :mapzen_routing_block_price, :integer
    add_column :user_creations, :soft_mapzen_routing_limit, :boolean
  end

  down do
    drop_column :users, :mapzen_routing_quota
    drop_column :users, :mapzen_routing_block_price
    drop_column :users, :soft_mapzen_routing_limit
    drop_column :organizations, :mapzen_routing_quota
    drop_column :organizations, :mapzen_routing_block_price
    drop_column :user_creations, :soft_mapzen_routing_limit
  end
end
