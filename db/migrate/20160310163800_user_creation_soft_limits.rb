Sequel.migration do
  up do
    add_column :user_creations, :soft_twitter_datasource_limit, :boolean, null: false, default: false
    Rails::Sequel.connection.run('ALTER TABLE user_creations ALTER COLUMN soft_geocoding_limit set not null;')
    Rails::Sequel.connection.run('ALTER TABLE user_creations ALTER COLUMN soft_geocoding_limit set default false;')
  end

  down do
    Rails::Sequel.connection.run('ALTER TABLE user_creations ALTER COLUMN soft_geocoding_limit drop not null;')
    Rails::Sequel.connection.run('ALTER TABLE user_creations ALTER COLUMN soft_geocoding_limit drop default;')
    drop_column :user_creations, :soft_twitter_datasource_limit
  end
end
