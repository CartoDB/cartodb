Sequel.migration do
  up do
    create_table :permissions do
      primary_key :id
      uuid        :owner_id,            index: true
      Text        :owner_username
      Text        :access_control_list, default: '[]'
      DateTime    :created_at,          default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at,          default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :permissions
  end
end
