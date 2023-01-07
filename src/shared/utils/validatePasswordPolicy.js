module.exports = {
  validatePasswordPolicy(value) {
    // Validate lowercase letters
    const lowerCaseLetters = /[a-z]/g
    if (!value.match(lowerCaseLetters)) {
      return 'At least one lowerase is required'
    }

    // Validate capital letters
    const upperCaseLetters = /[A-Z]/g
    if (!value.match(upperCaseLetters)) {
      return 'At least one uppercase is required'
    }

    // Validate numbers
    const numbers = /[0-9]/g
    if (!value.match(numbers)) {
      return 'At least one digit is required'
    }

    // Validate length
    if (value.length < 8) {
      return 'Length must be at least 8'
    }

    return 'success'
  },
}
