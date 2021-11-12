class OrganizationPresenter < BasePresenter

  def self.object_klass
    Carto::Organization
  end

  # rubocop:disable Style/AccessModifierDeclarations
  protected(*delegate(*delegated_methods, to: :object))
  # rubocop:enable Style/AccessModifierDeclarations
  delegate(:owner, :unassigned_quota, :db_size_in_bytes, to: :object)

  def data
    params[:extended] ? extended_representation : default_representation
  end

  def to_poro
    {
      owner: owner_attributes.merge(email: owner&.email),
      admins: users.select(&:org_admin).map { |u| { id: u.id } },
      quota_in_bytes: quota_in_bytes,
      unassigned_quota: unassigned_quota,
      geocoding_quota: geocoding_quota,
      map_views_quota: map_views_quota,
      twitter_datasource_quota: twitter_datasource_quota,
      map_view_block_price: map_view_block_price,
      geocoding_block_price: geocoding_block_price,
      here_isolines_quota: here_isolines_quota,
      here_isolines_block_price: here_isolines_block_price,
      mapzen_routing_quota: mapzen_routing_quota,
      mapzen_routing_block_price: mapzen_routing_block_price,
      admin_email: admin_email,
      user_count: users.count
    }.merge(common_attributes)
  end

  private

  def common_attributes
    {
      id: id,
      name: name,
      created_at: created_at,
      updated_at: updated_at,
      description: description,
      discus_shortname: discus_shortname,
      display_name: display_name,
      geocoder_provider: geocoder_provider,
      isolines_provider: isolines_provider,
      routing_provider: routing_provider,
      location: twitter_username,
      website: website,
      twitter_username: twitter_username,
      seats: seats,
      avatar_url: avatar_url,
      password_expiration_in_d: password_expiration_in_d,
      random_saml_username: random_saml_username
    }
  end

  def owner_attributes
    {
      id: owner&.id,
      username: owner&.username,
      avatar_url: owner&.avatar,
      groups: owner_groups
    }
  end

  def default_representation
    { owner: owner_attributes }.merge(quotas_information).merge(common_attributes)
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
      map_views: map_views_count,
      map_views_quota: map_views_quota,
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

end
