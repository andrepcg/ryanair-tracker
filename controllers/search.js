const ryanair = require('../ryanair')
const render = require('../views')

module.exports.search = function * () {
	let from = this.params.from
	let to = this.params.to
	let year = this.params.year
	let month = this.params.month

	let schedule = yield ryanair.getFares(from, to, year, month)

	this.body = yield render('search', {from, to, year, month, flights: schedule})
}
