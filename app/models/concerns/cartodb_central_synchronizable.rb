require 'httparty'

module Concerns
  module CartodbCentralSynchronizable

    def create_in_central
      return true unless sync_data_with_cartodb_central?
      if self.is_a?(User) && organization.present?
        cartodb_central_client.create_organization_user(organization.name, allowed_attributes_to_central(:create))
      elsif self.is_a?(Organization)
        raise "Can't create organizations in editor"
      end
      return true
    end

    def update_in_central
      return true unless sync_data_with_cartodb_central?
      if self.is_a?(User) && organization.present?
        cartodb_central_client.update_organization_user(organization.name, username, allowed_attributes_to_central(:update))
      elsif self.is_a?(Organization)
        cartodb_central_client.update_organization(name, allowed_attributes_to_central(:update))
      end
      return true
    end

    def delete_in_central
      return true unless sync_data_with_cartodb_central?
      if self.is_a?(User) && organization.present?
        if self.organization.owner && self.organization.owner != self
          cartodb_central_client.delete_organization_user(organization.name, username)
        else
          raise "Can't destroy the organization owner"
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
          :twitter_datasource_block_price, :twitter_datasource_quota]
        when :update
          [:seats, :quota_in_bytes, :display_name, :description, :website,
          :discus_shortname, :twitter_username, :geocoding_quota, :map_view_quota,
          :geocoding_block_price, :map_view_block_price,
          :twitter_datasource_enabled, :twitter_datasource_block_size,
          :twitter_datasource_block_price, :twitter_datasource_quota]
        end
      elsif self.is_a?(User)
        [:account_type, :admin, :crypted_password, :database_host,
        :database_timeout, :description, :disqus_shortname, :email,
        :geocoding_block_price, :geocoding_quota, :map_view_block_price,
        :map_view_quota, :max_layers, :name, :notification, :organization_id,
        :period_end_date, :private_tables_enabled, :quota_in_bytes, :salt,
        :sync_tables_enabled, :table_quota, :twitter_username, :upgraded_at,
        :user_timeout, :username, :website, :soft_geocoding_limit,
        :twitter_datasource_enabled, :twitter_datasource_block_size,
        :twitter_datasource_block_price, :twitter_datasource_quota]
      end
    end

    def allowed_attributes_to_central(action)
      if self.is_a?(Organization)
        case action
        when :create
          raise "Can't create organizations from editor"
        when :update
          self.values.slice(:seats, :display_name, :description, :website,
          :discus_shortname, :twitter_username)
        end
      elsif self.is_a?(User)
        attrs = self.values.slice(:account_type, :admin, :crypted_password,
          :database_host, :database_timeout, :description, :disqus_shortname, :email, :geocoding_block_price,
          :geocoding_quota, :map_view_block_price, :map_view_quota, :max_layers,
          :name, :notification, :organization_id, :period_end_date,
          :private_tables_enabled, :quota_in_bytes, :salt, :sync_tables_enabled,
          :table_quota, :twitter_username, :upgraded_at, :user_timeout, :username,
          :website, :soft_geocoding_limit, :twitter_datasource_enabled)
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
      if self.is_a?(User) && params.has_key?(:password)
        self.password = self.password_confirmation = params[:password]
      end
      self
    end

    def sync_data_with_cartodb_central?
      Cartodb.config[:cartodb_central_api].present? && Cartodb.config[:cartodb_central_api]['username'].present? && Cartodb.config[:cartodb_central_api]['password'].present?
    end

    def cartodb_central_client
      @cartodb_central_client ||= Cartodb::Central.new
    end

  end
end