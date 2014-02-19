Sequel.migration do
  up do
    add_column :visualizations, :encrypted_password, String
    add_column :visualizations, :password_salt, String
  end

  down do
    drop_column :visualizations, :encrypted_password
    drop_column :visualizations, :password_salt
  end
end
