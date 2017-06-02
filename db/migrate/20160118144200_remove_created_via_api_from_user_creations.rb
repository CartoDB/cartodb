Sequel.migration do
  up do
    drop_column :user_creations, :created_via_api
  end

  down do
    add_column :user_creations, :created_via_api, :boolean, null: false, default: false
    SequelRails.connection.run("update user_creations set created_via_api = 'true' where created_via = 'api'")
  end
end
