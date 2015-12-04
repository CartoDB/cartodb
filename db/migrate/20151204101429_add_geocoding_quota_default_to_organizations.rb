Sequel.migration do
  up do
    alter_table(:organizations) do
      set_column_default :geocoding_quota, 0
      set_column_not_null :geocoding_quota
    end
  end

  down do
    alter_table(:organizations) do
      set_column_allow_null :geocoding_quota
      set_column_default :geocoding_quota, nil
    end
  end
end
