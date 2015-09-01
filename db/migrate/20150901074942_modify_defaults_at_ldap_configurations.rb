Sequel.migration do
  up do
    drop_column :ldap_configurations, :username_field
    add_column :ldap_configurations, :username_field, :text, null: false
  end
  
  down do
  end
end
