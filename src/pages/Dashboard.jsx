import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AIInsightsPanel from '../components/AIInsightsPanel'

export default function Dashboard() {
  const { user } = useAuth()

  const features = [
    {
      name: 'Journal',
      description: 'Write and reflect on your thoughts and feelings',
      href: '/journal',
      icon: 'book',
      color: 'bg-blue-500'
    },
    {
      name: 'Chat with Mudi',
      description: 'Talk with your AI companion for support and guidance',
      href: '/chat',
      icon: 'chat',
      color: 'bg-purple-500'
    },
    {
      name: 'Mood Calendar',
      description: 'Track your emotional patterns and insights',
      href: '/calendar',
      icon: 'calendar',
      color: 'bg-green-500'
    },
    {
      name: 'Art Wall',
      description: 'Create and share expressive art from your journal',
      href: '/art',
      icon: 'art',
      color: 'bg-pink-500'
    }
  ]

  const icons = {
    book: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
    chat: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    ),
    calendar: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
    art: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl text-white p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.display_name}! 🌟
        </h1>
        <p className="text-primary-100 text-lg">
          I'm here to support your mental wellness journey. How are you feeling today?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600 mb-1">0</div>
          <div className="text-sm text-gray-500">Journal Entries</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-secondary-600 mb-1">0</div>
          <div className="text-sm text-gray-500">Chat Sessions</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-success-600 mb-1">0</div>
          <div className="text-sm text-gray-500">Art Pieces Created</div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="mb-8">
        <AIInsightsPanel />
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.name}
            to={feature.href}
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {icons[feature.icon]}
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {feature.name}
                </h3>
                <p className="text-gray-500 mt-1">
                  {feature.description}
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/journal" className="btn-primary">
            Start Writing
          </Link>
          <Link to="/chat" className="btn-secondary">
            Chat with Mudi
          </Link>
          <Link to="/calendar" className="btn-ghost">
            View Mood Calendar
          </Link>
        </div>
      </div>
    </div>
  )
}