Sequel.migration do
  up do
    set_column_type :organizations, :quota_in_bytes, :bigint
  end
  
  down do
    set_column_type :organizations, :quota_in_bytes, :integer
  end
end
