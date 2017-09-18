import React from 'react'

import {getAirports} from '../utils/airportsApi.js'
import {getOffers} from '../utils/offersApi.js'

import {Button, Card, Container, Dimmer, Dropdown, Form, Grid, Header, Icon, Input, Item, Label, Loader, Segment, Table} from 'semantic-ui-react'

export default class Search extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			departureAirport: null,
			travelTimeHours: 0,
			travelTimeMinutes: 0,
			periodStartDate: null,
			periodEndDate: null,
			daysAtDestination: 1,
			flightDurationHours: 0,
			flightDurationMinutes: 0,
			adults: 1,
			children: 0,
			babies: 0,
			airports: [],
			offers: [],
			isSearching: false,
			searchCount: 0
		}
	}

	componentDidMount() {
		// TODO store airports in cache for 1 day
		getAirports().then(airports => {
			this.setState({
				airports: airports.sort((a, b) => {
					a = a.name.toLowerCase();
					b = b.name.toLowerCase();
					return a < b ? -1 : a > b ? 1 : 0;
				})
			})
		})
	}

	// Always output as string
	leadingZero(number) {
		if (number < 10) {
			return '0' + number
		} else {
			return '' + number
		}
	}

	search(e) {

		// New search, clear old results
		this.setState({
			offers: [],
			isSearching: true,
			searchCount: 0
		})


		// foreach day in travel period try to search for possible flights. Keep in mind that last possible day must be lower than ('period end date' - 'days at destination')
		let periodStartDate = this.state.periodStartDate;
		let periodEndDate = this.state.periodEndDate;
		let lastPossibleDay = new Date(periodEndDate).setDate(periodEndDate.getDate() - this.state.daysAtDestination);

		for (var currentDay = periodStartDate; currentDay <= lastPossibleDay; currentDay.setDate(currentDay.getDate() + 1)) {
			let formattedDate = "" + currentDay.getFullYear() + this.leadingZero(currentDay.getMonth() + 1) + this.leadingZero(currentDay.getDate());

			// Give scores to flight offers based on low pricing & best flight times
			getOffers(
				this.state.departureAirport, 
				formattedDate,
				this.state.daysAtDestination,
				this.state.adults,
				this.state.children
			).then(data => {
					// Filter out the flight with a flight duration higher then the maximun flight duration given
					let filteredData = data.flightOffer.filter(flightOffer => {
						let maxFlightTimeHours = this.state.travelTimeHours
						let maxFlightTimeMinutes = this.state.travelTimeMinutes
						let maxFlightTime = (maxFlightTimeHours * 3600 + maxFlightTimeMinutes * 60) * 1000

						let inboundDepartureDateTime = new Date(flightOffer.inboundFlight.departureDateTime)
						let inboundArrivalDateTime = new Date(flightOffer.inboundFlight.arrivalDateTime)
						
						let inboundDiff = inboundArrivalDateTime - inboundDepartureDateTime;

						let outboundDepartureDateTime = new Date(flightOffer.outboundFlight.departureDateTime)
						let outboundArrivalDateTime = new Date(flightOffer.outboundFlight.arrivalDateTime)
						
						let outboundDiff = outboundArrivalDateTime - outboundDepartureDateTime;

						return Math.max(inboundDiff, outboundDiff) < maxFlightTime 
					})

					// Give scores to each flightoffer
					filteredData.map(offer => {
						let score = 0;

						let dateTime = new Date(offer.outboundFlight.arrivalDateTime);
						let time = (dateTime.getHours() * 60) + dateTime.getMinutes();

						// TODO Make outbound arrival time variable
						// 600 = 10.00
						score += Math.abs(time - 600);

						dateTime = new Date(offer.inboundFlight.departureDateTime);
						time = (dateTime.getHours() * 60) + dateTime.getMinutes();

						// TODO Make inbound departure time variable
						// 1320 = 22.00
						score += Math.abs(time - 1320);

						score += offer.pricingInfoSum.totalPriceOnePassenger;

						offer.score = score;
					});

					// Adjust the ordering of the offers best score first
					this.setState({
						offers: this.state.offers.concat(filteredData).sort((a, b) => {
							return a.score - b.score;
						}),
						isSearching: false
					})
				})
		}
	}

	handleDepartureAirport(e, data) {
		this.setState({
			departureAirport: data.value
		})
	}

	handleMinus(e, name = null) {
		if (name == null) {
			return
		}

		this.setState({
			[name]: parseInt(this.state[name]) === 0 ? 0 : parseInt(this.state[name]) - 1
		})
	}

	handlePlus(e, name = null) {
		if (name == null) {
			return
		}

		this.setState({
			[name]: parseInt(this.state[name]) + 1
		})
	}

	handleOnChange(e, name = null) {
		if (name == null) {
			return
		}

		this.setState({
			[name]: e.target.value == '' ? '' : e.target.value <= 0 ? 0 : e.target.value
		})
	}

	handleCalendarOnChange(e, name = null) {
		if (name == null) {
			return
		}

		let date = new Date(e.target.value);

		this.setState({
			[name]: date
		})
	}

	getAirport(id) {
		let airports = this.state.airports.filter((airport, index) => {
			return airport.id == id
		})

		// TODO if airports length > 1 we have a duplicate and we need to fix it
		if (airports.length == 1) {
			return airports[0]
		} else {
			return null
		}
	}

	render() {
		// Create the airports selection dataset
		// TODO put the airports matching the country of the current geolocation on the top of the list
		let airports = this.state.airports.map(airport => {
			return {
				key: airport.id, 
				value: airport.id,
				text: `${airport.name}, ${airport.country.name}`
			}
		})

		// console.log(this.state.offers);

		// TODO split into multiple components
		return (
			<Container style={{ marginTop: '1em' }}>
				<Segment padded>
					<Label attached='top'>What does your trip look like?</Label>
					<Form>
						<Form.Dropdown placeholder='Choose your departure airport' fluid search selection options={airports} onChange={this.handleDepartureAirport.bind(this)} label='Departure airport'/>
						<Grid columns={2} stackable>
							<Grid.Column>
								<Form.Input type='number' value={this.state.travelTimeHours} onChange={(e) => this.handleOnChange(e, 'travelTimeHours')} label='Flighttime (hours)' action>
									<input />
									<Button icon onClick={(e) => this.handleMinus(e, 'travelTimeHours')}>
										<Icon name='minus' />
									</Button>
									<Button icon onClick={(e) => this.handlePlus(e, 'travelTimeHours')}>
										<Icon name='plus' />
									</Button>
								</Form.Input>
							</Grid.Column>
							<Grid.Column>
								<Form.Input type='number' value={this.state.travelTimeMinutes} onChange={(e) => this.handleOnChange(e, 'travelTimeMinutes')} action label="Flighttime (minutes)">
									<input />
									<Button icon onClick={(e) => this.handleMinus(e, 'travelTimeMinutes')}>
										<Icon name='minus' />
									</Button>
									<Button icon onClick={(e) => this.handlePlus(e, 'travelTimeMinutes')}>
										<Icon name='plus' />
									</Button>
								</Form.Input>
							</Grid.Column>
						</Grid>
						<Grid columns={3} stackable>
							<Grid.Column>
								<Form.Input type='date' icon='calendar' placeholder='' label='Leave from' onChange={(e) => this.handleCalendarOnChange(e, 'periodStartDate')}/>
							</Grid.Column>
							<Grid.Column>
								<Form.Input type='date' icon='calendar' placeholder='' label='Back on' onChange={(e) => this.handleCalendarOnChange(e, 'periodEndDate')}/>
							</Grid.Column>
							<Grid.Column>
								<Form.Input type='number' value={this.state.daysAtDestination} onChange={(e) => this.handleOnChange(e, 'daysAtDestination')} action label="Days at destination">
									<input />
									<Button icon onClick={(e) => this.handleMinus(e, 'daysAtDestination')}>
										<Icon name='minus' />
									</Button>
									<Button icon onClick={(e) => this.handlePlus(e, 'daysAtDestination')}>
										<Icon name='plus' />
									</Button>
								</Form.Input>
							</Grid.Column>
						</Grid>
						<Grid columns={3} stackable>
							<Grid.Column>
								<Form.Input type='number' value={this.state.adults} onChange={(e) => this.handleOnChange(e, 'adults')} label='Adults (> 11 year)' action>
									<input />
									<Button icon onClick={(e) => this.handleMinus(e, 'adults')}>
										<Icon name='minus' />
									</Button>
									<Button icon onClick={(e) => this.handlePlus(e, 'adults')}>
										<Icon name='plus' />
									</Button>
								</Form.Input>
							</Grid.Column>
							<Grid.Column>
								<Form.Input type='number' value={this.state.children} onChange={(e) => this.handleOnChange(e, 'children')} action label="Children (2 - 11 year)">
									<input />
									<Button icon onClick={(e) => this.handleMinus(e, 'children')}>
										<Icon name='minus' />
									</Button>
									<Button icon onClick={(e) => this.handlePlus(e, 'children')}>
										<Icon name='plus' />
									</Button>
								</Form.Input>
							</Grid.Column>
							<Grid.Column>
								<Form.Input type='number' value={this.state.babies} onChange={(e) => this.handleOnChange(e, 'babies')} action label="Babies (< 2 year)">
									<input />
									<Button icon onClick={(e) => this.handleMinus(e, 'babies')}>
										<Icon name='minus' />
									</Button>
									<Button icon onClick={(e) => this.handlePlus(e, 'babies')}>
										<Icon name='plus' />
									</Button>
								</Form.Input>
							</Grid.Column>
						</Grid>
						
						<Button loading={this.state.isSearching} onClick={() => this.search()} primary style={{ marginTop: '1em' }}>Search</Button>
						<p>Please scroll down to see the results (if any).</p>
					</Form>
				</Segment>
				
				{(this.state.isSearching == true || this.state.offers.length > 0) &&
					<Segment padded>
						{this.state.isSearching &&
							<Dimmer active inverted>
								<Loader inverted>Loading</Loader>
							</Dimmer>
						}
						<Label attached='top'>Flights matching your trip details</Label>
						<Item.Group divided>
							{this.state.offers.map((offer, index) => (
								<Item>
									<Item.Content>
										<Item.Description>
											<Item.Group divided>
												<Item>
													<Item.Content>
														<Item.Header><Icon name='plane' /> {this.getAirport(offer.outboundFlight.departureAirport.locationCode).name}, {this.getAirport(offer.outboundFlight.departureAirport.locationCode).country.name} - {this.getAirport(offer.outboundFlight.arrivalAirport.locationCode).name}, {this.getAirport(offer.outboundFlight.arrivalAirport.locationCode).country.name}</Item.Header>
														<Table celled>
															<Table.Header>
																<Table.Row>
																	<Table.HeaderCell><Icon name='calendar' /></Table.HeaderCell>
																	<Table.HeaderCell><Icon name='plane' /></Table.HeaderCell>
																	<Table.HeaderCell><Icon name='plane' flipped='vertically' /></Table.HeaderCell>
																	<Table.HeaderCell><Icon name='tag' /></Table.HeaderCell>
																	<Table.HeaderCell colSpan='2'><Icon name='ticket' /></Table.HeaderCell>
																</Table.Row>
															</Table.Header>
															<Table.Body>
																<Table.Row>
																	<Table.Cell>{new Date(offer.outboundFlight.departureDateTime).toLocaleDateString()}</Table.Cell>
																	<Table.Cell>{new Date(offer.outboundFlight.departureDateTime).toLocaleTimeString()}</Table.Cell>
																	<Table.Cell>{new Date(offer.outboundFlight.arrivalDateTime).toLocaleTimeString()}</Table.Cell>
																	<Table.Cell>{offer.outboundFlight.id}</Table.Cell>
																	<Table.Cell>&euro; {offer.outboundFlight.pricingInfo.totalPriceOnePassenger}</Table.Cell>
																	<Table.Cell>&euro; {offer.outboundFlight.pricingInfo.totalPriceAllPassengers}</Table.Cell>
																</Table.Row>
															</Table.Body>
														</Table>	
													</Item.Content>
												</Item>
												<Item>
													<Item.Content>
														<Item.Header><Icon name='plane' flipped='vertically'/> {this.getAirport(offer.inboundFlight.departureAirport.locationCode).name}, {this.getAirport(offer.inboundFlight.departureAirport.locationCode).country.name} - {this.getAirport(offer.inboundFlight.arrivalAirport.locationCode).name}, {this.getAirport(offer.inboundFlight.arrivalAirport.locationCode).country.name}</Item.Header>
														<Table celled>
															<Table.Header>
																<Table.Row>
																	<Table.HeaderCell><Icon name='calendar' /></Table.HeaderCell>
																	<Table.HeaderCell><Icon name='plane' /></Table.HeaderCell>
																	<Table.HeaderCell><Icon name='plane' flipped='vertically' /></Table.HeaderCell>
																	<Table.HeaderCell><Icon name='tag' /></Table.HeaderCell>
																	<Table.HeaderCell colSpan='2'><Icon name='ticket' /></Table.HeaderCell>
																</Table.Row>
															</Table.Header>
															<Table.Body>
																<Table.Row>
																	<Table.Cell>{new Date(offer.inboundFlight.departureDateTime).toLocaleDateString()}</Table.Cell>
																	<Table.Cell>{new Date(offer.inboundFlight.departureDateTime).toLocaleTimeString()}</Table.Cell>
																	<Table.Cell>{new Date(offer.inboundFlight.arrivalDateTime).toLocaleTimeString()}</Table.Cell>
																	<Table.Cell>{offer.inboundFlight.id}</Table.Cell>
																	<Table.Cell>&euro; {offer.inboundFlight.pricingInfo.totalPriceOnePassenger}</Table.Cell>
																	<Table.Cell>&euro; {offer.inboundFlight.pricingInfo.totalPriceAllPassengers}</Table.Cell>
																</Table.Row>
															</Table.Body>
														</Table>	
													</Item.Content>
												</Item>
											</Item.Group>
										</Item.Description>
										<Item.Extra>
											 <Label size='massive' color='teal' tag >&euro; {offer.pricingInfoSum.totalPriceAllPassengers}</Label>

											<Button primary floated='right' href={offer.deeplink.href} target='_blank'>
												Book
												<Icon name='right chevron' />
											</Button>
										</Item.Extra>
									</Item.Content>
								</Item>
							))}
						</Item.Group>
					</Segment>
				}
			</Container>
		)
	}
}
