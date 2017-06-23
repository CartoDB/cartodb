Sequel.migration do
  up do
    alter_table :organizations do
      # This is coupled to users.quota_in_bytes default value, but otherwise estimation of organization quota limit is too hard
      SequelRails.connection.run("update organizations set default_quota_in_bytes = '104857600' where default_quota_in_bytes is null")
      set_column_default(:default_quota_in_bytes, 104857600)
      set_column_not_null(:default_quota_in_bytes)
    end
  end

  down do
    alter_table :organizations do
      set_column_allow_null(:default_quota_in_bytes)
      set_column_default(:default_quota_in_bytes, nil)
    end
  end
end
