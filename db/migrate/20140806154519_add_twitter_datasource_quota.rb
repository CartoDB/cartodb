Sequel.migration do
  up do
    add_column :users, :twitter_datasource_quota, :integer, default: 0
    add_column :organizations, :twitter_datasource_quota, :integer, default: 0
  end

  down do
    drop_column :users, :twitter_datasource_quota
    drop_column :organizations, :twitter_datasource_quota
  end
end
