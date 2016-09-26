const render = require('../views')
const db = require('monk')('mongodb://admin:123456@ds023315.mlab.com:23315/heroku_9mwx4qh8')
const wrap = require('co-monk')
const flights = wrap(db.get('flights'))
const _ = require('lodash')


const processFlightStats = flight => {
	const meanPrice = _.meanBy(flight.prices, 'price.value')
	const minPriceObj = _.minBy(flight.prices, 'price.value')
	const minPrice = { price: minPriceObj.price.value, daysUntilTrip: _.round((flight.timestamp - minPriceObj.crawlDate) / 1000 / 60 / 60 / 24) }

	const priceVariation = {}

	_.forEach(flight.prices, p => {
		const daysUntilTrip = _.round((flight.timestamp - p.crawlDate) / 1000 / 60 / 60 / 24)
		const deltaVariation = _.round((1 - (meanPrice / p.price.value)) * 100)

		if (_.has(priceVariation, daysUntilTrip)) {
			priceVariation[daysUntilTrip].push(deltaVariation)
		}
		else {
			priceVariation[daysUntilTrip] = [deltaVariation]
		}
	})

	return { priceVariation: priceVariation, lowestPrice: minPrice }
}

function customizer(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}


module.exports.index = function * (next) {
	const res = yield flights.find({})

	var histogram = {}
	var data = []
	var lowestDayPrices = []

	for (let flight of res) {
		const stats = processFlightStats(flight)
		histogram = _.mergeWith(histogram, stats.priceVariation, customizer)
		lowestDayPrices.push(stats.lowestPrice.daysUntilTrip)
	}

	_.forEach(histogram, (value, key) => {
		// _.forEach(value, price => console.log(key, price))
		_.forEach(value, price => data.push([parseInt(key), price]))

	});

	// this.body = yield { histogram: histogram }

	this.body = yield render('stats', { data: data, lowestDayPrices: lowestDayPrices })
}
