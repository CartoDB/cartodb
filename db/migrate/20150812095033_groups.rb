Sequel.migration do
  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :groups do
      Uuid      :id,                primary_key: true, default: 'uuid_generate_v4()'.lit
      # INFO: name is the name of the group from a database point of view
      String    :name,              null: false
      # INFO: display_name is the name of the group from a user point of view
      String    :display_name,      null: false
      # INFO: database_role is the PostgreSQL role. It should not be needed from editor, stored as preventive measure
      String    :database_role,     null: false
      Uuid      :organization_id,   null: false
      DateTime  :created_at,        default: Sequel::CURRENT_TIMESTAMP
      DateTime  :updated_at,        default: Sequel::CURRENT_TIMESTAMP
    end

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE "groups"
        ADD CONSTRAINT  groups_organization_id_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
      })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE "groups"
        ADD CONSTRAINT groups_organization_id_name_uq
        UNIQUE (organization_id, name)
    })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE "groups"
        ADD CONSTRAINT groups_organization_id_database_role_uq
        UNIQUE (organization_id, database_role)
    })

    create_table :users_groups do
      Uuid    :id,              primary_key: true, default: 'uuid_generate_v4()'.lit
      Uuid    :user_id,         null: false
      Uuid    :group_id,        null: false
    end

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE "users_groups"
        ADD CONSTRAINT  users_groups_user_id_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE "users_groups"
        ADD CONSTRAINT  users_groups_group_id_fk
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
      })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE "users_groups"
        ADD CONSTRAINT users_groups_user_id_group_id_uq
        UNIQUE (user_id, group_id)
    })

  end
  
  down do
    drop_table :groups
  end
end
