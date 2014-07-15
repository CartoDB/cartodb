Sequel.migration do
  up do
    add_column :organizations, :auth_token, :text
    add_column :users, :auth_token, :text
  end

  down do
    drop_column :organizations, :auth_token
    drop_column :users, :auth_token
  end
end
