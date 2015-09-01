Sequel.migration do
  up do
    drop_column :ldap_configurations, :username_field
    add_column :ldap_configurations, :username_field, :text, null: false
    drop_column :ldap_configurations, :email_field
    add_column :ldap_configurations, :email_field, :text, null: true
  end
  
  down do
    drop_column :ldap_configurations, :username_field
    add_column :ldap_configurations, :username_field, :text, null: true
    drop_column :ldap_configurations, :email_field
    add_column :ldap_configurations, :email_field, :text, null: false
  end
end
