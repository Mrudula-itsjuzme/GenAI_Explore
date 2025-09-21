import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import TextareaAutosize from 'react-textarea-autosize'

const MOOD_TAGS = [
  'happy', 'sad', 'anxious', 'excited', 'calm', 'frustrated',
  'grateful', 'lonely', 'confident', 'overwhelmed', 'peaceful',
  'angry', 'hopeful', 'tired', 'energetic', 'content'
]

const JOURNAL_CATEGORIES = [
  { value: 'general', name: 'General', emoji: '📝', description: 'Everyday thoughts and reflections' },
  { value: 'rant', name: 'Rant Space', emoji: '💢', description: 'Let it all out - no judgement' },
  { value: 'wishes', name: 'Wishes', emoji: '⭐', description: 'Things you wish you had done' },
  { value: 'dreams', name: 'Dreams', emoji: '💭', description: 'Hopes and aspirations' },
  { value: 'goals', name: 'Goals', emoji: '🎯', description: 'Things you want to achieve' },
  { value: 'gratitude', name: 'Gratitude', emoji: '🙏', description: 'What you\'re thankful for' }
]

export default function Journal() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [isWriting, setIsWriting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    text: '',
    mood_tag: '',
    category: 'general'
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await axios.get('/journal')
      setEntries(response.data)
    } catch (err) {
      setError('Failed to load journal entries')
      console.error('Error fetching entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.text.trim()) {
      setError('Please write something in your journal entry')
      return
    }

    try {
      const entryData = {
        text: formData.text.trim(),
        mood_tag: formData.mood_tag || null,
        category: formData.category || 'general'
      }

      if (editingId) {
        // Update existing entry
        const response = await axios.put(`/journal/${editingId}`, entryData)
        setEntries(entries.map(entry => 
          entry.id === editingId ? response.data : entry
        ))
        setEditingId(null)
      } else {
        // Create new entry
        const response = await axios.post('/journal', entryData)
        setEntries([response.data, ...entries])
      }

      // Reset form
      setFormData({ text: '', mood_tag: '', category: 'general' })
      setIsWriting(false)
    } catch (err) {
      setError('Failed to save journal entry')
      console.error('Error saving entry:', err)
    }
  }

  const handleEdit = (entry) => {
    setFormData({
      text: entry.text,
      mood_tag: entry.mood_tag || '',
      category: entry.category || 'general'
    })
    setEditingId(entry.id)
    setIsWriting(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return
    }

    try {
      await axios.delete(`/journal/${id}`)
      setEntries(entries.filter(entry => entry.id !== id))
    } catch (err) {
      setError('Failed to delete journal entry')
      console.error('Error deleting entry:', err)
    }
  }

  const cancelEdit = () => {
    setFormData({ text: '', mood_tag: '', category: 'general' })
    setEditingId(null)
    setIsWriting(false)
    setError('')
  }

  const getMoodColor = (mood) => {
    const moodColors = {
      happy: 'bg-yellow-400',
      sad: 'bg-blue-500',
      anxious: 'bg-purple-500',
      excited: 'bg-orange-400',
      calm: 'bg-green-500',
      frustrated: 'bg-red-500',
      grateful: 'bg-pink-500',
      lonely: 'bg-indigo-500',
      confident: 'bg-orange-500',
      overwhelmed: 'bg-purple-600',
      peaceful: 'bg-green-600',
      angry: 'bg-red-600',
      hopeful: 'bg-cyan-500',
      tired: 'bg-gray-500',
      energetic: 'bg-yellow-500',
      content: 'bg-lime-500'
    }
    return moodColors[mood] || 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Journal</h1>
          <p className="text-gray-600">Write and reflect on your thoughts and feelings</p>
        </div>
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading your journal entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Journal</h1>
          <p className="text-gray-600">Write and reflect on your thoughts and feelings</p>
        </div>
        {!isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="btn-primary flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Entry
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Writing Form */}
      {isWriting && (
        <div className="card animate-slide-up">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                What kind of entry is this?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {JOURNAL_CATEGORIES.map(category => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: category.value })}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      formData.category === category.value
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    title={category.description}
                  >
                    <div className="text-lg mb-1">{category.emoji}</div>
                    <div className="font-medium text-sm text-gray-900">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
                How are you feeling? (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {MOOD_TAGS.map(mood => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood_tag: mood })}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.mood_tag === mood
                        ? 'bg-primary-100 text-primary-800 border-2 border-primary-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                What's on your mind?
              </label>
              <TextareaAutosize
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Write freely about your thoughts, feelings, experiences, or anything that comes to mind..."
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                minRows={4}
                maxRows={12}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Journal Entries */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Start Your Journey</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Welcome to your personal journal space. This is where you can reflect, process thoughts, and track your emotional journey.
            </p>
            <button
              onClick={() => setIsWriting(true)}
              className="btn-primary"
            >
              Write Your First Entry
            </button>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="card group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-500">
                    {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                  </div>
                  {entry.mood_tag && (
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getMoodColor(entry.mood_tag)}`}></div>
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {entry.mood_tag}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                    title="Edit entry"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete entry"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {entry.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
