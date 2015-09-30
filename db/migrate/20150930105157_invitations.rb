Sequel.migration do
  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :invitations do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      # users_emails shouldn't allow null. See Carto::Invitation.
      column :users_emails, 'text[]', null: true
      column :used_emails, 'text[]', null: true
      String :welcome_text, type: 'text', null: false
      String :seed, type: 'text', null: false
      DateTime  :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end

    alter_table :user_creations do
      add_column :invitation_token, :text, null: true
    end
  end
  
  down do
    drop_table :invitations

    alter_table :user_creations do
      drop_column :invitation_token
    end
  end
end
