require_relative '../../lib/carto/configuration'
require_relative '../../config/initializers/sequel.rb'
require_relative '../../app/models/carto/helpers/auth_token_generator'
require_relative '../../app/models/carto/carto_json_serializer.rb'
require_relative '../../app/models/carto/api_key'

namespace :carto do
  namespace :api_key do
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

    # This should only be used for development, before CartoDB/cartodb/pull/13396 migration
    desc 'Rename Api Keys to avoid name collisions within the same user'
    task :rename do
      Carto::ApiKey.uniq.pluck(:user_id).each { |user_id| rename_api_keys_for_user_id(user_id) }
    end
  end
end
