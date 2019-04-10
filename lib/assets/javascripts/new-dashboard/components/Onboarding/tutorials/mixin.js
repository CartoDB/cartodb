export default {
  data () {
    return {
      step: 1,
      isModalOpen: true
    };
  },
  mounted () {
    this.setStepNumber();
  },
  watch: {
    $route () {
      this.setStepNumber();
    }
  },
  computed: {
    totalStepCount () {
      return this.stepNames.length;
    }
  },
  methods: {
    goToStep (stepNum) {
      this.$router.push({
        hash: `#step-${stepNum}`
      });
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
    setStepNumber () {
      const {stepNumber, isValid} = parseHashParameterWithNumber(this.$route.hash);

      if (stepNumber > this.totalStepCount || !isValid) {
        return this.$router.push({ hash: '#step-1' });
      }

      this.step = stepNumber;
    }
  },
  updated () {
    if (this.$refs.wizard) {
      this.$refs.wizard.scrollTo({ top: 0, left: 0 });
    }
  }
};

function parseHashParameterWithNumber (hash, token = 'step-') {
  const stepIndex = hash.indexOf(token);
  const includesStep = stepIndex > -1;

  if (!includesStep) {
    return;
  }

  const stepNumber = +hash.substring(stepIndex + token.length);

  return {
    isValid: Number.isInteger(stepNumber),
    stepNumber: stepNumber
  };
}
