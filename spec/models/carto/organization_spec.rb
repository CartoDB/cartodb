# coding: UTF-8
require_relative '../../spec_helper'
require_relative '../organization_shared_examples'

describe Carto::Organization do

  it_behaves_like 'organization models' do

    def get_twitter_imports_count_by_organization_id(organization_id)
      Carto::Organization.where(id: organization_id).first.twitter_imports_count
    end

  end

end

