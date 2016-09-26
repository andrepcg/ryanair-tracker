const views = require('co-views')

let swig = require('swig')

swig.setFilter('toDays', input =>
	parseInt(input / 1000 / 60 / 60 / 24)
)

swig.setFilter('round', (input, places) => {
	places = parseInt(places)
	let r = Math.pow(10, places)
	return (Math.round(input * r) / r)
})

module.exports = views('./views', {
	map: {
		html: 'swig',
		md: 'hogan'
	}
})
