const _ = require('lodash');

function priceByDay(prices) {
	const days = {};

	prices.forEach(price => {
		const date = new Date(price.crawlDate)
		days[date.toDateString()] = price.price.value;
		// arr.push({crawlDate: price.crawlDate, price: price.price.value})
	})

	return days;
}

// TODO: sum prices by date
module.exports.sumTripPrices = function(pricesOut, pricesIn) {

	// pricesOutByDay = priceByDay(pricesOut)
	pricesInByDay = priceByDay(pricesIn)

	let arr = []
	pricesOut.forEach(price => {
		const priceIn = pricesInByDay[new Date(price.crawlDate).toDateString()];
		if (priceIn) arr.push({crawlDate: price.crawlDate, price: price.price.value + priceIn})
	})

	/*pricesIn.forEach((price, i) => {
		arr[i].price += price.price.value
	})*/

	return arr;
}
