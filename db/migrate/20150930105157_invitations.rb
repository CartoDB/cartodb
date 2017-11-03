Sequel.migration do
  up do
    SequelRails::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :invitations do
      Uuid :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      Uuid :organization_id, null: false
      Uuid :inviter_user_id, null: false
      # users_emails shouldn't allow null. See Carto::Invitation.
      column :users_emails, 'text[]', null: true
      column :used_emails, 'text[]', null: true
      String :welcome_text, type: 'text', null: false
      String :seed, type: 'text', null: false
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
      DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
    end

    SequelRails.connection.run(%{
      ALTER TABLE "invitations"
        ADD CONSTRAINT invitations_organization_id_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
      })

    SequelRails.connection.run(%{
      ALTER TABLE "invitations"
        ADD CONSTRAINT invitations_inviter_user_id_fk
        FOREIGN KEY (inviter_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      })

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
