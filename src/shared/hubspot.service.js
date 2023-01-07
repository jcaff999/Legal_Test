const XMLHttpRequest = require('xhr2')

module.exports = {
  submitNewsletter(email) {
    // Create the new request
    const xhr = new XMLHttpRequest()
    const url =
      'https://api.hsforms.com/submissions/v3/integration/submit/21422664/ae983a79-5ec3-4f91-b542-6ca74afbc876'

    // Example request JSON:
    const data = {
      submittedAt: new Date(),
      fields: [
        {
          objectTypeId: '0-1',
          name: 'email',
          value: email,
        },
      ],
      context: {
        // hutk: ':hutk', // include this parameter and set it to the hubspotutk cookie value to enable cookie tracking on your submission
        pageUri: process.env.FRONTEND_URL + '/signup',
        pageName: 'Sign Up',
      },
      legalConsentOptions: {
        // Include this object when GDPR options are enabled
        consent: {
          consentToProcess: true,
          text: 'I agree to allow Example Company to store and process my personal data.',
          communications: [
            {
              value: true,
              subscriptionTypeId: 999,
              text: 'I agree to receive marketing communications from Example Company.',
            },
          ],
        },
      },
    }

    const finalData = JSON.stringify(data)

    xhr.open('POST', url)
    // Sets the value of the 'Content-Type' HTTP request headers to 'application/json'
    xhr.setRequestHeader('Content-Type', 'application/json')

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        console.log(xhr.responseText) // Returns a 200 response if the submission is successful.
      } else if (xhr.readyState === 4 && xhr.status === 400) {
        console.log(xhr.responseText) // Returns a 400 error the submission is rejected.
      } else if (xhr.readyState === 4 && xhr.status === 403) {
        console.log(xhr.responseText) // Returns a 403 error if the portal isn't allowed to post submissions.
      } else if (xhr.readyState === 4 && xhr.status === 404) {
        console.log(xhr.responseText) // Returns a 404 error if the formGuid isn't found
      }
    }

    // Sends the request

    xhr.send(finalData)
  },

  addContact(email) {
    const request = require('request')

    const options = {
      method: 'POST',
      url: 'https://api.hubapi.com/contacts/v1/contact/',
      qs: { hapikey: process.env.HUBSPOT_API_KEY },
      headers: { 'Content-Type': 'application/json' },
      body: {
        properties: [
          { property: 'email', value: email },
          // { property: 'firstname', value: 'test' },
          // { property: 'lastname', value: 'testerson' },
          // { property: 'website', value: 'http://hubspot.com' },
          // { property: 'company', value: 'HubSpot' },
          // { property: 'phone', value: '555-122-2323' },
          // { property: 'address', value: '25 First Street' },
          // { property: 'city', value: 'Cambridge' },
          // { property: 'state', value: 'MA' },
          // { property: 'zip', value: '02139' }
        ],
      },
      json: true,
    }

    request(options, function (error, response, body) {
      if (error) throw new Error(error)

      console.log(body)
    })
  },
}
