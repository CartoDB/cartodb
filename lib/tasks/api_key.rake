namespace :carto do
  namespace :api_key do
    module ApiKeyRake
      def for_each_api_key(query, description)
        all_count = query.count
        current_count = 0
        reflection_seconds = ENV['ENABLE_FF_REFLECTION_SECONDS'] || 10

        puts "############################"
        puts "#"
        puts "# #{description}"
        puts "#"
        puts "# #{all_count} api keys will be processed"
        puts "#"
        puts "# You have #{reflection_seconds} seconds to cancel "
        puts "# the task before it starts"
        puts "#"
        puts "############################"

        sleep reflection_seconds.to_i

        query.find_each do |api_key|
          begin
            current_count += 1
            puts "#{current_count} of #{all_count}"

            yield api_key
          rescue StandardError => e
            puts "ERROR - API Key #{api_key.id}: #{e}"
          end
        end
      end

      def create_api_keys_for_user(carto_user)
        if carto_user.api_keys.master.empty?
          puts "INFO: Creating master API Key for user #{carto_user.username}"
          carto_user.api_keys.create_master_key!
        end

        if carto_user.api_keys.default_public.empty?
          puts "INFO: Creating default public API Key for user #{carto_user.username}"
          carto_user.api_keys.create_default_public_key!
        end
      end

      def rename_api_keys_for_user_id(user_id)
        Carto::ApiKey.where(user_id: user_id).each do |api_key|
          api_key.reload
          n = 1
          Carto::ApiKey.where(name: api_key.name).where('id != ?', api_key.id).each do |renamed_api_key|
            renamed_api_key.update_column(:name, "#{renamed_api_key.name} #{n}")
            n += 1
          end
        end
      end
    end

    # This should only be used for development, before CartoDB/cartodb/pull/13396 migration
    desc 'Rename Api Keys to avoid name collisions within the same user'
    task rename: :environment do
      include ApiKeyRake
      Carto::ApiKey.uniq.pluck(:user_id).each { |user_id| rename_api_keys_for_user_id(user_id) }
    end

    desc 'Creates default API Keys for user'
    task :create_default_for_emails, [:emails_file] => [:environment] do |_, args|
      line = 0
      File.foreach(args[:emails_file]) do |email|
        email.strip!
        line += 1

        unless email =~ /.*@.*\..*/
          puts "Row #{line} is not an email: #{email}"
          next
        end

        user = User.first(email: email)

        if user.nil?
          puts "WARN: User #{email} not found"
        else
          begin
            user.create_api_keys
            puts "INFO: Api Keys created for #{user.email}"
          rescue StandardError => e
            puts "WARN: Unable to create api keys for user with email #{email}: #{e}"
          end
        end
      end
    end

    desc 'Creates default API Keys for users who don\'t have them yet'
    task create_default: :environment do
      include ApiKeyRake
      Carto::User.joins('LEFT JOIN api_keys ON api_keys.user_id = users.id').where(api_keys: { id: nil }).find_each { |u| create_api_keys_for_user(u) }
    end

    desc 'Creates default API Keys for users who don\'t have them yet under given organization'
    task :create_default_for_organization, [:org_name] => [:environment] do |_, args|
      include ApiKeyRake
      puts "INFO: Creating default API Keys for all users in organization #{args[:org_name]}"
      org = Carto::Organization.find_by_name(args[:org_name])
      raise "ERROR: Organization not found" unless org
      org.users.each { |u| create_api_keys_for_user(u) }
    end

    desc 'Creates grants for every API Key'
    task create_api_key_grants: :environment do
      include ApiKeyRake
      MESSAGE = "Creating permissions for every API Key".freeze

      for_each_api_key(Carto::ApiKey, MESSAGE) do |api_key|
        if api_key.master?
          api_key.grants = Carto::ApiKey::MASTER_API_KEY_GRANTS
          api_key.save!
        else
          api_key.save_cdb_conf_info
        end
      end
    end
  end
end
