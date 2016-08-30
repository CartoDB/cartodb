# encoding utf-8

require 'factories/carto_visualizations'
require 'spec_helper_min'

module Carto
  module Tracking
    module Events
      describe 'Events' do
        include Carto::Factories::Visualizations

        before(:all) do
          @user = FactoryGirl.create(:carto_user)
          @intruder = FactoryGirl.create(:carto_user)
          @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
          @visualization.privacy = 'private'
          @visualization.save
          @visualization.reload
        end

        after(:all) do
          destroy_full_visualization(@map, @table, @table_visualization, @visualization)
          @user.destroy
          @intruder.destroy
        end

        def days_with_decimals(time_object)
          time_object.to_f / 60 / 60 / 24
        end

        describe ExportedMap do
          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = Carto::Tracking::Events::ExportedMap.new(@user.id,
                                                                visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = Carto::Tracking::Events::ExportedMap.new(@user.id,
                                                                user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have access read access to visualization' do
              @event = Carto::Tracking::Events::ExportedMap.new(@intruder.id,
                                                                visualization_id: @visualization.id,
                                                                user_id: @intruder.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = Carto::Tracking::Events::ExportedMap.new(@intruder.id,
                                                                visualization_id: @visualization.id,
                                                                user_id: @user.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = Carto::Tracking::Events::ExportedMap.new(@user.id,
                                                             visualization_id: @visualization.id,
                                                             user_id: @user.id)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = Carto::Tracking::Events::ExportedMap.new(@intruder.id,
                                                             visualization_id: @visualization.id,
                                                             user_id: @intruder.id)

            Carto::Visualization.any_instance
                                .stubs(:is_accesible_by_user?)
                                .with(@intruder)
                                .returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            let(:current_prod_properties) do
              [:vis_id,
               :privacy,
               :type,
               :object_created_at,
               :lifetime,
               :username,
               :email,
               :plan,
               :user_active_for,
               :user_created_at,
               :organization,
               :event_origin,
               :creation_time]
            end

            event = Carto::Tracking::Events::ExportedMap.new(@user.id,
                                                             visualization_id: @visualization.id,
                                                             user_id: @user.id)
          end
        end

        describe CreatedMap do

        end

        describe DeletedMap do

        end

        describe PublishedMap do

        end

        describe CompletedConnection do

        end

        describe FailedConnection do

        end

        describe ExceededQuota do

        end

        describe ScoredTrendingMap do

        end

        describe VisitedPrivatePage do

        end

        describe CreatedDataset do

        end

        describe DeletedDataset do

        end

        describe LikedMap do

        end
      end
    end
  end
end
