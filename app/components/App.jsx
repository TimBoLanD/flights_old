import React from 'react'

import Search from './Search.jsx'

import {Container, Menu, Message, Image, Segment} from 'semantic-ui-react'

export default class App extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			mode: "search",
		}
	}


	render() {
		return (
		 	<div>
				<Menu fixed='top' inverted>
					<Container>
						<Menu.Item header>
							Favorable flights
						</Menu.Item>
					</Container>
				</Menu>
				
				<Container style={{ marginTop: '5em' }}>
					<Message info>
						<Message.Header>Ever wanted to book a vacation but you didn't explicitly know where or when to go?</Message.Header>
						<p>Favorable flights will search for matching flights based on your needs within the specified period. It will check all possible flights from the departure airport and filter the ones which don't exceed the maximum flight duration. Then it will give a score to the remaining flights based on the arrival time on location, departure time from location and ticket price. For now the preferred arrival time on location is fixed to 10.00 and the departure time from location to 22.00. These flights give the most favorable time to spent on the vacation with the lowest costs.</p>
					</Message>
				</Container>

				<Search />
			</div>
		)
	}
}
