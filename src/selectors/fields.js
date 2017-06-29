import find from 'lodash/find'
import map from 'lodash/map'
import filter from 'lodash/filter'
import last from 'lodash/last'
import { POSTAL_CODE, ONE_LEVEL, TWO_LEVELS, THREE_LEVELS } from '../constants'

export function getField(fieldName, rules) {
  return find(rules.fields, ({ name }) => name === fieldName)
}

export function hasOptions(field) {
  return !!(field.options || field.optionsPairs || field.optionsMap)
}

function getFieldValue(field) {
  return typeof field === 'object' ? field.value : field
}

export function getListOfOptions(field, address, rules) {
  if (field.options) {
    return map(field.options, toValueAndLabel)
  }

  if (field.optionsPairs) {
    return field.optionsPairs
  }

  if (field.optionsMap && field.basedOn && field.level === 2) {
    const basedOn = getFieldValue(address[field.basedOn])
    if (basedOn && field.optionsMap[basedOn]) {
      const options = field.optionsMap[basedOn]
      return map(options, toValueAndLabel)
    }

    return []
  }

  if (field.optionsMap && field.basedOn && field.level === 3) {
    const secondLevelField = getField(field.basedOn, rules)
    const firstLevelField = getField(secondLevelField.basedOn, rules)

    const secondLevelValue = getFieldValue(address[secondLevelField.name])
    const firstLevelValue = getFieldValue(address[firstLevelField.name])

    if (
      firstLevelValue &&
      secondLevelValue &&
      field.optionsMap[firstLevelValue] &&
      field.optionsMap[firstLevelValue][secondLevelValue]
    ) {
      const options = field.optionsMap[firstLevelValue][secondLevelValue]
      return map(options, toValueAndLabel)
    }

    return []
  }

  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Invalid rule set')
  } else {
    return []
  }
}

function toValueAndLabel(option) {
  return { value: option, label: option }
}

export function getDependentFields(fieldName, rules) {
  let dependentFields = []

  if (fieldAffectsPostalCode(fieldName, rules)) {
    dependentFields = [...dependentFields, 'postalCode']
  }

  const dependentField = getFieldBasedOn(fieldName, rules)
  if (dependentField) {
    dependentFields = [...dependentFields, dependentField]

    const secondLevelField = getFieldBasedOn(dependentField, rules)
    if (secondLevelField) {
      dependentFields = [...dependentFields, secondLevelField]
    }
  }

  return dependentFields
}

function getFieldBasedOn(fieldName, rules) {
  const field = find(rules.fields, ({ basedOn }) => basedOn === fieldName)
  return field ? field.name : null
}

export function filterFields(rules) {
  switch (rules.postalCodeFrom) {
    case THREE_LEVELS:
      return filter(
        rules.fields,
        ({ name }) => rules.postalCodeLevels.indexOf(name) === -1
      )
    case TWO_LEVELS:
      return filter(
        rules.fields,
        ({ name }) => rules.postalCodeLevels.indexOf(name) === -1
      )
    case ONE_LEVEL:
      return filter(rules.fields, ({ name }) => rules.postalCodeLevel !== name)
    default:
    case POSTAL_CODE:
      return filter(rules.fields, ({ name }) => name !== 'postalCode')
  }
}

function fieldAffectsPostalCode(fieldName, rules) {
  return (
    fieldName === rules.postalCodeLevel ||
    (rules.postalCodeLevels && rules.postalCodeLevels.indexOf(fieldName) !== -1)
  )
}

export function isDefiningPostalCodeField(fieldName, rules) {
  const lastLevelField = rules.postalCodeLevel || last(rules.postalCodeLevels)

  return fieldName === lastLevelField
}