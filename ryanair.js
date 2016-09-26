const co = require('co')
const request = require('co-request')
const _ = require('lodash')

/*
[
	{ day: 1, ...},
	{ day: 20, ...},
	...
]
*/
function formatSchedule (days){
	let out = {
		availableDays: [],
		days: {}
	}

	days.forEach(function(day) {
		out.availableDays.push(day.day)
		out.days[day.day] = day
	})

	return out
}

/*
	fares = [
		{price, soldout, unavailable, day: '2016-09-01'}
	]
*/
function formatFares (fares) {
	let out = {}
	let count = 1

	fares.forEach(function(day) {
		if (day.unavailable === false) {
			out[count] = day
		}
		count++
	})

	return out
}

let cachedRoutes = null

function formatRoutes (routes) {
	const r = {};
	
	_.forEach(routes, route => {
		if (!_.has(r, route.airportFrom)) {
			r[route.airportFrom] = [route.airportTo]
		}
		else {
			r[route.airportFrom].push(route.airportTo)
		}
	});

	cachedRoutes = r

	return r;
}

module.exports.getRoutes = function * () {
	if (cachedRoutes) return cachedRoutes;
	
	let result = yield request('https://api.ryanair.com/core/3/routes')

	if(result.statusCode == 200) {
		let json = JSON.parse(result.body)
		return formatRoutes(json)
	}
}

module.exports.getMonthSchedule = function * (from, to, year, month) {
	let result = yield request(`https://api.ryanair.com/timetable/3/schedules/${from}/${to}/years/${year}/months/${month}`)

	if(result.statusCode == 200) {
		let json = JSON.parse(result.body)
		return formatSchedule(json.days)
	}
}


module.exports.getFares = function * (from, to, year, month){
	let result = yield request(`https://api.ryanair.com/farefinder/3/oneWayFares/${from}/${to}/cheapestPerDay?&outboundMonthOfDate=${year}-${month}-01&currency=EUR`)

	if(result.statusCode == 200) {
		let json = JSON.parse(result.body)
		let fares = json.outbound.fares
		return formatFares(fares)
	}
}


module.exports.getAvailableFlights = function * (from, to, year, month, day){
	let result = yield request(`https://desktopapps.ryanair.com/pt-pt/availability?ADT=1&CHD=0&DateOut=${year}-${month}-${day}&Destination=${to}&INF=0&Origin=${from}&RoundTrip=false&TEEN=0`)

	if(result.statusCode == 200) {
		let json = JSON.parse(result.body)
		let flights = json.trips[0].dates[0].flights
		if (flights.length > 0)
			return {flights: flights[0], currency: json.currency}
	}
}

module.exports.getFlightFare = function * (from, to, year, month, day) {
	return yield module.exports.getAvailableFlights(from, to, year, month, day)
}
