Sequel.migration do
  up do
    add_column :users, :google_sign_in, :boolean, default: false
  end
  down do
    drop_column :users, :google_sign_in
  end
end
