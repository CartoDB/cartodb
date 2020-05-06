<template>
  <div class="inputList">
    <label class="inputList__label">
      {{ title }}
    </label>
    <ul>
      <!-- List of current elements -->
      <li class="inputList__block" v-for="(value, index) in valuesInArray" :key="index">
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
      <li class="inputList__block">
        <input
          type="text"
          name="ipValue-new"
          class="inputList__element"
          :class="{'has-error': hasError}"
          :placeholder="placeholder"
          v-model="newValueForInput" />

        <button
          class="inputList__action"
          :disabled="isAddingElement"
          @click="addNewElement(newValueForInput)">
          {{ isAddingElement ? $t('InputList.addOnGoing') : $t('InputList.add') }}
        </button>
      </li>

    </ul>

    <div class="inputList__error" v-if="hasError">
      {{ errorText }}
    </div>

    <div class="inputList__description">
      <template v-if="description">{{ description }}</template>
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'InputList',
  data () {
    return {
      isAddingElement: false,
      valuesInArray: this.$props.values,
      newValueForInput: '',
      hasError: false,
      errorText: ''
    };
  },
  props: {
    title: String,
    description: String,
    placeholder: String,
    values: {
      type: Array,
      default: () => ([])
    },
    fieldValidator: {
      type: Function,
      default: () => ({ isValid: true })
    },
    addElementToState: {
      type: Boolean,
      default: true
    }
  },
  watch: {
    values (newValues) {
      this.valuesInArray = newValues;
    }
  },
  methods: {
    addNewElement (elementValue) {
      this.isAddingElement = true;
      const validationCheck = this.fieldValidator(elementValue);
      const validationResult = validationCheck.then ? validationCheck : Promise.resolve(validationCheck);

      validationResult.then(
        ({ isValid, errorText }) => {
          this.isAddingElement = false;

          if (!isValid) {
            return this.setError(errorText);
          }

          if (this.addElementToState) {
            this.valuesInArray.push(elementValue);
          }

          this.newValueForInput = '';
          this.resetError();
          this.onElementAdded();
        }
      );
    },

    deleteElement (index) {
      const removedElement = this.valuesInArray.splice(index, 1);
      this.onElementRemoved(removedElement[0]);
    },

    onElementAdded (addedElement) {
      this.$emit('addElement', {
        addedElement,
        allElements: this.valuesInArray
      });
    },

    onElementRemoved (removedElement) {
      this.$emit('removeElement', {
        removedElement,
        allElements: this.valuesInArray
      });
    },

    setError (errorText) {
      this.hasError = true;
      this.errorText = errorText || '';
    },

    resetError () {
      this.hasError = false;
      this.errorText = '';
    },

    fillInputValue (newValue) {
      this.newValueForInput = newValue;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.inputList {
  font-family: 'Open Sans', sans-serif;
}

.inputList__label {
  display: block;
  font-size: 12px;
  line-height: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.inputList__block {
  display: flex;
  align-items: baseline;
}

.inputList__element {
  flex: 1 0 auto;
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

  &[readonly='readonly'] {
    background-color: rgba(0,0,0,0.05);
  }
}

.inputList__action {
  width: 60px;
  padding-left: 16px;
  color: $color-primary;
  font-size: 12px;
  line-height: 22px;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }

  &.inputList__delete {
    color: $danger__color;
  }
}

.inputList__error {
  text-transform: capitalize;
  color: #e20703;
  font-size: 10px;
}

.inputList__description {
  font-size: 10px;
  line-height: 16px;
  color: $neutral--600;
}
</style>
