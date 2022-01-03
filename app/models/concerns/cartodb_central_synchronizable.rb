module CartodbCentralSynchronizable

  include ::MessageBrokerHelper

  def user?
    is_a?(::User) || is_a?(Carto::User)
  end

  def organization?
    is_a?(Carto::Organization)
  end

  # Can't be added to the model because if user creation begins at Central we can't know if user is the same or existing
  def validate_credentials_not_taken_in_central
    return true unless user?

    if Cartodb::Central.api_sync_disabled?
      log_central_unavailable
      return true
    end

    central_client = Cartodb::Central.new

    errors.add(:username, 'Username taken') if central_client.get_user(username)['username'] == username
    errors.add(:email, 'Email taken') if central_client.get_user(email)['email'] == email
    errors.empty?
  end

  def create_in_central
    if Cartodb::Central.message_broker_sync_disabled?
      log_central_unavailable
      return true
    end

    if user?
      if organization.present?
        cartodb_central_client.create_organization_user(organization.name, allowed_attributes_to_central(:create))
      else
        CartoDB.notify_debug('User creations at box without organization are not notified to Central', user: self)
      end
    elsif organization?
      raise "Can't create organizations in editor"
    end
    true
  end

  def update_in_central
    if Cartodb::Central.message_broker_sync_disabled?
      log_central_unavailable
      return true
    end

    if user?
      if organization.present?
        cartodb_central_client.update_organization_user(
          organization.name,
          username,
          allowed_attributes_to_central(:update)
        )
      else
        cartodb_central_client.update_user(username, allowed_attributes_to_central(:update))
      end
    elsif organization?
      cartodb_central_topic.publish(
        :update_organization,
        { organization: allowed_attributes_to_central(:update) }
      )
    end

    true
  end

  def allowed_attributes_from_central(action)
    if organization?
      case action
      when :create
        %i(name seats viewer_seats quota_in_bytes display_name description website
           discus_shortname twitter_username geocoding_quota map_views_quota
           geocoding_block_price map_view_block_price
           twitter_datasource_enabled twitter_datasource_block_size
           twitter_datasource_block_price twitter_datasource_quota
           google_maps_key google_maps_private_key auth_username_password_enabled
           auth_google_enabled here_isolines_quota here_isolines_block_price
           salesforce_datasource_enabled geocoder_provider
           isolines_provider routing_provider engine_enabled builder_enabled
           mapzen_routing_quota mapzen_routing_block_price no_map_logo auth_github_enabled
           password_expiration_in_d inherit_owner_ffs random_saml_username)
      when :update
        %i(seats viewer_seats quota_in_bytes display_name description website
           discus_shortname twitter_username geocoding_quota map_views_quota
           geocoding_block_price map_view_block_price
           twitter_datasource_enabled twitter_datasource_block_size
           twitter_datasource_block_price twitter_datasource_quota
           google_maps_key google_maps_private_key auth_username_password_enabled
           auth_google_enabled here_isolines_quota here_isolines_block_price
           salesforce_datasource_enabled geocoder_provider
           isolines_provider routing_provider engine_enabled builder_enabled
           mapzen_routing_quota mapzen_routing_block_price no_map_logo auth_github_enabled
           password_expiration_in_d inherit_owner_ffs random_saml_username)
      end
    elsif user?
      %i(account_type admin org_admin crypted_password database_host
         database_timeout description disqus_shortname available_for_hire email
         geocoding_block_price geocoding_quota map_view_block_price map_views_quota max_layers
         max_import_file_size max_import_table_row_count max_concurrent_import_count
         name last_name notification organization_id period_end_date private_tables_enabled quota_in_bytes
         sync_tables_enabled table_quota public_map_quota regular_api_key_quota
         twitter_username upgraded_at user_timeout username website soft_geocoding_limit
         batch_queries_statement_timeout twitter_datasource_enabled twitter_datasource_block_size
         twitter_datasource_block_price twitter_datasource_quota soft_twitter_datasource_limit
         google_sign_in last_password_change_date github_user_id google_maps_key google_maps_private_key
         private_maps_enabled here_isolines_quota here_isolines_block_price soft_here_isolines_limit
         mobile_xamarin mobile_custom_watermark mobile_offline_maps
         mobile_gis_extension mobile_max_open_users mobile_max_private_users
         salesforce_datasource_enabled viewer geocoder_provider
         isolines_provider routing_provider engine_enabled builder_enabled
         mapzen_routing_quota mapzen_routing_block_price soft_mapzen_routing_limit no_map_logo
         user_render_timeout database_render_timeout export_timeout state industry company phone job_role
         password_reset_token password_reset_sent_at maintenance_mode company_employees use_case private_map_quota
         session_salt public_dataset_quota dashboard_viewed_at email_verification_token email_verification_sent_at)
    end
  end

  def allowed_attributes_to_central(action)
    if organization?
      case action
      when :create
        raise "Can't create organizations from editor"
      when :update
        allowed_attributes = %i(seats viewer_seats display_name description website discus_shortname twitter_username
                                auth_username_password_enabled auth_google_enabled password_expiration_in_d
                                inherit_owner_ffs random_saml_username)
        attributes.symbolize_keys.slice(*allowed_attributes).merge(name: name)
      end
    elsif user?
      allowed_attributes = %i(
        account_type admin org_admin crypted_password database_host database_timeout description disqus_shortname
        available_for_hire email geocoding_block_price geocoding_quota map_view_block_price map_views_quota max_layers
        max_import_file_size max_import_table_row_count max_concurrent_import_count name last_name notification
        organization_id period_end_date private_tables_enabled quota_in_bytes sync_tables_enabled table_quota
        public_map_quota regular_api_key_quota twitter_username upgraded_at user_timeout username website
        soft_geocoding_limit twitter_datasource_enabled soft_twitter_datasource_limit google_sign_in
        last_password_change_date github_user_id google_maps_key google_maps_private_key here_isolines_quota
        here_isolines_block_price soft_here_isolines_limit viewer
        geocoder_provider isolines_provider routing_provider builder_enabled engine_enabled mapzen_routing_quota
        mapzen_routing_block_price soft_mapzen_routing_limit industry company phone job_role password_reset_token
        password_reset_sent_at company_employees use_case private_map_quota session_salt public_dataset_quota
        dashboard_viewed_at email_verification_token email_verification_sent_at
      )
      attrs = attributes.symbolize_keys.slice(*allowed_attributes)
      attrs[:multifactor_authentication_status] = multifactor_authentication_status
      case action
      when :create
        attrs[:remote_user_id] = id
        attrs.delete(:organization_id)
        attrs
      when :update
        attrs[:batch_queries_statement_timeout] = batch_queries_statement_timeout
        attrs
      end
    end
  end

  def set_fields_from_central(params, action)
    return self unless params.present? && action.present?

    changed_attributes = params.slice(*allowed_attributes_from_central(action))

    if self.class.ancestors.include?(Sequel::Model)
      set(changed_attributes)
    else
      changed_attributes.each { |attr, value| write_attribute(attr, value) }
    end

    self.password = self.password_confirmation = params[:password] if user? && params.key?(:password)

    self
  end

  def cartodb_central_client
    @cartodb_central_client ||= Cartodb::Central.new
  end

  private

  def log_central_unavailable
    Rails.logger.error(message: 'Skipping Central synchronization: not configured')
  end

end
