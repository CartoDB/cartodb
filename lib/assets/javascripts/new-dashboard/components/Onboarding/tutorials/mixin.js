export default {
  data () {
    return {
      step: 1,
      isModalOpen: true
    };
  },
  methods: {
    goToStep (stepNum) {
      this.step = stepNum;
    },
    isCurrentStep (stepNum) {
      return this.step === stepNum;
    },
    openModal () {
      this.isModalOpen = true;
    },
    closeModal () {
      this.isModalOpen = false;
      this.step = 1;
      this.$emit('closeModal');
    }
  },
  updated () {
    if (this.$refs.wizard) {
      this.$refs.wizard.scrollTo({ top: 0, left: 0 });
    }
  }
};
