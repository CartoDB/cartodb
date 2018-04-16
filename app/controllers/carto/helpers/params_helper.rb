require_relative '../controller_helper'

module Carto
  module ParamsHelper
    VALID_CANONICAL_ORDER_PARAMS = ['updated_at', 'size', 'mapviews', 'likes'].freeze
    VALID_DERIVED_ORDER_PARAMS = ['updated_at', 'mapviews', 'likes'].freeze
    VALID_USERS_ORDER_PARAMS = ['username'].freeze
    VALID_API_KEYS_ORDER_PARAMS = ['type', 'name'].freeze
    VALID_GRANTABLES_ORDER_PARAMS = ['id', 'name', 'type', 'avatar_url', 'organization_id'].freeze
    VALID_GROUPS_ORDER_PARAMS = ['id', 'name', 'display_name', 'database_role', 'organization_id'].freeze
    VALID_DEFAULT_ORDER_PARAMS = ['updated_at', 'created_at'].freeze

    VIZ_BY_TYPE = {
      'order': {
        'derived': VALID_DERIVED_ORDER_PARAMS,
        'remote': VALID_CANONICAL_ORDER_PARAMS,
        'slide': VALID_DERIVED_ORDER_PARAMS,
        'table': VALID_CANONICAL_ORDER_PARAMS
      }
    }.freeze

    BY_CONTROLLER = {
      'organizations': VALID_USERS_ORDER_PARAMS + VALID_DEFAULT_ORDER_PARAMS,
      'api_keys': VALID_API_KEYS_ORDER_PARAMS + VALID_DEFAULT_ORDER_PARAMS,
      'grantables': VALID_GRANTABLES_ORDER_PARAMS + VALID_DEFAULT_ORDER_PARAMS,
      'groups': VALID_GROUPS_ORDER_PARAMS + VALID_DEFAULT_ORDER_PARAMS,
      'default': VALID_DEFAULT_ORDER_PARAMS
    }.freeze

    def validate_order_param
      if controller_name == 'visualizations'
        validate_viz_param
      else
        validate_param(:order, BY_CONTROLLER[controller_name.to_sym] || BY_CONTROLLER[:default])
      end
    end

    private

    def error_message(param, valid_values)
      "Wrong '#{param}' parameter value. Valid values are one of #{valid_values}"
    end

    def validate_viz_param
      types = params[:types]
      validate_param(:order, types.present? ? VIZ_BY_TYPE[:order][types.try(:to_sym)] : VIZ_BY_TYPE[:order][:table])
    end

    def validate_param(param = :order, valid_values = [])
      return true unless params[param].present?

      raise Carto::LoadError.new(error_message(param, valid_values), 400) unless valid_values.include?(params[param])
    end
  end
end
