FactoryBot.define do

  factory :user_migration_export, class: Carto::UserMigrationExport do
    user { user_id ? Carto::User.find(user_id) : nil }
    organization { organization_id ? Carto::Organization.find(organization_id) : nil }
    export_metadata { true }
    export_data { true }
  end

end
