namespace :cartodb do
  namespace :features do

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "enable feature for all users"
    task :enable_feature_for_all_users, [:feature] => :environment do |t, args|

      ff = Carto::FeatureFlag.find_by(name: args[:feature])
      raise "[ERROR]  Feature '#{args[:feature]}' does not exist" if ff.nil?

      Carto::User.find_each do |user|
        if !Carto::FeatureFlagsUser.exists?(feature_flag: ff, user: user)
          user.activate_feature_flag!(ff)
          track_feature_flag_state(user.id, args[:feature], 'enabled')
        end
      end
    end

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "enable feature for a given user"
    task :enable_feature_for_user, [:feature, :username] => :environment do |t, args|

      ff = Carto::FeatureFlag.find_by(name: args[:feature])
      raise "[ERROR]  Feature '#{args[:feature]}' does not exist" if ff.nil?

      user = Carto::User.find_by(username: args[:username])
      raise "[ERROR]  User '#{args[:username]}' does not exist" if user.nil?

      if !Carto::FeatureFlagsUser.exists?(feature_flag: ff, user: user)
        user.activate_feature_flag!(ff)
        track_feature_flag_state(user.id, args[:feature], 'enabled')
      else
        puts "[INFO]  Feature '#{args[:feature]}' was already enabled for user '#{args[:username]}'"
      end
    end

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "enable feature for a given organization"
    task :enable_feature_for_organization, [:feature, :org_name] => :environment do |t, args|

      ff = Carto::FeatureFlag.find_by(name: args[:feature])
      raise "[ERROR]  Feature '#{args[:feature]}' does not exist" if ff.nil?

      organization = Carto::Organization.find_by(name: args[:org_name])
      raise "[ERROR]  Organization '#{args[:org_name]}' does not exist" if organization.nil?

      organization.users.each do |user|
        if !Carto::FeatureFlagsUser.exists?(feature_flag: ff, user: user)
          user.activate_feature_flag!(ff)
          track_feature_flag_state(user.id, args[:feature], 'enabled')
        end
      end
    end

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "disable feature for all users"
    task :disable_feature_for_all_users, [:feature] => :environment do |t, args|

      ff = Carto::FeatureFlag.find_by(name: args[:feature])
      raise "[ERROR]  Feature '#{args[:feature]}' does not exist" if ff.nil?

      ffus = Carto::FeatureFlagsUser.where(feature_flag: ff)
      if ffus.nil?
        puts "[INFO]  No users had feature '#{args[:feature]}' enabled"
      else
        ffus.destroy_all
      end
    end

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "disable feature for a given user"
    task :disable_feature_for_user, [:feature, :username] => :environment do |t, args|

      ff = Carto::FeatureFlag.find_by(name: args[:feature])
      raise "[ERROR]  Feature '#{args[:feature]}' does not exist" if ff.nil?

      user = Carto::User.find_by(username: args[:username])
      raise "[ERROR]  User '#{args[:username]}' does not exist" if user.nil?

      if !Carto::FeatureFlagsUser.exists?(feature_flag: ff, user: user)
        puts "[INFO]  Feature '#{args[:feature]}' was already disabled for user '#{args[:username]}'"
      else
        Carto::FeatureFlagsUser.where(feature_flag: ff, user: user).destroy_all
        track_feature_flag_state(user.id, args[:feature], 'disabled')
      end
    end

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "disable feature for a given organization"
    task :disable_feature_for_organization, [:feature, :org_name] => :environment do |t, args|

      ff = Carto::FeatureFlag.find_by(name: args[:feature])
      raise "[ERROR]  Feature '#{args[:feature]}' does not exist" if ff.nil?

      organization = Carto::Organization.find_by(name: args[:org_name])
      raise "[ERROR]  Organization '#{args[:org_name]}' does not exist" if organization.nil?

      organization.users.each do |user|
        if !Carto::FeatureFlagsUser.exists?(feature_flag: ff, user: user)
          puts "[INFO]  Feature '#{args[:feature]}' was already disabled for user '#{args[:username]}'"
        else
          Carto::FeatureFlagsUser.where(feature_flag: ff, user: user).destroy_all
          track_feature_flag_state(user.id, args[:feature], 'disabled')
        end
      end
    end

    def track_feature_flag_state(user_id, feature, state)
      properties = {
        user_id: user_id,
        feature_flag: {
          feature: feature,
          state: state
        }
      }

      Carto::Tracking::Events::UpdatedFeatureFlag.new(user_id, properties).report
    end

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "add feature flag and optionally set restricted (default is true)"
    task :add_feature_flag, [:feature, :restricted] => :environment do |_task, args|
      restricted = args[:restricted] ? args[:restricted].casecmp('false') != 0 : true

      ff = Carto::FeatureFlag.find_by(name: args[:feature])
      if !ff
        ff = Carto::FeatureFlag.new(name: args[:feature], restricted: restricted)
        ff.id = Carto::FeatureFlag.any? ? Carto::FeatureFlag.order(:id).last.id + 1 : 0
        ff.save

        puts "[INFO]\tFeature flag '#{args[:feature]}' created and restricted set to '#{ff.restricted}'"
      else
        raise "[ERROR]\tFeature '#{args[:feature]}' already exists and its restricted set to '#{ff.restricted}'"
      end
    end

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "change feature flag to restricted or unrestricted"
    task :change_feature_restricted, [:feature, :restricted] => :environment do |_task, args|
      restricted = args[:restricted] ? args[:restricted].casecmp('false') != 0 : true

      ff = Carto::FeatureFlag.find_by(name: args[:feature])
      if ff
        ff.restricted = restricted
        ff.save

        puts "[INFO]\tFeature flag '#{args[:feature]}' restricted set to '#{ff.restricted}'"
      else
        raise "[ERROR]\tFeature '#{args[:feature]}' doesn't exist"
      end
    end

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "remove feature flag"
    task :remove_feature_flag, [:feature] => :environment do |t, args|

      ff = Carto::FeatureFlag.find_by(name: args[:feature])
      raise "[ERROR]  Feature '#{args[:feature]}' does not exist" if ff.nil?

      ffus = Carto::FeatureFlagsUser.where(feature_flag: ff)
      if ffus.nil?
        puts "[INFO]  No users had feature '#{args[:feature]}' enabled"
      else
        ffus.destroy_all
      end

      ff.destroy()
    end

    # WARNING: For use only at development, opensource and custom installs.
    # Refer to https://github.com/CartoDB/cartodb-management/wiki/Feature-Flags
    desc "list all features"
    task :list_all_features => :environment do

      puts "Available features:"
      Carto::FeatureFlag.find_each do |feature|
        puts "  - #{feature.name}"
      end
    end

  end # Features
end # CartoDB
