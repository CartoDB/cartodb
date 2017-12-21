Sequel.migration do

  up do
    create_table :feature_flags do
      Integer     :id,                  primary_key: true
      Text        :name,                null: false, unique: true
      TrueClass   :restricted,          default: true, null: false
      DateTime    :created_at,          default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at,          default: Sequel::CURRENT_TIMESTAMP
    end

    create_table :feature_flags_users do
      primary_key :id
      foreign_key :feature_flag_id, :feature_flags, null: false
      foreign_key :user_id, :users, null: false, type: 'uuid'
      DateTime    :created_at,          default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at,          default: Sequel::CURRENT_TIMESTAMP
    end

    alter_table(:feature_flags_users) do
      add_index [:user_id, :feature_flag_id], :unique => true
    end
  end

  down do
    drop_table :feature_flags_users
    drop_table :feature_flags
  end

end
