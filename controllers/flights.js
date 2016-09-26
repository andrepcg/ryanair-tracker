
const db = require('monk')('mongodb://admin:123456@ds023315.mlab.com:23315/heroku_9mwx4qh8')
const wrap = require('co-monk')
const flights = wrap(db.get('flights'))
const ryanair = require('../ryanair')
const render = require('../views')
const money = require('money')
const oxr = require('open-exchange-rates')

oxr.set({ app_id: 'aa2e26e3a6b543d29970c043471871cf' })

oxr.latest(function() {
	money.rates = oxr.rates;
	money.base = oxr.base;
});


function parseDate(date) {
	let s = date.split('-')
	//return { year: parseInt(s[0], 10), month: parseInt(s[1], 10), day: parseInt(s[2], 10)}
	return { year: s[0], month: s[1], day: s[2], date: new Date(parseInt(s[0]), parseInt(s[1]) - 1, parseInt(s[2])) }
}

function * createNewFlight(from, to, dateString, dateParsed) {
	let flightFare = yield ryanair.getFlightFare(from, to, dateParsed.year, dateParsed.month, dateParsed.day)

	if (flightFare != null){

		if(flightFare.flights.regularFare.fares.length === 0)
			return

		let regularFare = flightFare.flights.regularFare.fares[0]

		let val = regularFare.amount
		if(flightFare.currency != 'EUR') {
			val = Math.round(money(regularFare.amount).from(flightFare.currency).to('EUR') * 100) / 100
		}

		return yield flights.insert({
			from,
			to,
			date: dateString,
			flightNumber: flightFare.flights.flightNumber,
			timestamp: new Date(flightFare.flights.timeUTC[0]),
			prices: [ { crawlDate: Date.now(), price: { faresLeft: flightFare.flights.faresLeft, value: val, currencyCode: 'EUR', hasDiscount: regularFare.hasDiscount, originalValue: regularFare.publishedFare } } ]
		})
	}
	else
		return null
}



module.exports.listFlights = function * (next) {
	let from = this.request.query.from
	let to = this.request.query.to

	let res

	if(from && to)
		res = yield flights.find({from, to}, {sort : ['timestamp', 'asc']})
	else
		res = yield flights.find({}, {sort : ['timestamp', 'asc']})

	// find flights with discount price from the previous day
	res.forEach(flight => {
		if (flight.prices.length >= 3) {
			let dif = flight.prices[flight.prices.length - 1].price.value - flight.prices[flight.prices.length - 3].price.value
			dif = Math.round(dif * 100) / 100

			if (dif < -2 )
				flight.hasDiscount = dif
		}

	})

	this.body = yield render('flights', { flights: res })
}

module.exports.updatePrice = function * (from, to, dateString){
	let date = parseDate(dateString)

	if (Date.now() > date.date)
		return

	let flightFare = yield ryanair.getFlightFare(from, to, date.year, date.month, date.day)
	if(!flightFare.flights.hasOwnProperty('regularFare')) return;
	let regularFare = flightFare.flights.regularFare.fares[0]

	let val = regularFare.amount
	if(flightFare.currency != 'EUR') {
		val = Math.round(money(regularFare.amount).from(flightFare.currency).to('EUR') * 100) / 100
	}

	return yield flights.update(
		{ from, to, date: dateString },
		{ $set: {flightNumber: flightFare.flights.flightNumber, timestamp: new Date(flightFare.flights.timeUTC[0])}, $push: { prices: { crawlDate: Date.now(), price: { faresLeft: flightFare.flights.faresLeft, value: val, currencyCode: 'EUR', hasDiscount: regularFare.hasDiscount, originalValue: regularFare.publishedFare } } } }
	)
}

module.exports.updateFlight = function * (next) {
	let from = this.params.from
	let to = this.params.to
	let date = this.params.date

	yield module.exports.updatePrice(from, to, date)
	this.redirect(`/flight/${from}-${to}/${date}`)
}

module.exports.flightDetails = function * (next) {
	let from = this.params.from
	let to = this.params.to
	let date = parseDate(this.params.date)

	let flight = yield flights.findOne({ from, to, date: this.params.date })

	if (!flight) {
		flight = yield createNewFlight(from, to, this.params.date, date)
	}

	this.body = yield render('flight', {flight})

}
