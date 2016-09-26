
const db = require('monk')('mongodb://admin:123456@ds023315.mlab.com:23315/heroku_9mwx4qh8')
const wrap = require('co-monk')
const trips = wrap(db.get('trips'))
const flights = wrap(db.get('flights'))
const render = require('../views')
const forEach = require('co-foreach')
const co = require('co')
const utils = require('../utils')

function * populateTrip(trip) {
	let f = yield [
		flights.find({ _id: trip.flightOut }),
		flights.find({ _id: trip.flightIn })
	]

	let outF = f[0][0]
	let inF = f[1][0]

	outF.lastPrice = outF.prices[outF.prices.length - 1].price.value
	inF.lastPrice = inF.prices[inF.prices.length - 1].price.value

	return {id: trip._id, out: outF, in: inF}
}

function * getTrips () {
	let t = yield trips.find({})

	yield forEach(t, function * (trip, index){
		t[index] = yield populateTrip(trip)
	})

	return t
}


module.exports.listTrips = function * (next) {
	let t = yield getTrips()

	this.body = yield render('trips', { trips: t })
}

module.exports.getTrip = function * (next) {
	let t = yield trips.findOne({ _id: this.params.id})
	t = yield populateTrip(t)
	t.sumPrices = utils.sumTripPrices(t.out.prices, t.in.prices)

	this.body = yield render('trip', { trip: t })
}
