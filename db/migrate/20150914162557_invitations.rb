Sequel.migration do
  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :invitations do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      # users_emails shouldn't allow null. See Carto::Invitation.
      String :users_emails, type: 'text[]', null: true
      String :welcome_text, type: 'text', null: false
      DateTime  :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end
  end
  
  down do
    drop_table :invitations
  end
end
