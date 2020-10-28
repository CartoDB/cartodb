namespace :cartodb do
  namespace :services do
    namespace :external do
      namespace :google do
        def add_feature_flag_if_not_exists(name, restricted = true)
          ff = Carto::FeatureFlag.where(name: name).first

          if ff.nil?
            ff = Carto::FeatureFlag.new(name: name, restricted: restricted)

            ff.id = Carto::FeatureFlag.order(:id).last.id + 1
            ff.restricted = restricted
          elsif ff.restricted != restricted
            ff.restricted = restricted
          end

          ff.save
        end

        def add_feature_flag_to_user(feature_name, user)
          ff = Carto::FeatureFlag.where(name: feature_name).first
          raise "No such feature flag '#{feature_name}'" if ff.nil?

          return if Carto::FeatureFlagsUser.where(feature_flag_id: ff.id, user_id: user.id).exists?

          user.activate_feature_flag!(ff)
        end

        def remove_feature_flag_from_user(feature_name, user)
          ff = Carto::FeatureFlag.where(name: feature_name).first
          raise "No such feature flag '#{feature_name}'" if ff.nil?

          ffu = Carto::FeatureFlagsUser.where(feature_flag_id: ff.id, user_id: user.id).first

          if ffu.nil?
            puts "[BUG] no feature flag user for feature '#{feature_name}' and '#{user.username}'"
          else
            ffu.destroy
          end
        end

        def remove_feature_flag_if_exists(name)
          ff = Carto::FeatureFlag.where(name: name).first

          ff.destroy unless ff.nil?
        end

        def prepend_client_equal_if_needed(key)
          key.downcase.start_with?('client=') ? key : "client=#{key}"
        end

        desc 'Enable Google Services for a given user'
        task :enable_for_user, [:google_maps_key, :google_maps_private_key, :username] => [:environment] do |_, args|
          add_feature_flag_if_not_exists('google_maps')

          user = ::User.where(username: args[:username]).first
          raise "No user with username '#{args[:username]}'" if user.nil?

          puts "Enabling 'google_maps' feature flag for user '#{user.username}'"
          add_feature_flag_to_user('google_maps', user)

          puts "Enabling google services for user '#{user.username}'..."
          user.google_maps_key = prepend_client_equal_if_needed(args[:google_maps_key])
          user.google_maps_private_key = args[:google_maps_private_key] unless args[:google_maps_private_key].blank?

          puts user.errors.full_messages unless user.save
        end

        desc 'Enable Google Services for an organization'
        task :enable_for_organization,
             [:google_maps_key, :google_maps_private_key, :org_name] => [:environment] do |_, args|
          add_feature_flag_if_not_exists('google_maps')

          organization = ::Organization.where(name: args[:org_name]).first

          raise "No organization with name '#{args[:org_name]}'" if organization.nil?

          puts "Enabling 'google_maps' feature flag for users in '#{organization.name}'"
          organization.users.each do |user|
            puts "\tenabling 'google_maps' feature flag for user '#{user.username}'"
            add_feature_flag_to_user('google_maps', user)
          end

          puts "Enabling google services for organization '#{organization.name}'..."
          organization.google_maps_key = prepend_client_equal_if_needed(args[:google_maps_key])

          unless args[:google_maps_private_key].blank?
            organization.google_maps_private_key = args[:google_maps_private_key]
          end

          puts organization.errors.full_messages unless organization.save
        end

        desc 'Enable Google Services for all users'
        task :enable_for_all, [:google_maps_key, :google_maps_private_key] => [:environment] do |_, args|
          add_feature_flag_if_not_exists('google_maps')

          ::Organization.all.each do |organization|
            puts "Enabling 'google_maps' feature flag for users in '#{organization.name}'"
            organization.users.each do |user|
              puts "\tenabling 'google_maps' feature flag for user '#{user.username}'"
              add_feature_flag_to_user('google_maps', user)
            end

            puts "Enabling google services for organization '#{organization.name}'..."
            organization.google_maps_key = prepend_client_equal_if_needed(args[:google_maps_key])

            unless args[:google_maps_private_key].blank?
              organization.google_maps_private_key = args[:google_maps_private_key]
            end

            puts organization.errors.full_messages unless organization.save
          end

          # For users not in organizations
          ::User.where(organization_id: nil).each do |user|
            puts "Enabling 'google_maps' feature flag for user '#{user.username}'"
            add_feature_flag_to_user('google_maps', user)

            puts "Enabling google services for non-organization user '#{user.username}'..."
            user.google_maps_key = prepend_client_equal_if_needed(args[:google_maps_key])
            user.google_maps_private_key = args[:google_maps_private_key] unless args[:google_maps_private_key].blank?

            puts user.errors.full_messages unless user.save
          end
        end

        desc 'Disable Google Services for a given user'
        task :disable_for_user, [:username] => [:environment] do |_, args|
          user = ::User.where(username: args[:username]).first

          raise "No user with username '#{args[:username]}'" if user.nil?

          puts "Removing 'google_maps' feature flag from user '#{user.username}'"
          remove_feature_flag_from_user('google_maps', user)

          puts "Disabling google services for user '#{user.username}'..."
          user.google_maps_key = nil
          user.google_maps_private_key = nil

          puts user.errors.full_messages unless user.save
        end

        desc 'Disable Google Services for an organization'
        task :disable_for_organization, [:org_name] => [:environment] do |_, args|
          organization = ::Organization.where(name: args[:org_name]).first

          raise "No organization with name '#{args[:org_name]}'" if organization.nil?

          puts "Removing 'google_maps' feature flag from users in '#{organization.name}'"
          organization.users.each do |user|
            puts "\tremoving 'google_maps' feature flag from user '#{user.username}'"
            remove_feature_flag_from_user('google_maps', user)
          end

          puts "Disabling google services for organization '#{organization.name}'..."
          organization.google_maps_key = nil
          organization.google_maps_private_key = nil

          puts organization.errors.full_messages unless organization.save
        end

        desc 'Disable Google Services for all users'
        task disable_for_all: [:environment] do |_|
          remove_feature_flag_if_exists('google_maps')

          ::Organization.all.each do |organization|
            puts "Disabling google services for organization '#{organization.name}'..."

            organization.google_maps_key = nil
            organization.google_maps_private_key = nil

            puts organization.errors.full_messages unless organization.save
          end

          # For users not in organizations
          ::User.where(organization_id: nil).each do |user|
            puts "Disabling google services for non-organization user '#{user.username}'..."

            user.google_maps_key = nil
            user.google_maps_private_key = nil

            puts user.errors.full_messages unless user.save
          end
        end
      end
    end
  end
end
