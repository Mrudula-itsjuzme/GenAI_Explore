import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const MOOD_COLORS = {
  happy: '#fbbf24',
  sad: '#3b82f6', 
  anxious: '#8b5cf6',
  excited: '#f59e0b',
  calm: '#10b981',
  frustrated: '#ef4444',
  grateful: '#ec4899',
  lonely: '#6366f1',
  confident: '#f97316',
  overwhelmed: '#8b5cf6',
  peaceful: '#059669',
  angry: '#dc2626',
  hopeful: '#06b6d4',
  tired: '#6b7280',
  energetic: '#eab308',
  content: '#84cc16'
}

export default function Calendar() {
  const [calendarData, setCalendarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    fetchCalendarData()
  }, [])

  const fetchCalendarData = async () => {
    try {
      const response = await axios.get('/calendar')
      setCalendarData(response.data)
    } catch (err) {
      setError('Failed to load calendar data')
      console.error('Error fetching calendar data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getMoodColor = (mood) => {
    return MOOD_COLORS[mood] || '#6b7280'
  }

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }

  const getMoodForDate = (date) => {
    if (!calendarData) return null
    const dateStr = format(date, 'yyyy-MM-dd')
    return calendarData.daily_moods[dateStr] || null
  }

  const getMoodInsightsChart = () => {
    if (!calendarData?.mood_insights) return []
    
    return Object.entries(calendarData.mood_insights).map(([mood, count]) => ({
      name: mood.charAt(0).toUpperCase() + mood.slice(1),
      value: count,
      color: getMoodColor(mood)
    })).sort((a, b) => b.value - a.value)
  }

  const getMoodTrendsChart = () => {
    if (!calendarData?.mood_insights) return []
    
    // Create a chart showing mood frequency
    return Object.entries(calendarData.mood_insights).map(([mood, count]) => ({
      mood: mood.charAt(0).toUpperCase() + mood.slice(1),
      count: count,
      fill: getMoodColor(mood)
    })).sort((a, b) => b.count - a.count)
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mood Calendar</h1>
          <p className="text-gray-600">Track your emotional patterns and insights over time</p>
        </div>
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading your mood calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <span className="mr-3">📅</span>
          Mood Calendar
        </h1>
        <p className="text-gray-600">Track your emotional patterns and insights over time</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!calendarData || Object.keys(calendarData.daily_moods || {}).length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Start Tracking Your Moods</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Add mood tags to your journal entries to see patterns and insights in your emotional journey.
          </p>
          <a href="/journal" className="btn-primary">
            Add Your First Mood Entry
          </a>
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                  className="btn-ghost p-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="btn-ghost text-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                  className="btn-ghost p-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map(date => {
                const mood = getMoodForDate(date)
                const isCurrentMonth = isSameMonth(date, currentDate)
                const isTodayDate = isToday(date)
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`relative aspect-square p-2 rounded-lg transition-colors ${
                      isCurrentMonth
                        ? isTodayDate
                          ? 'bg-primary-100 border-2 border-primary-500'
                          : 'hover:bg-gray-100'
                        : 'text-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {format(date, 'd')}
                    </div>
                    {mood && (
                      <div 
                        className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: getMoodColor(mood) }}
                        title={`Feeling ${mood}`}
                      ></div>
                    )}
                  </button>
                )
              })}
            </div>
            
            {selectedDate && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{format(selectedDate, 'MMMM d, yyyy')}</strong>
                  {getMoodForDate(selectedDate) && (
                    <span className="ml-2">
                      - Feeling <span className="font-medium capitalize">{getMoodForDate(selectedDate)}</span>
                    </span>
                  )}
                </p>
                {!getMoodForDate(selectedDate) && (
                  <p className="text-sm text-gray-500 mt-1">No mood data for this day</p>
                )}
              </div>
            )}
          </div>

          {/* Mood Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood Distribution */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution</h3>
              {getMoodInsightsChart().length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getMoodInsightsChart()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {getMoodInsightsChart().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} days`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No mood data available</p>
                </div>
              )}
            </div>

            {/* Mood Frequency */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Frequency</h3>
              {getMoodTrendsChart().length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getMoodTrendsChart()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="mood" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No mood data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Mood Legend */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Legend</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {Object.entries(MOOD_COLORS).map(([mood, color]) => (
                <div key={mood} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-sm text-gray-700 capitalize">{mood}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
