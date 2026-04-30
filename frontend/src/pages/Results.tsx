import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

// Shapes coming from the backend
interface RawFlightResult {
  price: number
  airlines: string
  departure_time: string
  arrival_time: string
  flight_duration: string
  layovers: number
}

interface RawTripFlight {
  from_airport: string
  to_airport: string
  departure_date: string
  result: RawFlightResult[] | null
  url: string
}

interface RawScenario {
  flights: RawTripFlight[]
  min_total_price: number
}

// Display shapes used by this component
interface DisplayFlight {
  airline: string
  departure: string
  arrival: string
  departureDate: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  bookingUrl: string
}

interface DisplayLeg {
  flights: DisplayFlight[]
}

interface DisplayScenario {
  legs: DisplayLeg[]
  totalPrice: number
}

function transformScenarios(raw: RawScenario[]): DisplayScenario[] {
  return raw.map(s => ({
    legs: s.flights.map(f => ({
      flights: (f.result ?? []).map(r => ({
        airline: r.airlines ?? '',
        departure: f.from_airport,
        arrival: f.to_airport,
        departureDate: f.departure_date,
        departureTime: r.departure_time ?? '',
        arrivalTime: r.arrival_time ?? '',
        duration: r.flight_duration ?? '',
        price: r.price ?? 0,
        bookingUrl: f.url ?? '#',
      })),
    })),
    totalPrice: s.min_total_price ?? 0,
  }))
}

export default function Results() {
  const navigate = useNavigate()
  const [scenarios, setScenarios] = useState<DisplayScenario[]>([])

  useEffect(() => {
    const stored = sessionStorage.getItem('flightResults')
    if (!stored) {
      navigate('/')
      return
    }
    const raw: RawScenario[] = JSON.parse(stored)
    setScenarios(transformScenarios(raw))
  }, [navigate])

  const cheapestIndex = (flights: DisplayFlight[]) =>
    flights.reduce((min, f, i) => (f.price < flights[min].price ? i : min), 0)

  if (scenarios.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No results found.</p>
          <Button onClick={() => navigate('/')}>Back to Search</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Button variant="outline" onClick={() => navigate('/')} className="mb-6">
          ← Back to Search
        </Button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {scenarios.length} trip scenario{scenarios.length !== 1 ? 's' : ''} found
        </h2>

        <div className="space-y-6">
          {scenarios.map((scenario, si) => (
            <Card key={si} className="overflow-hidden shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle>Scenario {si + 1}</CardTitle>
                  <span className="text-2xl font-bold">
                    {scenario.totalPrice > 0 ? `€${scenario.totalPrice}` : 'Price TBD'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {scenario.legs.map((leg, li) => (
                    <div key={li} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3">
                        Leg {li + 1}
                        {leg.flights[0] && (
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            {leg.flights[0].departure} → {leg.flights[0].arrival}
                            {' · '}{leg.flights[0].departureDate}
                          </span>
                        )}
                      </h3>

                      {leg.flights.length === 0 ? (
                        <p className="text-gray-500 text-sm">No flight options available.</p>
                      ) : (
                        <div className="space-y-2">
                          {leg.flights.map((flight, fi) => {
                            const isCheapest = fi === cheapestIndex(leg.flights)
                            return (
                              <div
                                key={fi}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  isCheapest
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-semibold text-blue-600 mb-1">
                                      {flight.airline || 'Unknown airline'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                                      <span className="font-semibold">{flight.departure}</span>
                                      <ArrowRight className="w-4 h-4" />
                                      <span className="font-semibold">{flight.arrival}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {flight.departureTime && flight.arrivalTime
                                        ? `${flight.departureTime} – ${flight.arrivalTime}`
                                        : ''}
                                      {flight.duration ? ` · ${flight.duration}` : ''}
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="text-2xl font-bold text-blue-600 mb-2">
                                      {flight.price > 0 ? `€${flight.price}` : '—'}
                                    </div>
                                    <a
                                      href={flight.bookingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Button size="sm">Book</Button>
                                    </a>
                                  </div>
                                </div>
                                {isCheapest && (
                                  <Badge className="mt-2 bg-green-600 text-white">Cheapest</Badge>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
