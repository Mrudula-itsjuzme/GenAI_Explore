import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format, subDays } from 'date-fns'

export default function AIInsightsPanel() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weekData, setWeekData] = useState(null)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      const [calendarRes, journalRes] = await Promise.all([
        axios.get('/calendar'),
        axios.get('/journal')
      ])

      const moodData = calendarRes.data
      const journalEntries = journalRes.data

      generateInsights(moodData, journalEntries)
    } catch (err) {
      console.error('Error fetching insights:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = (moodData, entries) => {
    // Analyze recent week
    const today = new Date()
    const weekAgo = subDays(today, 7)
    
    const recentEntries = entries.filter(entry => 
      new Date(entry.created_at) >= weekAgo
    )

    // Most common moods this week
    const weekMoods = {}
    recentEntries.forEach(entry => {
      if (entry.mood_tag) {
        weekMoods[entry.mood_tag] = (weekMoods[entry.mood_tag] || 0) + 1
      }
    })

    const topMoods = Object.entries(weekMoods)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    // Detect patterns
    const patterns = detectPatterns(recentEntries)
    
    // Mood triggers analysis
    const triggers = analyzeTriggers(entries)
    
    // Positive reinforcements
    const boosters = analyzePositiveFactors(entries)

    setInsights({
      topMoods,
      patterns,
      triggers,
      boosters,
      totalEntries: recentEntries.length,
      averageMoodScore: calculateAverageMood(recentEntries)
    })

    // Generate week data for mini chart
    const weekChart = generateWeekChart(recentEntries)
    setWeekData(weekChart)
  }

  const detectPatterns = (entries) => {
    const patterns = []
    
    // Check for time-based patterns
    const timeOfDay = {}
    entries.forEach(entry => {
      const hour = new Date(entry.created_at).getHours()
      const period = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
      timeOfDay[period] = (timeOfDay[period] || 0) + 1
    })

    const mostActiveTime = Object.entries(timeOfDay).sort(([,a], [,b]) => b - a)[0]
    if (mostActiveTime) {
      patterns.push(`Most reflective during ${mostActiveTime[0]}`)
    }

    // Check for writing streaks
    if (entries.length >= 3) {
      patterns.push(`${entries.length} entries this week - great consistency! 🔥`)
    }

    return patterns
  }

  const analyzeTriggers = (entries) => {
    // Simple keyword analysis for negative moods
    const negativeEntries = entries.filter(entry => 
      ['sad', 'anxious', 'frustrated', 'angry', 'overwhelmed', 'lonely'].includes(entry.mood_tag)
    )

    const commonWords = {}
    negativeEntries.forEach(entry => {
      const words = entry.text.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.length > 4) { // Only consider longer words
          commonWords[word] = (commonWords[word] || 0) + 1
        }
      })
    })

    return Object.entries(commonWords)
      .filter(([word, count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word)
  }

  const analyzePositiveFactors = (entries) => {
    const positiveEntries = entries.filter(entry =>
      ['happy', 'excited', 'grateful', 'confident', 'peaceful', 'hopeful', 'content'].includes(entry.mood_tag)
    )

    const commonWords = {}
    positiveEntries.forEach(entry => {
      const words = entry.text.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.length > 4) {
          commonWords[word] = (commonWords[word] || 0) + 1
        }
      })
    })

    return Object.entries(commonWords)
      .filter(([word, count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word)
  }

  const calculateAverageMood = (entries) => {
    const moodScores = {
      'happy': 5, 'excited': 5, 'grateful': 5, 'confident': 5, 'peaceful': 4,
      'hopeful': 4, 'content': 4, 'energetic': 4, 'calm': 3,
      'tired': 2, 'lonely': 2, 'sad': 1, 'anxious': 1, 'frustrated': 1,
      'angry': 1, 'overwhelmed': 1
    }

    const scores = entries
      .filter(entry => entry.mood_tag && moodScores[entry.mood_tag])
      .map(entry => moodScores[entry.mood_tag])

    return scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length) : 3
  }

  const generateWeekChart = (entries) => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayEntries = entries.filter(entry => 
        format(new Date(entry.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      )
      
      days.push({
        day: format(date, 'EEE'),
        count: dayEntries.length,
        avgMood: calculateAverageMood(dayEntries)
      })
    }
    return days
  }

  const getMoodColor = (score) => {
    if (score >= 4.5) return 'bg-green-500'
    if (score >= 3.5) return 'bg-yellow-500'
    if (score >= 2.5) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Analyzing your patterns...</span>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="card text-center py-8">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insights</h3>
        <p className="text-gray-600">Write more journal entries to unlock personalized insights!</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">🧠</span>
          AI Insights
        </h3>
        <div className="text-sm text-gray-500">
          Last 7 days
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">{insights.totalEntries}</div>
          <div className="text-xs text-gray-500">Entries</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary-600">
            {insights.averageMoodScore.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">Avg Mood</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">{insights.topMoods.length}</div>
          <div className="text-xs text-gray-500">Moods</div>
        </div>
      </div>

      {/* Mini Week Chart */}
      {weekData && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">This Week</div>
          <div className="flex justify-between items-end h-8 space-x-1">
            {weekData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-sm ${getMoodColor(day.avgMood)} opacity-80`}
                  style={{ height: `${Math.max(10, (day.count / Math.max(...weekData.map(d => d.count)) * 100))}%` }}
                  title={`${day.day}: ${day.count} entries, mood ${day.avgMood.toFixed(1)}`}
                ></div>
                <div className="text-xs text-gray-400 mt-1">{day.day}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Moods */}
      {insights.topMoods.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Top Moods</div>
          <div className="flex flex-wrap gap-2">
            {insights.topMoods.map(([mood, count], index) => (
              <span 
                key={mood}
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  index === 0 ? 'bg-primary-100 text-primary-800' :
                  index === 1 ? 'bg-secondary-100 text-secondary-800' :
                  'bg-gray-100 text-gray-700'
                }`}
              >
                {mood} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Patterns */}
      {insights.patterns.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Patterns</div>
          {insights.patterns.map((pattern, index) => (
            <div key={index} className="text-sm text-gray-600 mb-1 flex items-center">
              <span className="mr-2">•</span>
              {pattern}
            </div>
          ))}
        </div>
      )}

      {/* Boosters & Triggers */}
      <div className="grid grid-cols-2 gap-4">
        {insights.boosters.length > 0 && (
          <div>
            <div className="text-sm font-medium text-green-700 mb-1 flex items-center">
              <span className="mr-1">💚</span>
              Mood Boosters
            </div>
            {insights.boosters.slice(0, 2).map((booster, index) => (
              <div key={index} className="text-xs text-green-600 capitalize">
                {booster}
              </div>
            ))}
          </div>
        )}
        
        {insights.triggers.length > 0 && (
          <div>
            <div className="text-sm font-medium text-orange-700 mb-1 flex items-center">
              <span className="mr-1">⚠️</span>
              Watch For
            </div>
            {insights.triggers.slice(0, 2).map((trigger, index) => (
              <div key={index} className="text-xs text-orange-600 capitalize">
                {trigger}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          🤖 AI analysis updates as you journal more
        </div>
      </div>
    </div>
  )
}