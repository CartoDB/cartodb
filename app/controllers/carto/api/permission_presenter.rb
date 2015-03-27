require_relative 'user_presenter'

class Carto::Api::PermissionPresenter

  def initialize(permission)
    @permission = permission
  end

  def to_poro
    {
      id:         @permission.id,
      owner:      Carto::Api::UserPresenter.new(@permission.owner).to_poro,
      entity: {
        id:       @permission.entity_id,
        type:     @permission.entity_type
      },
      acl:        @permission.acl.map { |entry|
        {
          type:   entry[:type],
          entity: entity_decoration(entry),
          access: entry[:access]
        }
      },
      created_at: @permission.created_at,
      updated_at: @permission.updated_at
    }
  end

end
