Sequel.migration do
  change do
    create_table :user_notifications do
      foreign_key :user_id, :users, type: :uuid, null: false, on_delete: :cascade, primary_key: true
      String :notifications, null: false, type: 'json', default: '{}'
    end
  end
end
