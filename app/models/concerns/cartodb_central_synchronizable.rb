module Concerns
  module CartodbCentralSynchronizable

    # This validation can't be added to the model because if a user creation begins at Central we can't know if user is the same or existing
    def validate_credentials_not_taken_in_central
      return true unless self.is_a?(::User)
      return true unless Cartodb::Central.sync_data_with_cartodb_central?

      central_client = Cartodb::Central.new

      errors.add(:username, "Username taken") if central_client.get_user(self.username)['username'] == self.username
      errors.add(:email, "Email taken") if central_client.get_user(self.email)['email'] == self.email
      errors.empty?
    end

    def create_in_central
      return true unless sync_data_with_cartodb_central?
      if self.is_a?(::User)
        if organization.present?
          cartodb_central_client.create_organization_user(organization.name, allowed_attributes_to_central(:create))
        else
          CartoDB.notify_debug("User creations at box without organization are not notified to Central", user: self)
        end
      elsif self.is_a?(Organization)
        raise "Can't create organizations in editor"
      end
      return true
    end

    def update_in_central
      return true unless sync_data_with_cartodb_central?
      if self.is_a?(::User)
        if organization.present?
          cartodb_central_client.update_organization_user(organization.name, username, allowed_attributes_to_central(:update))
        else
          cartodb_central_client.update_user(username, allowed_attributes_to_central(:update))
        end
      elsif self.is_a?(Organization)
        cartodb_central_client.update_organization(name, allowed_attributes_to_central(:update))
      end
      return true
    end

    def delete_in_central
      return true unless sync_data_with_cartodb_central?
      if self.is_a?(::User)
        if organization.nil?
          cartodb_central_client.delete_user(self.username)
        else
          if self.organization.owner && self.organization.owner != self
            cartodb_central_client.delete_organization_user(organization.name, username)
          else
            raise "Can't destroy the organization owner"
          end
        end
      end
      return true
    end

    def allowed_attributes_from_central(action)
      if self.is_a?(Organization)
        case action
        when :create
          [:name, :seats, :quota_in_bytes, :display_name, :description, :website,
          :discus_shortname, :twitter_username, :geocoding_quota, :map_view_quota,
          :geocoding_block_price, :map_view_block_price,
          :twitter_datasource_enabled, :twitter_datasource_block_size,
          :twitter_datasource_block_price, :twitter_datasource_quota,
          :google_maps_key, :google_maps_private_key, :auth_username_password_enabled,
          :auth_google_enabled, :here_isolines_quota, :here_isolines_block_price,
          :obs_snapshot_quota, :obs_snapshot_block_price]
        when :update
          [:seats, :quota_in_bytes, :display_name, :description, :website,
          :discus_shortname, :twitter_username, :geocoding_quota, :map_view_quota,
          :geocoding_block_price, :map_view_block_price,
          :twitter_datasource_enabled, :twitter_datasource_block_size,
          :twitter_datasource_block_price, :twitter_datasource_quota,
          :google_maps_key, :google_maps_private_key, :auth_username_password_enabled,
          :auth_google_enabled, :here_isolines_quota, :here_isolines_block_price,
          :obs_snapshot_quota, :obs_snapshot_block_price]
        end
      elsif self.is_a?(::User)
        [:account_type, :admin, :crypted_password, :database_host,
         :database_timeout, :description, :disqus_shortname, :available_for_hire, :email,
         :geocoding_block_price, :geocoding_quota, :map_view_block_price,
         :map_view_quota, :max_layers, :max_import_file_size, :max_import_table_row_count, :max_concurrent_import_count,
         :name, :notification, :organization_id,
         :period_end_date, :private_tables_enabled, :quota_in_bytes, :salt,
         :sync_tables_enabled, :table_quota, :twitter_username, :upgraded_at,
         :user_timeout, :username, :website, :soft_geocoding_limit,
         :twitter_datasource_enabled, :twitter_datasource_block_size,
         :twitter_datasource_block_price, :twitter_datasource_quota,
         :soft_twitter_datasource_limit,
         :google_sign_in, :last_password_change_date,
         :google_maps_key, :google_maps_private_key,
         :arcgis_datasource_enabled,
         :private_maps_enabled, :here_isolines_quota, :here_isolines_block_price, :soft_here_isolines_limit,
         :obs_snapshot_quota, :obs_snapshot_block_price, :soft_obs_snapshot_limit,
         :mobile_xamarin, :mobile_custom_watermark, :mobile_offline_maps,
         :mobile_gis_extension, :mobile_max_open_users, :mobile_max_private_users]
      end
    end

    def allowed_attributes_to_central(action)
      if self.is_a?(Organization)
        case action
        when :create
          raise "Can't create organizations from editor"
        when :update
          self.values.slice(:seats, :display_name, :description, :website,
          :discus_shortname, :twitter_username, :auth_username_password_enabled, :auth_google_enabled)
        end
      elsif self.is_a?(::User)
        attrs = self.values.slice(:account_type, :admin, :crypted_password,
          :database_host, :database_timeout, :description, :disqus_shortname, :available_for_hire,
          :email, :geocoding_block_price, :geocoding_quota, :map_view_block_price,
          :map_view_quota, :max_layers, :name, :notification, :organization_id,
          :period_end_date, :private_tables_enabled, :quota_in_bytes, :salt,
          :sync_tables_enabled, :table_quota, :twitter_username, :upgraded_at,
          :user_timeout, :username, :website, :soft_geocoding_limit,
          :twitter_datasource_enabled, :soft_twitter_datasource_limit,
          :arcgis_datasource_enabled, :google_sign_in, :last_password_change_date,
          :google_maps_key, :google_maps_private_key, :here_isolines_quota, :here_isolines_block_price,
          :soft_here_isolines_limit, :obs_snapshot_quota, :obs_snapshot_block_price, :soft_obs_snapshot_limit
        )
        case action
        when :create
          attrs[:remote_user_id] = self.id
          attrs.delete(:organization_id)
          return attrs
        when :update
          attrs
        end
      end
    end

    def set_fields_from_central(params, action)
      return self unless params.present? && action.present?
      self.set(params.slice(*allowed_attributes_from_central(action)))

      if self.is_a?(::User) && params.has_key?(:password)
        self.password = self.password_confirmation = params[:password]
      end
      self
    end

    def set_relationships_from_central(params)
      if params.present? && params.has_key?(:feature_flags)
        update_feature_flags(params[:feature_flags])
      end
    end

    def sync_data_with_cartodb_central?
      Cartodb::Central.sync_data_with_cartodb_central?
    end

    def cartodb_central_client
      @cartodb_central_client ||= Cartodb::Central.new
    end

    def update_feature_flags(feature_flag_ids)
      feature_flag_ids = feature_flag_ids.compact.reject(&:empty?)
      current_feature_flag_ids = self.feature_flags_user.map { | ffu | ffu.feature_flag_id }
      to_add = feature_flag_ids - current_feature_flag_ids
      to_remove = current_feature_flag_ids - feature_flag_ids

      removed_feature_flags_user = self.feature_flags_user.select { | ffu | to_remove.include?(ffu.feature_flag_id) }
      removed_feature_flags_user.map do | rffu |
        rffu.destroy
      end

      to_add.map { | ff_id |
        ffu = FeatureFlagsUser.new
        ffu.user_id = self.id
        ffu.feature_flag_id = ff_id
        ffu.save
      }.each { |ffu|
        self.feature_flags_user << ffu
      }

    end

  end
end
