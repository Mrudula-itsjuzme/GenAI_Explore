import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'

const ART_STYLES = [
  { value: 'abstract', name: 'Abstract', icon: '🎨', description: 'Flowing shapes and colors' },
  { value: 'realistic', name: 'Realistic', icon: '🖼️', description: 'Detailed and lifelike' },
  { value: 'dreamy', name: 'Dreamy', icon: '✨', description: 'Ethereal and magical' },
  { value: 'minimalist', name: 'Minimalist', icon: '⚪', description: 'Clean and simple' },
  { value: 'impressionist', name: 'Impressionist', icon: '🌅', description: 'Soft brushstrokes' },
  { value: 'surreal', name: 'Surreal', icon: '🌀', description: 'Dreamlike and bizarre' },
  { value: 'watercolor', name: 'Watercolor', icon: '💧', description: 'Soft flowing paint' },
  { value: 'digital', name: 'Digital', icon: '💻', description: 'Modern and clean' }
]

export default function ArtWall() {
  const [journalEntries, setJournalEntries] = useState([])
  const [sharedArt, setSharedArt] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingArt, setGeneratingArt] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('abstract')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('create')

  useEffect(() => {
    Promise.all([
      fetchJournalEntries(),
      fetchSharedArt()
    ]).finally(() => setLoading(false))
  }, [])

  const fetchJournalEntries = async () => {
    try {
      const response = await axios.get('/journal')
      setJournalEntries(response.data)
    } catch (err) {
      console.error('Error fetching journal entries:', err)
    }
  }

  const fetchSharedArt = async () => {
    try {
      const response = await axios.get('/art/wall')
      setSharedArt(response.data)
    } catch (err) {
      console.error('Error fetching shared art:', err)
    }
  }

  const generateArt = async () => {
    if (!selectedEntry) {
      setError('Please select a journal entry first')
      return
    }

    setGeneratingArt(selectedEntry.id)
    setError('')

    try {
      const response = await axios.post('/art', {
        entry_id: selectedEntry.id,
        style: selectedStyle
      })
      
      // Show success message
      alert('Art generated successfully! It may take a moment to appear.')
      
      // Reset form
      setSelectedEntry(null)
      setSelectedStyle('abstract')
      
      // Refresh shared art if user chooses to share
      await fetchSharedArt()
      
    } catch (err) {
      setError('Failed to generate art. Please try again.')
      console.error('Error generating art:', err)
    } finally {
      setGeneratingArt(null)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Art Wall</h1>
          <p className="text-gray-600">Create and share expressive art from your journal entries</p>
        </div>
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading art gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <span className="mr-3">🎨</span>
          Art Wall
        </h1>
        <p className="text-gray-600">Create and share expressive art from your journal entries</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Create Art
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'gallery'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Community Gallery
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {activeTab === 'create' && (
        <>
          {/* Create Art Section */}
          {journalEntries.length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Create Your First Art Piece</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Start by writing some journal entries. Then you can transform your thoughts and feelings into beautiful art.
              </p>
              <a href="/journal" className="btn-primary">
                Write Your First Entry
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Entry Selection */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Journal Entry</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {journalEntries.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedEntry?.id === entry.id
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-500">
                          {format(new Date(entry.created_at), 'MMM d, yyyy')}
                        </div>
                        {entry.mood_tag && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full capitalize">
                            {entry.mood_tag}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {entry.text.substring(0, 120)}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Art Style Selection */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Art Style</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {ART_STYLES.map(style => (
                    <button
                      key={style.value}
                      onClick={() => setSelectedStyle(style.value)}
                      className={`p-3 text-left rounded-lg border transition-colors ${
                        selectedStyle === style.value
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-lg mb-1">{style.icon}</div>
                      <div className="font-medium text-sm text-gray-900">{style.name}</div>
                      <div className="text-xs text-gray-500">{style.description}</div>
                    </button>
                  ))}
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateArt}
                  disabled={!selectedEntry || generatingArt}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingArt ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Art...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Generate Art
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'gallery' && (
        <>
          {/* Community Gallery */}
          {sharedArt.length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Art Shared Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Be the first to create and share beautiful art inspired by personal reflections. All shared art is anonymous.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Community Art Gallery</h2>
                <p className="text-gray-600 text-sm">
                  Anonymous art pieces created by the community from their personal reflections. 
                  All art is shared anonymously to protect privacy.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sharedArt.map(art => (
                  <div key={art.id} className="card group hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={art.art_url}
                        alt={`${art.style} art`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/300/300'
                          e.target.alt = 'Art preview unavailable'
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {art.style}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(art.created_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">About Art Generation</h3>
            <p className="text-sm text-blue-800">
              Our AI transforms your written thoughts and emotions into visual art. The process is completely private - 
              only you can see art created from your entries unless you explicitly choose to share it anonymously.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
