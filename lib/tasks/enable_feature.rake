namespace :cartodb do
  namespace :features do
    desc "enable feature for all users"
    task :enable_feature_for_all_users, [:feature] => :environment do |t, args|
      
      ff = FeatureFlag[:name => args[:feature]]
      if ff.nil?
        except 'Feature', args[:feature]
        break
      end

      User.all.each do |user|
        if FeatureFlagsUser[feature_flag_id: ff.id, user_id: user.id].nil?
            FeatureFlagsUser.new(feature_flag_id: ff.id, user_id: user.id).save
        end
      end
    end

    desc "enable feature for a given user"
    task :enable_feature_for_user, [:feature, :username] => :environment do |t, args|
      
      ff = FeatureFlag[:name => args[:feature]]
      if ff.nil?
        except 'Feature', args[:feature]
        break
      end

      user = User[username: args[:username]] 
      if user.nil?
        except 'User', args[:username]
        break
      end

      if FeatureFlagsUser[feature_flag_id: ff.id, user_id: user.id].nil?
        FeatureFlagsUser.new(feature_flag_id: ff.id, user_id: user.id).save
      else
        puts "[INFO]  Feature '#{args[:feature]}' was already enabled for user '#{args[:username]}'"
      end
    end

    desc "enable feature for a given organization"
    task :enable_feature_for_organization, [:feature, :org_name] => :environment do |t, args|
      
      ff = FeatureFlag[:name => args[:feature]]
      if ff.nil?
        except 'Feature', args[:feature]
        break
      end

      organization = Organization[name: args[:org_name]] 
      if organization.nil?
        except 'Organization', args[:org_name]
        break
      end

      organization.users.each do |user|
        if FeatureFlagsUser[feature_flag_id: ff.id, user_id: user.id].nil?
            FeatureFlagsUser.new(feature_flag_id: ff.id, user_id: user.id).save
        end
      end
    end

    desc "disable feature for all users"
    task :disable_feature_for_all_users, [:feature] => :environment do |t, args|
      
      ff = FeatureFlag[:name => args[:feature]]
      if ff.nil?
        except 'Feature', args[:feature]
        break
      end

      ffus = FeatureFlagsUser[:feature_flag_id => ff.id]
      if ffus.nil?
        puts "[INFO]  No users had feature '#{args[:feature]}' enabled"
      else
        ffus.destroy
      end
    end

    desc "disable feature for a given user"
    task :disable_feature_for_user, [:feature, :username] => :environment do |t, args|
      
      ff = FeatureFlag[:name => args[:feature]]
      if ff.nil?
        except 'Feature', args[:feature]
        break
      end

      user = User[username: args[:username]]
      if user.nil?
        except 'User', args[:username]
        break
      end

      if FeatureFlagsUser[feature_flag_id: ff.id, user_id: user.id].nil?
        puts "[INFO]  Feature '#{args[:feature]}' was already disabled for user '#{args[:username]}'"
      else
        FeatureFlagsUser[feature_flag_id: ff.id, user_id: user.id].destroy
      end
    end

    desc "disable feature for a given organization"
    task :disable_feature_for_organization, [:feature, :org_name] => :environment do |t, args|
      
      ff = FeatureFlag[:name => args[:feature]]
      if ff.nil?
        except 'Feature', args[:feature]
        break
      end

      organization = Organization[name: args[:org_name]] 
      if organization.nil?
        except 'Organization', args[:org_name]
        break
      end

      organization.users.each do |user|
        if FeatureFlagsUser[feature_flag_id: ff.id, user_id: user.id].nil?
          puts "[INFO]  Feature '#{args[:feature]}' was already disabled for user '#{args[:username]}'"
        else
          FeatureFlagsUser[feature_flag_id: ff.id, user_id: user.id].destroy
        end
      end
    end

    desc "list all features"
    task :list_all_features => :environment do

      puts "Available features:"
      FeatureFlag.all.each do |feature|
        puts "  - #{feature.name}"
      end
    end

    private
    def except(type, value)
      puts "[ERROR] #{type} '#{value}' does not exist"
    end

  end # Features
end # CartoDB
