Sequel.migration do
  up do
    add_column :user_creations, :created_via, :text, null: false, default: 'org_signup'
    Rails::Sequel.connection.run("update user_creations set created_via = 'api' where created_via_api = 'true'")

    drop_column :user_creations, :created_via_api
  end

  down do
    add_column :user_creations, :created_via_api, :boolean, null: false, default: false
    Rails::Sequel.connection.run("update user_creations set created_via_api = 'true' where created_via = 'api'")

    drop_column :user_creations, :created_via
  end
end
