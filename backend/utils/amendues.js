import Amadeus from 'amadeus';


const amadeus = new Amadeus({
  clientId: 'X5VMUfNAAgwXxdyGOLL32zMBjdUkJkwE',
  clientSecret: 'dD1V3aVEzyZwHlPd',
  hostname: 'test.api.amadeus.com' // Explicitly set test environment
});

const amadeusService = {
  async searchFlights(origin, destination, departureDate) {
    try {
      // Call Amadeus Flight Offers Search API
      const response = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: '1', // Default to 1 adult
        currencyCode: 'USD', // Default currency
        max: 50 // Limit to 50 results
      });

      // Format response data
      const flightOffers = response.data.map(offer => {
        const itinerary = offer.itineraries[0]; // First itinerary (outbound)
        const segments = itinerary.segments;
        return {
          flightId: offer.id,
          airlineCode: segments[0].carrierCode,
          flightNumber: segments[0].number,
          departure: {
            airportCode: segments[0].departure.iataCode,
            time: segments[0].departure.at
          },
          arrival: {
            airportCode: segments[segments.length - 1].arrival.iataCode,
            time: segments[segments.length - 1].arrival.at
          },
          duration: itinerary.duration,
          numberOfStops: segments.length - 1,
          price: {
            total: offer.price.total,
            currency: offer.price.currency
          }
        };
      });

      return {
        origin,
        destination,
        departureDate,
        flights: flightOffers
      };
    } catch (error) {
      throw new Error(error.response?.data?.errors?.[0]?.detail || 'Failed to fetch flight data');
    }
  }
};

export default amadeusService;