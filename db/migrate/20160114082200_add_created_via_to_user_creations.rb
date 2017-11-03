Sequel.migration do
  up do
    add_column :user_creations, :created_via, :text, null: false, default: 'org_signup'
    SequelRails.connection.run("update user_creations set created_via = 'api' where created_via_api = 'true'")
  end

  down do
    drop_column :user_creations, :created_via
  end
end
