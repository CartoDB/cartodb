Sequel.migration do
  up do
    create_table :logs do

      Uuid        :id,          primary_key: true, null: false, unique: false, default: 'uuid_generate_v4()'.lit
      Text        :type
      Uuid        :user_id,     null: false
      DateTime    :created_at,  default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at,  default: Sequel::CURRENT_TIMESTAMP
      Text        :entries

    end
  end

  down do
    drop_table :logs
  end
end
