Sequel.migration do
  change do
    alter_table :organizations do
      add_column :auth_username_password_enabled, :boolean, null: false, default: true
      add_column :auth_google_enabled, :boolean, null: false, default: true
    end
  end
end
