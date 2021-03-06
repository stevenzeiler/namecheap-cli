const http = require("superagent")
const xml2js = require("xml2js")
const Logger = require("winston")

const api = require("./api/index.js")

const namecheapBaseURL = "https://api.namecheap.com/xml.response"

module.exports = config => {

  if (!config) { config = {} };

  config.ipAddress = config.apiAddress || process.env['NAMECHEAP_CLIENT_IP_ADDRESS']
  config.apiKey = config.apiKey || process.env['NAMECHEAP_API_KEY']
  config.apiUser = config.apiUser || process.env['NAMECHEAP_API_USER']

  if (!config.ipAddress) {

    throw new Error('config.ipAddress missing');

  }

  if (!config.apiUser) {

    throw new Error('config.apiUser missing');

  }

  if (!config.apiKey) {

    throw new Error('config.apiKey missing');
  }

  if (!config.registration) {

    config.registration = require('./config/registration.json')

  }

  this.config = config;

  var client = {}

  client.checkDomain = domain => {

    var command = "namecheap.domains.check"

    return new Promise((resolve, reject) => {

      var url =
      `${namecheapBaseURL}?ApiUser=${config.apiUser}&ApiKey=${config.apiKey}&UserName=${config.apiUser}&Command=${command}&ClientIp=${config.ipAddress}&DomainList=${domain}`;

      http
        .get(url)
        .end((error, response) => {
          if (error) { return reject(error) }

          xml2js.parseString(response.text, (error, xml) => {
            if (error) { return reject(error) }

            if (xml.ApiResponse['$']['Status'] === 'ERROR') {
              return reject(xml.ApiResponse['Errors'][0].Error);
            }

            try {
              resolve(xml.ApiResponse.CommandResponse[0].DomainCheckResult[0]['$'])
            } catch(e) {
              Logger.error('error parsing response', e)
              Logger.info('original response text', response.text)
            }
          })
        })
    })
  } 

  client.domains = {
    create: api.domains.create.bind(this),
    getList: api.domains.getList.bind(this),

    dns: {
      getList: api.domains.dns.getList.bind(this),
      setCustom: api.domains.dns.setCustom.bind(this)
    }
  }

  client.ssl = {
    getList: api.ssl.getList.bind(this),
    activate: api.ssl.activate.bind(this),
    getInfo: api.ssl.getInfo.bind(this)
  }

  return client

}

