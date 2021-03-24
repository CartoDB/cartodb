require 'spec_helper_unit'

describe Carto::Overlay do

  include Carto::Factories::Visualizations

  let(:user) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }

  before do
    _, _, _, @visualization = create_full_visualization(user)
    # For this tests we want no visualization overlay
    @visualization.overlays.each(&:destroy)
  end

  describe '#create' do
    it 'creates a new overlay' do
      overlay = @visualization.overlays.new(type: 'header', template: 'wadus', order: 0)
      Carto::VisualizationInvalidationService.any_instance.expects(:invalidate).once
      overlay.save.should be_true

      overlay.id.should be
      overlay.visualization_id.should eq @visualization.id
      overlay.type.should eq 'header'
      overlay.template.should eq 'wadus'
      overlay.order.should eq 0
    end

    it 'validates unique overlays constraints' do
      overlay = @visualization.overlays.new(type: 'search')
      overlay.save.should be_true

      overlay2 = @visualization.overlays.new(type: 'search')
      overlay2.save.should be_false
    end

    it 'allows multiple overlays for non-unique types' do
      overlay = @visualization.overlays.new(type: 'text')
      overlay.save.should be_true

      overlay2 = @visualization.overlays.new(type: 'text')
      overlay2.save.should be_true
    end

    it 'allows deletion and re-creation of unique types' do
      overlay = @visualization.overlays.new(type: 'fullscreen')
      overlay.save.should be_true

      overlay2 = @visualization.overlays.new(type: 'fullscreen')
      overlay2.save.should be_false

      overlay.destroy.should be_true
      overlay2.save.should be_true
    end
  end

  describe '#update' do
    it 'updates overlays' do
      overlay = @visualization.overlays.new(type: 'text', template: 'wadus', order: 0)
      overlay.save.should be_true

      overlay.template = 'image'
      overlay.type = 'logo'
      overlay.order = 5
      Carto::VisualizationInvalidationService.any_instance.expects(:invalidate).once
      overlay.save.should be_true

      overlay.reload
      overlay.template.should eq 'image'
      overlay.type.should eq 'logo'
      overlay.order.should eq 5
    end

    it 'validates unique overlays constraints' do
      overlay = @visualization.overlays.new(type: 'zoom')
      overlay.save.should be_true

      overlay2 = @visualization.overlays.new(type: 'text')
      overlay2.save.should be_true

      overlay2.type = 'zoom'
      overlay2.save.should be_false
    end
  end

  describe '#delete' do
    it 'deletes overlays' do
      overlay = @visualization.overlays.new(type: 'text', template: 'wadus', order: 0)
      overlay.save.should be_true

      Carto::VisualizationInvalidationService.any_instance.expects(:invalidate).once
      overlay.destroy.should be_true
      overlay.persisted?.should be_false
    end
  end

  describe '#hide/show' do
    it 'should change options to visible = false/true' do
      overlay = @visualization.overlays.new(type: 'text', options: { 'display' => true })
      overlay.hidden?.should be_false

      overlay.hide
      overlay.options['display'].should be_false
      overlay.hidden?.should be_true

      overlay.show
      overlay.hidden?.should be_false
      overlay.options['display'].should be_true
    end
  end

  context 'viewer users' do
    before do
      _, _, _, @visualization = create_full_visualization(user)
      user = @visualization.user
      user.viewer = true
      user.save
      @visualization.reload
    end

    it "can't create a new overlay" do
      overlay = @visualization.overlays.new(type: 'header', template: 'wadus', order: 0)
      overlay.save.should be_false
      overlay.errors[:visualization].should eq(["Viewer users can't edit overlays"])
    end

    it "can't delete overlays" do
      overlay = @visualization.overlays.first
      overlay.destroy.should eq false
      overlay.errors[:visualization].should include("Viewer users can't edit overlays")

      Carto::Overlay.exists?(overlay.id).should eq true
    end
  end
end
