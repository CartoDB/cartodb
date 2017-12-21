Sequel.migration do
  up do
    add_column :organizations, :strong_passwords_enabled, :boolean, null: false, default: false
  end

  down do
    drop_column :organizations, :strong_passwords_enabled
  end
end
