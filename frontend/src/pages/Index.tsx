import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'

interface Stop {
  location: string
  minDays: number
  maxDays: number
}

export default function Index() {
  const navigate = useNavigate()
  const [passengers, setPassengers] = useState('1')
  const [cabin, setCabin] = useState('economy')
  const [departure, setDeparture] = useState('')
  const [departureDate, setDepartureDate] = useState<Date | undefined>()
  const [stops, setStops] = useState<Stop[]>([])
  const [destination, setDestination] = useState('')
  const [returnDate, setReturnDate] = useState<Date | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateIATA = (code: string) => /^[A-Z]{3}$/.test(code)

  const isFormValid = () => {
    if (!validateIATA(departure) || !validateIATA(destination)) return false
    if (!departureDate || !returnDate) return false
    if (departureDate >= returnDate) return false
    if (!stops.every(s => validateIATA(s.location) && s.minDays <= s.maxDays)) return false
    return true
  }

  const handleSearch = async () => {
    if (!isFormValid()) return
    setLoading(true)
    setError(null)

    // Transform to the backend's UserTrip format
    const userTrip = {
      start_point: {
        name: departure,
        date_constraint: {
          min_date: format(departureDate!, 'yyyy-MM-dd'),
          max_date: format(departureDate!, 'yyyy-MM-dd'),
        },
      },
      points_of_interest: stops.map(stop => ({
        arrival_name: stop.location,
        departure_name: stop.location,
        duration_constraint: { min_days: stop.minDays, max_days: stop.maxDays },
      })),
      end_point: {
        name: destination,
        date_constraint: {
          min_date: format(returnDate!, 'yyyy-MM-dd'),
          max_date: format(returnDate!, 'yyyy-MM-dd'),
        },
      },
      adults: parseInt(passengers),
      seat_type: cabin,
    }

    try {
      const response = await fetch('/api/flights/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userTrip),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Server error ${response.status}: ${text}`)
      }

      const results = await response.json()
      sessionStorage.setItem('flightResults', JSON.stringify(results))
      sessionStorage.setItem('searchMeta', JSON.stringify({
        departure,
        destination,
        stops,
        passengers: parseInt(passengers),
        cabin,
        departureDate: format(departureDate!, 'yyyy-MM-dd'),
        returnDate: format(returnDate!, 'yyyy-MM-dd'),
      }))
      navigate('/results')
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch flights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addStop = () => setStops([...stops, { location: '', minDays: 1, maxDays: 7 }])

  const removeStop = (index: number) => setStops(stops.filter((_, i) => i !== index))

  const updateStop = (index: number, field: keyof Stop, value: any) => {
    const next = [...stops]
    next[index] = { ...next[index], [field]: value }
    setStops(next)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg backdrop-blur-md bg-white/70 border border-white/40 shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Multi-City Flight Search</h1>

          <div className="space-y-6">
            {/* Passengers and Cabin */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Passengers</Label>
                <Select value={passengers} onValueChange={setPassengers}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cabin Class</Label>
                <Select value={cabin} onValueChange={setCabin}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium-economy">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Departure */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Departure Airport (IATA)</Label>
                <Input
                  placeholder="e.g., CDG"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value.toUpperCase())}
                  maxLength={3}
                />
              </div>
              <div>
                <Label>Departure Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {departureDate ? format(departureDate, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Stops */}
            {stops.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Intermediate Stops</h3>
                {stops.map((stop, index) => (
                  <div key={index} className="mb-4 p-4 bg-white/60 rounded-lg border">
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <div>
                        <Label>Airport (IATA)</Label>
                        <Input
                          placeholder="e.g., LHR"
                          value={stop.location}
                          onChange={(e) => updateStop(index, 'location', e.target.value.toUpperCase())}
                          maxLength={3}
                        />
                      </div>
                      <div>
                        <Label>Min Days</Label>
                        <Input
                          type="number"
                          value={stop.minDays}
                          onChange={(e) => updateStop(index, 'minDays', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label>Max Days</Label>
                        <Input
                          type="number"
                          value={stop.maxDays}
                          onChange={(e) => updateStop(index, 'maxDays', parseInt(e.target.value) || 7)}
                          min="1"
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeStop(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" onClick={addStop} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Stop
            </Button>

            {/* Destination and Return Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Return Airport (IATA)</Label>
                <Input
                  placeholder="e.g., CDG"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                  maxLength={3}
                />
              </div>
              <div>
                <Label>Return Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {returnDate ? format(returnDate, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleSearch}
              disabled={!isFormValid() || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            >
              {loading ? 'Searching...' : 'Search Flights'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
