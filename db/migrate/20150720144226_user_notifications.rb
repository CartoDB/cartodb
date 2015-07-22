Sequel.migration do
  up do
    create_table :user_notifications do
      Uuid      :id,                primary_key: true, null: false, unique: false, default: 'uuid_generate_v4()'.lit
      foreign_key :user_id, :users, type: 'uuid', null: false
      Boolean   :map_like, null: false, default: true
      Boolean   :share_table, null: false, default: true
      Boolean   :share_visualization, null: false, default: true
      Boolean   :unshare_table, null: false, default: true
      Boolean   :unshare_visualization, null: false, default: true
      Boolean   :data_import, null: false, default: true
      Boolean   :geocode, null: false, default: true
      DateTime  :created_at,        default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at,        default: Sequel::CURRENT_TIMESTAMP
    end
  end

  down do
    drop_table :user_notifications
  end

end
