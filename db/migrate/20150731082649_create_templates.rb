Sequel.migration do

  up do
    Rails::Sequel::connection.run 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'

    create_table :templates do
      Uuid        :id,                      primary_key: true, null: false, unique: false, default: 'uuid_generate_v4()'.lit
      Uuid        :source_visualization_id, null: false
      String      :title,                   null: false
      String      :description,             null: false, default: ''
      String      :min_supported_version,   null: false, default: ''
      String      :max_supported_version,   null: false, default: ''
      String      :code,                    null: false, default: ''
      Uuid        :organization_id,         null: false
      String      :required_tables_list,    null: false, default: ''
      DateTime    :created_at,              null: false, default: Sequel::CURRENT_TIMESTAMP
    end

    debugger
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE "templates"
        ADD CONSTRAINT  source_visualization_id_fkey
        FOREIGN KEY (source_visualization_id)
        REFERENCES visualizations(id)
        ON DELETE CASCADE
      })

    Rails::Sequel.connection.run(%Q{
      ALTER TABLE "templates"
        ADD CONSTRAINT  organization_id_fkey
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
      })

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX organization_id_idx ON templates(organization_id)
    })

    Rails::Sequel.connection.run(%Q{
      CREATE INDEX source_visualization_id_idx ON templates(source_visualization_id)
    })

  end

  down do
    drop_table :templates
  end

end
