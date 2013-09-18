Sequel.migration do 
  change do

    create_table :geocodings do
      primary_key :id
      Integer     :user_id
      Text        :table_name
      Integer     :total_rows
      Integer     :processed_rows
      DateTime    :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end

  end
end
