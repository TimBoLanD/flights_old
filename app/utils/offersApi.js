const ENDPOINT = 'https://api.transavia.com/v1/flightoffers/'
const APIKEY = 'A0cvrUD3FvGNbSWJpxAdAkDPVsWBZm5w'

export function getOffers(from, date, daysAtDestination, adults, children) {
	let request = new Request(ENDPOINT + `?Origin=${from}&OriginDepartureDate=${date}&DaysAtDestination=${daysAtDestination}&Adults=${adults}&Children=${children}`, {
		headers: new Headers({
			'apikey': APIKEY
		})
	})

	return fetch(request)
		.then(res => res.json())
		.catch(err => {
			console.log(err)
		})
}
