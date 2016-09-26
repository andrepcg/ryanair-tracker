const koa = require('koa')
const compress = require('koa-compress')
const json = require('koa-json')
const bodyParser = require('koa-bodyparser')
const logger = require('koa-logger')
const router = require('koa-router')
const flightsController = require('./controllers/flights')
const tripsController = require('./controllers/trips')
const searchController = require('./controllers/search')
const statsController = require('./controllers/stats')
const routesController = require('./controllers/routes')

let app = koa();

app.use(logger());

app.use(bodyParser());
app.use(compress());
app.use(json());

let flights = new router({ prefix: '/flights' });
let trips = new router({ prefix: '/trips' });
let search = new router({ prefix: '/search' });
let routes = new router({ prefix: '/routes' });
let home = new router();

flights.get('/', flightsController.listFlights);
flights.get('/:from-:to/:date', flightsController.flightDetails);
flights.get('/:from-:to/:date/update', flightsController.updateFlight);

trips.get('/', tripsController.listTrips);
trips.get('/:id', tripsController.getTrip);

search.get('/:from-:to/:year-:month', searchController.search);

routes.get('/', routesController.index);
routes.get('/random', routesController.random);

home.get('/stats', statsController.index)
home.get('/', function *() {
	this.body = 'Héllo Uould'
})

app
	.use(home.routes())
	.use(trips.routes())
	.use(flights.routes())
	.use(search.routes())
	.use(routes.routes())
	//.use(flights.allowedMethods());

if (!module.parent) {
	let port = process.env.PORT || 1337
	app.listen(port);
	console.log('listening on port ' + port);
}
