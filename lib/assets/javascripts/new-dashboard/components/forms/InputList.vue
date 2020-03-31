<template>
  <div class="inputList">
    <ul>
      <!-- List of current elements -->
      <li v-for="(value, index) in valuesInArray" :key="index">
        <input
          type="text"
          :name="`ipValue-${value}`"
          class="inputList__element"
          readonly
          v-model="valuesInArray[index]" />

        <button class="inputList__action inputList__delete" @click="deleteElement(index)">
          {{ $t('InputList.delete') }}
        </button>
      </li>

      <!-- New element to add -->
      <li>
        <input
          type="text"
          name="ipValue-new"
          class="inputList__element"
          :class="{'has-error': hasError}"
          :placeholder="placeholder"
          v-model="newValueForInput" />

        <button
          class="inputList__action"
          @click="addNewElement(newValueForInput)">
          {{ $t('InputList.add') }}
        </button>
      </li>

    </ul>

    <div class="inputList__error" v-if="hasError">
      {{ errorText }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'InputList',
  data () {
    return {
      valuesInArray: this.$props.values,
      newValueForInput: '',
      hasError: false,
      errorText: ''
    };
  },
  props: {
    placeholder: String,
    values: {
      type: Array,
      default: () => ([])
    },
    fieldValidator: {
      type: Function,
      default: () => ({ isValid: true })
    }
  },
  watch: {
    values (newValues) {
      this.valuesInArray = newValues;
    }
  },
  methods: {
    addNewElement (elementValue) {
      const {isValid, errorText} = this.fieldValidator(elementValue);

      if (!isValid) {
        return this.setError(errorText);
      }

      this.valuesInArray.push(elementValue);
      this.newValueForInput = '';
      this.resetError();
      this.onElementAdded();
    },

    deleteElement (index) {
      this.valuesInArray.splice(index, 1);
      this.onElementRemoved();
    },

    onElementAdded () {
      this.$emit('addElement', this.valuesInArray);
    },

    onElementRemoved () {
      this.$emit('removeElement', this.valuesInArray);
    },

    setError (errorText) {
      this.hasError = true;
      this.errorText = errorText || '';
    },

    resetError () {
      this.hasError = false;
      this.errorText = '';
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.inputList {
  font-family: 'Open Sans', sans-serif;
}

.inputList__element {
  margin-bottom: 6px;
  border: 1px solid $neutral--400;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 16px;

  &.has-error {
    border: 1px solid  $danger__color;
  }

  &:hover {
    border: 1px solid $blue--700;
  }

  &:focus {
    border: 1px solid $neutral--400;
  }
}

.inputList__action {
  padding-left: 16px;
  color: $color-primary;
  font-size: 12px;
  line-height: 22px;

  &:hover {
    text-decoration: underline;
  }

  &.inputList__delete {
    color: $danger__color;
  }

  &[disabled] {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
