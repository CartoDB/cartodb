# encoding utf-8

Sequel.migration do

  up do

    alter_table :organizations do
      add_column :default_geocoding_quota, :integer
      add_column :default_soft_geocoding_limit, :boolean, default: false, null: false
      add_column :default_twitter_datasource_quota, :integer
      add_column :default_soft_twitter_datasource_limit, :boolean, default: false, null: false
    end

  end

  down do

    alter_table :organizations do
      drop_column :default_soft_twitter_datasource_limit
      drop_column :default_twitter_datasource_quota
      drop_column :default_soft_geocoding_limit
      drop_column :default_geocoding_quota
    end

  end

end
