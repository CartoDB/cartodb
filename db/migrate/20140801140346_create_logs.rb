Sequel.migration do
  up do
    create_table :logs do
      primary_key :id
      Text        :type
      Uuid        :user_id, null: false
      DateTime    :created_at, null: false
      DateTime    :updated_at, null: false
      Text        :entries
    end
  end

  down do
    drop_table :logs
  end
end
