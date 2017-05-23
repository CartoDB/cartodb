Sequel.migration do

  CONFIG_DATABASE_HOST = ::SequelRails.configuration.environment_for(Rails.env)['host']

  up do
    add_column :users, :database_host, String
    SequelRails.connection.run(%Q{
      UPDATE users
      SET database_host='#{CONFIG_DATABASE_HOST}'
      WHERE database_host IS NULL
    })
  end

  down do
    drop_column :users, :database_host
  end
end
