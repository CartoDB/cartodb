Sequel.migration do
  up do
    create_table :synchronization_oauths do
      primary_key :id
      Uuid        :user_id,     index: true
      Text        :service,     index: true
      Text        :token
      DateTime    :created_at,  default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at,  default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :synchronization_oauths
  end
end
