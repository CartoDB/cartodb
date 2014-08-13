Sequel.migration do
  up do
    add_column :users, :soft_twitter_datasource_limit, :boolean, default: false
  end

  down do
    remove_column :users, :soft_twitter_datasource_limit
  end
end
