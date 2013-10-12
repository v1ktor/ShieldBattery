// Put log and bw first to ensure we can log as much as possible in the event of a crash
var log = require('./shieldbattery/logger')
process.on('uncaughtException', function(err) {
  log.error(err.stack)
  // give the log time to write out
  setTimeout(function() {
    process.exit()
  }, 100)
})

var bw = require('bw')
bw.on('log', function(level, msg) {
  log.log(level, msg)
})

var forge = require('forge')
if (!forge.inject()) {
  throw new Error('forge injection failed')
} else {
  log.verbose('forge injected')
}

var io = require('socket.io-client')
  , path = require('path')
  , host = require('./shieldbattery/host')
  , join = require('./shieldbattery/join')

var socket = io.connect('https://lifeoflively.net:33198/game')

socket.on('connect', function() {
  log.verbose('Connected to psi.')
}).on('disconnect', function() {
  log.verbose('Disconnected from psi...')
}).on('error', function(err) {
  log.error('Error connecting to psi, is it running? Error: ' + err)
}).on('hostMode', function() {
  log.verbose('enabling host mode')
  host(socket, forge)
}).on('joinMode', function() {
  log.verbose('enabling join mode')
  join(socket, forge)
}).on('quit', function() {
  setTimeout(function() {
    process.exit()
  }, 100)
})


