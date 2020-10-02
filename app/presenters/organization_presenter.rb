class OrganizationPresenter < BasePresenter

  def self.object_klass
    Carto::Organization
  end

  protected(*delegate(*delegated_methods, to: :object))
  delegate(:owner, :unassigned_quota, :db_size_in_bytes, to: :object)

  def data
    params[:extended] ? extended_representation : default_representation
  end

  private

  def default_representation
    {
      created_at: created_at,
      description: description,
      discus_shortname: discus_shortname,
      display_name: display_name,
      id: id,
      name: name,
      owner: {
        id: owner ? owner.id : nil,
        username: owner ? owner.username : nil,
        avatar_url: owner ? owner.avatar : nil,
        groups: owner_groups
      },
      geocoder_provider: geocoder_provider,
      isolines_provider: isolines_provider,
      routing_provider: routing_provider,
      seats: seats,
      twitter_username: twitter_username,
      location: location,
      updated_at: updated_at,
      website: website,
      avatar_url: avatar_url,
      password_expiration_in_d: password_expiration_in_d
    }.merge(quotas_information)
  end

  def extended_representation
    default_representation.merge(
      table_count: visualizations_builder.with_type(Carto::Visualization::TYPE_CANONICAL).count,
      map_count: visualizations_builder.with_type(Carto::Visualization::TYPE_DERIVED).count
    )
  end

  def quotas_information
    {
      quota_in_bytes: quota_in_bytes,
      unassigned_quota: unassigned_quota,
      used_quota: db_size_in_bytes,
      api_calls: api_calls,
      api_calls_quota: map_view_quota,
      geocoding: {
        quota: geocoding_quota,
        monthly_use: get_geocoding_calls
      },
      here_isolines: {
        quota: here_isolines_quota,
        monthly_use: get_here_isolines_calls
      },
      mapzen_routing: {
        quota: mapzen_routing_quota,
        monthly_use: get_mapzen_routing_calls
      },
      obs_snapshot: {
        quota: obs_snapshot_quota,
        monthly_use: get_obs_snapshot_calls
      },
      obs_general: {
        quota: obs_general_quota,
        monthly_use: get_obs_general_calls
      },
      twitter: {
        enabled: twitter_datasource_enabled,
        quota: twitter_datasource_quota,
        block_price: twitter_datasource_block_price,
        block_size: twitter_datasource_block_size,
        monthly_use: get_twitter_imports_count
      }
    }
  end

  def visualizations_builder
    Carto::VisualizationQueryBuilder.new.with_organization_id(id)
  end

  def owner_groups
    owner&.groups ? owner.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro } : []
  end

  def api_calls
    get_api_calls(from: owner.present? ? owner.last_billing_cycle : nil, to: Date.today)
  end

end
