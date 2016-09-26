const flightsController = require('./controllers/flights')
const co = require('co')
const db = require('monk')('mongodb://admin:123456@ds023315.mlab.com:23315/heroku_9mwx4qh8')
const wrap = require('co-monk')
const flights = wrap(db.get('flights'))
const wait = require('co-wait')

co(function *() {
	console.log('Update started', new Date())
	let res = yield flights.find({ timestamp: { $gt: new Date() } })

	for (let flight of res) {
		yield flightsController.updatePrice(flight.from, flight.to, flight.date)
		yield wait(600)
	}

})
.then(function() {
	console.log('Update finished', new Date())
	process.exit(0)
})
.catch(function (err) {
	console.error(err)
})
