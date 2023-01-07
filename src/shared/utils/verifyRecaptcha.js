const axios = require('axios').default

module.exports.verifyRecaptcha = async (gReCaptchaToken) => {
  if (process.env.RECAPTCHA_ENABLED !== 'true') {
    return true
  }

  try {
    const reCaptchaRes = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${gReCaptchaToken}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    const reCaptchaData = reCaptchaRes.data
    return reCaptchaData && reCaptchaData.success && reCaptchaData.score >= 0.5
  } catch (error) {
    return false
  }
}
