Sequel.migration do
  up do
    add_column :organizations, :twitter_datasource_enabled, :boolean
    add_column :organizations, :twitter_datasource_block_price, :integer
    add_column :organizations, :twitter_datasource_block_size, :integer

    add_column :users, :twitter_datasource_enabled, :boolean
    add_column :users, :twitter_datasource_block_price, :integer
    add_column :users, :twitter_datasource_block_size, :integer
  end

  down do
    drop_column :organizations, :twitter_datasource_enabled
    drop_column :organizations, :twitter_datasource_block_price
    drop_column :organizations, :twitter_datasource_block_size

    drop_column :users, :twitter_datasource_enabled
    drop_column :users, :twitter_datasource_block_price
    drop_column :users, :twitter_datasource_block_size
  end
end
