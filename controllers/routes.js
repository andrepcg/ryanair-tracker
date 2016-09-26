const ryanair = require('../ryanair')
const render = require('../views')
const _ = require('lodash')
const moment = require('moment')
const request = require('co-request')
const wait = require('co-wait')

module.exports.index = function * () {
	const routes = yield ryanair.getRoutes()
	this.body = routes
	// this.body = yield render('routes', {routes: routes})
}

module.exports.random = function * () {
	const routes = yield ryanair.getRoutes()

	const from = _.sample(_.keys(routes))
	const to = _.sample(routes[from])
	let date = moment().add(_.random(3,5), 'months')

	const fares = yield ryanair.getFares(from, to, date.year(), date.format('MM'))
	const days = Object.keys(fares)
	let randomFares = _.sampleSize(days, days.length / 2)
	randomFares = randomFares.map(day => day.length === 1 ? `0${day}` : day)

	for (let day of randomFares) {
		yield request(`http://localhost:1337/flights/${from}-${to}/${date.format('YYYY-MM')}-${day}`)
		yield wait(300)
		console.log(`http://localhost:1337/flights/${from}-${to}/${date.format('YYYY-MM')}-${day}`)
	}
	this.body = 'oi'
	// this.redirect(`/search/${from}-${to}/${date.format('YYYY-MM')}`)
}