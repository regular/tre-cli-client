const {join, resolve} = require('path')
const ssbKeys = require('scuttlebot-release/node_modules/ssb-keys')
const ssbClient = require('scuttlebot-release/node_modules/ssb-client')
const retry = require('dont-stop-believing')
const conf = require('rc')('tre')

const retryClient = retry(ssbClient)

module.exports = function(cb) {
  const configPath = conf.config
  if (!configPath) {
    return cb(new Error('.trerc not found, use --config CONFIG'))
  }
  const ssbPath = conf.path || join(configPath, '../.tre')
  ssbKeys.load(join(ssbPath, 'secret'), (err, keys) => {
    if (err) return cb(err)

    retryClient(keys, Object.assign({},
      conf, { manifest: {manifest: 'async'} }
    ), (err, ssb) => {
      if (err) return cb(err)
      ssb.manifest( (err, manifest) => {
        if (err) return cb(err)
        ssb.close()
        ssbClient(keys, Object.assign({},
          conf, { manifest } 
        ), (err, ssb) => {
          if (err) return cb(err)
          cb(null, ssb, conf, keys)
        })
      })
    })
  })
}
