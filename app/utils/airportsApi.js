const ENDPOINT = 'https://api.transavia.com/v2/airports/'
const APIKEY = 'A0cvrUD3FvGNbSWJpxAdAkDPVsWBZm5w'

export function getAirports() {
	let request = new Request(ENDPOINT, {
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
