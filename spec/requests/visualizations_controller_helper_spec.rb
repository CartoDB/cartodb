# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../app/controllers/visualizations_controller_helper'

describe VisualizationsControllerHelper do
  include VisualizationsControllerHelper
  include CartoDB::Factories
  include Carto::Factories::Visualizations

  before(:all) do
    @organization = create_organization_with_users
    @org_user = Carto::User.find(@organization.users.first.id)
    @org_user_shared = Carto::User.find(@organization.users.last.id)
    @free_user = FactoryGirl.create(:carto_user)

    @free_map, @free_table, @free_table_visualization, @free_visualization = create_full_visualization(@free_user)
    @org_map, @org_table, @org_table_visualization, @org_visualization = create_full_visualization(@org_user)

    @free_visualization.name = 'free viz'
    @free_visualization.save
  end

  after(:all) do
    destroy_full_visualization(@org_map, @org_table, @org_table_visualization, @org_visualization)
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
  end

  def setup_for_user(user)
    user_request = mock
    user_request.stubs(:params).returns(user_domain: user.username)
    stubs(:request).returns(user_request)
  end

  describe '#free_user' do
    before(:each) do
      setup_for_user(@free_user)
    end

    describe '#derived_visualization' do
      it 'locates derived visualization by id' do
        visualization = load_visualization_from_id_or_name(@free_visualization.id)
        visualization.should eq @free_visualization
      end

      it 'locates derived visualization by name' do
        visualization = load_visualization_from_id_or_name(@free_visualization.name)
        visualization.should eq @free_visualization
      end

      it 'locates derived visualization by schema and id' do
        visualization = load_visualization_from_id_or_name("public.#{@free_visualization.id}")
        visualization.should eq @free_visualization
      end

      it 'locates derived visualization by schema and name' do
        visualization = load_visualization_from_id_or_name("public.#{@free_visualization.name}")
        visualization.should eq @free_visualization
      end

      it 'does locate derived visualization by another user and id' do
        setup_for_user(@org_user)

        visualization = load_visualization_from_id_or_name(@free_visualization.id)
        visualization.should eq @free_visualization
      end

      it 'does not locate derived visualization by another user and name' do
        setup_for_user(@org_user)

        visualization = load_visualization_from_id_or_name(@free_visualization.name)
        visualization.should be_nil
      end

      it 'does not locate derived visualization by another user and schema.name' do
        setup_for_user(@org_user)

        visualization = load_visualization_from_id_or_name("public.#{@free_visualization.name}")
        visualization.should be_nil
      end

      it 'does not locate derived visualization with incorrect schema' do
        visualization = load_visualization_from_id_or_name("invalid.#{@free_visualization.name}")
        visualization.should be_nil
      end
    end

    describe '#table_visualization' do
      it 'locates table visualization by id' do
        visualization = load_visualization_from_id_or_name(@free_table_visualization.id)
        visualization.should eq @free_table_visualization
      end

      it 'locates table visualization by name' do
        visualization = load_visualization_from_id_or_name(@free_table_visualization.name)
        visualization.should eq @free_table_visualization
      end

      it 'locates table visualization by schema and id' do
        visualization = load_visualization_from_id_or_name("public.#{@free_table_visualization.id}")
        visualization.should eq @free_table_visualization
      end

      it 'locates table visualization by schema and name' do
        visualization = load_visualization_from_id_or_name("public.#{@free_table_visualization.name}")
        visualization.should eq @free_table_visualization
      end

      it 'does locate table visualization by another user and id' do
        setup_for_user(@org_user)

        visualization = load_visualization_from_id_or_name(@free_table_visualization.id)
        visualization.should eq @free_table_visualization
      end

      it 'does not locate table visualization by another user and name' do
        setup_for_user(@org_user)

        visualization = load_visualization_from_id_or_name(@free_table_visualization.name)
        visualization.should be_nil
      end

      it 'does not locate table visualization by another user and schema.name' do
        setup_for_user(@org_user)

        visualization = load_visualization_from_id_or_name("public.#{@free_table_visualization.name}")
        visualization.should be_nil
      end

      it 'does not locate table visualization with incorrect schema' do
        visualization = load_visualization_from_id_or_name("invalid.#{@free_table_visualization.name}")
        visualization.should be_nil
      end
    end
  end

  describe '#org_user' do
    before(:each) do
      setup_for_user(@org_user)
    end

    describe '#derived_visualization' do
      it 'locates derived visualization by id' do
        visualization = load_visualization_from_id_or_name(@org_visualization.id)
        visualization.should eq @org_visualization
      end

      it 'locates derived visualization by name' do
        visualization = load_visualization_from_id_or_name(@org_visualization.name)
        visualization.should eq @org_visualization
      end

      it 'locates derived visualization by schema and id' do
        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_visualization.id}")
        visualization.should eq @org_visualization
      end

      it 'locates derived visualization by schema and name' do
        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_visualization.name}")
        visualization.should eq @org_visualization
      end

      it 'does locate derived visualization by another user and id' do
        setup_for_user(@free_user)

        visualization = load_visualization_from_id_or_name(@org_visualization.id)
        visualization.should eq @org_visualization
      end

      it 'does not locate derived visualization by another user and name' do
        setup_for_user(@free_user)

        visualization = load_visualization_from_id_or_name(@org_visualization.name)
        visualization.should be_nil
      end

      it 'does not locate derived visualization by another user and schema.name' do
        setup_for_user(@free_user)

        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_visualization.name}")
        visualization.should be_nil
      end

      it 'does not locate derived visualization with incorrect schema' do
        visualization = load_visualization_from_id_or_name("#{@org_user_shared.database_schema}.#{@org_visualization.name}")
        visualization.should be_nil
      end
    end

    describe '#table_visualization' do
      it 'locates table visualization by id' do
        visualization = load_visualization_from_id_or_name(@org_table_visualization.id)
        visualization.should eq @org_table_visualization
      end

      it 'locates table visualization by name' do
        visualization = load_visualization_from_id_or_name(@org_table_visualization.name)
        visualization.should eq @org_table_visualization
      end

      it 'locates table visualization by schema and id' do
        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_table_visualization.id}")
        visualization.should eq @org_table_visualization
      end

      it 'locates table visualization by schema and name' do
        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_table_visualization.name}")
        visualization.should eq @org_table_visualization
      end

      it 'does locate table visualization by another user and id' do
        setup_for_user(@free_user)

        visualization = load_visualization_from_id_or_name(@org_table_visualization.id)
        visualization.should eq @org_table_visualization
      end

      it 'does not locate table visualization by another user and name' do
        setup_for_user(@free_user)

        visualization = load_visualization_from_id_or_name(@org_table_visualization.name)
        visualization.should be_nil
      end

      it 'does not locate table visualization by another user and schema.name' do
        setup_for_user(@free_user)

        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_table_visualization.name}")
        visualization.should be_nil
      end

      it 'does not locate table visualization with incorrect schema' do
        visualization = load_visualization_from_id_or_name("#{@org_user_shared.database_schema}.#{@org_table_visualization.name}")
        visualization.should be_nil
      end
    end
  end

  describe '#org_shared' do
    before(:each) do
      setup_for_user(@org_user_shared)
    end

    describe '#derived_visualization' do
      it 'locates shared derived visualization by id' do
        visualization = load_visualization_from_id_or_name(@org_visualization.id)
        visualization.should eq @org_visualization
      end

      it 'locates shared derived visualization by schema and id' do
        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_visualization.id}")
        visualization.should eq @org_visualization
      end

      it 'locates shared derived visualization by schema and name' do
        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_visualization.name}")
        visualization.should eq @org_visualization
      end

      it 'does locate shared derived visualization by another user and id' do
        visualization = load_visualization_from_id_or_name(@org_visualization.id)
        visualization.should eq @org_visualization
      end

      it 'does not locate shared derived visualization by another user and name' do
        visualization = load_visualization_from_id_or_name(@org_visualization.name)
        visualization.should be_nil
      end

      it 'does not locate shared derived visualization by another user and schema.name' do
        setup_for_user(@free_user)

        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_visualization.name}")
        visualization.should be_nil
      end

      it 'does not locate shared derived visualization with incorrect schema' do
        visualization = load_visualization_from_id_or_name("#{@org_user_shared.database_schema}.#{@org_visualization.name}")
        visualization.should be_nil
      end
    end

    describe '#table_visualization' do
      it 'locates shared table visualization by id' do
        visualization = load_visualization_from_id_or_name(@org_table_visualization.id)
        visualization.should eq @org_table_visualization
      end

      it 'locates shared table visualization by schema and id' do
        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_table_visualization.id}")
        visualization.should eq @org_table_visualization
      end

      it 'locates shared table visualization by schema and name' do
        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_table_visualization.name}")
        visualization.should eq @org_table_visualization
      end

      it 'does locate shared table visualization by another user and id' do
        visualization = load_visualization_from_id_or_name(@org_table_visualization.id)
        visualization.should eq @org_table_visualization
      end

      it 'does not locate shared table visualization by another user and name' do
        visualization = load_visualization_from_id_or_name(@org_table_visualization.name)
        visualization.should be_nil
      end

      it 'does not locate shared table visualization by another user and schema.name' do
        setup_for_user(@free_user)

        visualization = load_visualization_from_id_or_name("#{@org_user.database_schema}.#{@org_table_visualization.name}")
        visualization.should be_nil
      end

      it 'does not locate shared table visualization with incorrect schema' do
        visualization = load_visualization_from_id_or_name("#{@org_user_shared.database_schema}.#{@org_table_visualization.name}")
        visualization.should be_nil
      end
    end
  end
end
