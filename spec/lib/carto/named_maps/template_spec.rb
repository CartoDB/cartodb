# encoding utf-8

require_relative '../../../spec_helper_min.rb'
require_relative '../../../../lib/carto/named_maps/template'

module Carto
  module NamedMaps
    describe Template do
      include Carto::Factories::Visualizations

      before(:all) do
        bypass_named_maps
        @user = FactoryGirl.create(:carto_user, private_tables_enabled: true)

        @map, _, _, @visualization = create_full_visualization(@user)
      end

      describe '#name' do
        it 'should generate the template name correctly' do
          template = Carto::NamedMaps::Template.new(@visualization)
          template_name = template.to_hash[:name]

          template_name.should match("^#{Carto::NamedMaps::Template::NAME_PREFIX}")
          template_name.should_not match(/[^a-zA-Z0-9\-\_.]/)
        end
      end

      describe '#placeholders' do
        it 'should not generate placeholders if map has no layers' do
          template = Carto::NamedMaps::Template.new(@visualization)
          placeholders = template.to_hash[:placeholders]

          placeholders.length.should be 0
        end
      end

      describe '#auth' do
        it 'should generate open auth for public, link and private visualizations' do
          @visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_OPEN

          @visualization.privacy = Carto::Visualization::PRIVACY_LINK

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_OPEN

          @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_OPEN
        end

        it 'should use signed auth for password protected visualizations' do
          @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_SIGNED
        end

        it 'should use signed auth for organization private visualizations' do
          @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE

          @visualization.stubs(:organization?).returns(true)

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_SIGNED
        end
      end
    end
  end
end
