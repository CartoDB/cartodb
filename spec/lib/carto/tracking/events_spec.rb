# encoding: utf-8

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

        def check_hash_has_keys(hash, keys)
          keys.each do |key|
            puts "checking #{key} is not nil"
            hash[key].should_not be_nil
          end
        end

        describe ExportedMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have read access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:is_accesible_by_user?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe CreatedMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :origin,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      origin: 'bananas')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe DeletedMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe PublishedMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:creation_time,
                                       :email,
                                       :event_origin,
                                       :lifetime,
                                       :object_created_at,
                                       :plan,
                                       :privacy,
                                       :type,
                                       :user_active_for,
                                       :user_created_at,
                                       :username,
                                       :vis_id]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      origin: 'bananas')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe CompletedConnection do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:connection) do
            {
              data_from: 'Manolo',
              imported_from: 'Escobar',
              sync: true,
              file_type: '.manolo'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        connection: connection)
            end

            it 'requires a connection' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        user_id: @user.id,
                                        connection: connection)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     user_id: @user.id,
                                     connection: connection)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:data_from,
                                       :imported_from,
                                       :sync,
                                       :file_type,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      user_id: @user.id,
                                      connection: connection)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe FailedConnection do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:connection) do
            {
              data_from: 'Manolo',
              imported_from: 'Escobar',
              sync: true,
              file_type: '.manolo'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, connection: connection)
            end

            it 'requires a connection' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        user_id: @user.id,
                                        connection: connection)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     user_id: @user.id,
                                     connection: connection)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:data_from,
                                       :imported_from,
                                       :sync,
                                       :file_type,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      user_id: @user.id,
                                      connection: connection)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe ExceededQuota do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, {})
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id, user_id: @user.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id, user_id: @user.id)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:creation_time,
                                       :email,
                                       :event_origin,
                                       :plan,
                                       :quota_overage,
                                       :user_active_for,
                                       :user_created_at,
                                       :username]

            format = @event_class.new(@user.id, user_id: @user.id, quota_overage: 123)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe ScoredTrendingMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        mapviews: 123)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        mapviews: 123)
            end

            it 'requires mapviews' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id,
                                        mapviews: 123)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        mapviews: 123)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     mapviews: 123)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id,
                                     mapviews: 123)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:creation_time,
                                       :email,
                                       :event_origin,
                                       :map_id,
                                       :map_name,
                                       :mapviews,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :username]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      mapviews: 123)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe VisitedPrivatePage do

        end

        describe CreatedDataset do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :origin,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      origin: 'bananas')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe DeletedDataset do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe LikedMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        action: 'like')
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        action: 'like')
            end

            it 'requires an action' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have read access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id,
                                        action: 'like')

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        action: 'like')

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     action: 'like')

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id,
                                     action: 'like')

            Carto::Visualization.any_instance
                                .stubs(:is_accesible_by_user?)
                                .with(@intruder)
                                .returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:action,
                                       :creation_time,
                                       :email,
                                       :event_origin,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :username,
                                       :vis_author,
                                       :vis_author_email,
                                       :vis_author_id,
                                       :vis_id,
                                       :vis_name,
                                       :vis_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      action: 'like')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe CreatedAnalysis do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:analysis) do
            {
              id: 'xxx-xxx-xxx-xxx',
              natural_id: 'z3',
              type: 'georeference'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        analysis: analysis)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        analysis: analysis)
            end

            it 'requires an analysis' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id,
                                        analysis: analysis)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        analysis: analysis)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     analysis: analysis)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id,
                                     analysis: analysis)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time,
                                       :analysis_id,
                                       :analysis_natural_id,
                                       :analysis_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      analysis: analysis)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe ModifiedAnalysis do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:analysis) do
            {
              id: 'xxx-xxx-xxx-xxx',
              natural_id: 'z3',
              type: 'georeference'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        analysis: analysis)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        analysis: analysis)
            end

            it 'requires an analysis' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id,
                                        analysis: analysis)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        analysis: analysis)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     analysis: analysis)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id,
                                     analysis: analysis)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time,
                                       :analysis_id,
                                       :analysis_natural_id,
                                       :analysis_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      analysis: analysis)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe CreatedWidget do
          before(:all) do
            @widget = FactoryGirl.create(:widget, layer: @visualization.data_layers.first)
          end

          after(:all) do
            @widget.destroy
          end

          it 'should validate the widget exists' do
            event = Carto::Tracking::Events::CreatedWidget.new(@user.id,
                                                               user_id: @user.id,
                                                               visualization_id: @visualization.id,
                                                               widget_id: random_uuid)

            expect { event.send(:report!) }.to raise_error(Carto::LoadError)
          end

          it 'should report when valid widget' do
            event = Carto::Tracking::Events::CreatedWidget.new(@user.id,
                                                               user_id: @user.id,
                                                               visualization_id: @visualization.id,
                                                               widget_id: @widget.id)

            expect { event.send(:report!) }.to_not raise_error
          end
        end

        describe DeletedAnalysis do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:analysis) do
            {
              id: 'xxx-xxx-xxx-xxx',
              natural_id: 'z3',
              type: 'georeference'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        analysis: analysis)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        analysis: analysis)
            end

            it 'requires an analysis' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id)
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id,
                                        analysis: analysis)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        analysis: analysis)

              expect { @event.send(:report!) }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     analysis: analysis)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id,
                                     analysis: analysis)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.send(:report!) }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :username,
                                       :email,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time,
                                       :analysis_id,
                                       :analysis_natural_id,
                                       :analysis_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      analysis: analysis)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end
      end
    end
  end
end
