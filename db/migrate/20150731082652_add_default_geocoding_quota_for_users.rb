Sequel.migration do
  up do
    SequelRails.connection.run(%Q{
      UPDATE users SET geocoding_quota = 0 WHERE geocoding_quota IS NULL
    })
    alter_table :users do
        set_column_not_null(:geocoding_quota)
        set_column_default(:geocoding_quota, 0)
    end
  end
  
  down do
    alter_table :users do
        set_column_allow_null(:geocoding_quota)
        set_column_default(:geocoding_quota, nil)
    end
  end
end
