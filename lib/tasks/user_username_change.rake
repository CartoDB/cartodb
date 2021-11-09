namespace :cartodb do
  namespace :user do
    desc 'Change user username'
    task :change_username, [:old_username, :new_username] => :environment do |_task, args|
      raise "You must pass an existing username, and a new username for the existing user" unless args[:old_username] && args[:new_username]

      user = User.find(username: args[:old_username])
      raise "User with username #{args[:old_username]} doesn't exist!" unless user

      # Update username and database_schema
      user.username = args[:new_username]
      user.database_schema = args[:new_username]
      user.save

      # Update Redis metadata
      user.save_metadata

      # Rename user and database schema
      user.in_database(as: :superuser) { |db|
        db.run("ALTER SCHEMA \"#{args[:old_username]}\" RENAME TO \"#{args[:new_username]}\";")
      }

      # Regenerate API Keys
      user.carto_user.api_keys.find(&:master?).try(:regenerate_token!)

      # Fix map analysis
      user.carto_user.tables.each do |table|
        table.dependent_visualizations.each do |visualization|
          visualization.analyses.each do |analysis|
            analysis.update_table_name(
              "#{args[:old_username]}.#{table.name}",
              "\"#{args[:new_username]}\".#{table.name}"
            )
          end
        end
      end

      # Fix public maps
      Carto::Visualization.where(type: 'derived', user: user.carto_user).select(&:published?).each { |visualization| visualization.create_mapcap! }
    end
  end
end
