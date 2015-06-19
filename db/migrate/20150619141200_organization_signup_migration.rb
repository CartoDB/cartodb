# encoding utf-8

Sequel.migration do

  up do
    alter_table :users do
      add_column :enable_account_token, String
    end
  end

  down do
    alter_table :users do
      drop_column :enable_account_token
    end
  end

end
