export default {
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
  },
  getStepGTMString (stepNumber) {
    return `gtm-${this.wizardName}-step${stepNumber}`;
  }
};
