import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'

export default function SettingsModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    honesty_mode: false
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings)
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      await axios.put('/auth/settings', settings)
      setMessage('Settings saved successfully! 🎉')
      setTimeout(() => {
        setMessage('')
        onClose()
      }, 2000)
    } catch (err) {
      setMessage('Failed to save settings. Please try again.')
      console.error('Settings save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">⚙️</span>
              Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Settings Options */}
          <div className="space-y-6">
            {/* Honesty Mode */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🎭</span>
                  <div>
                    <h3 className="font-medium text-gray-900">Honesty Mode</h3>
                    <p className="text-sm text-gray-600">
                      Get more direct, practical responses from your AI companion
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('honesty_mode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.honesty_mode ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.honesty_mode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-md p-3">
                <div className="text-sm text-gray-700">
                  <strong>{settings.honesty_mode ? 'ON' : 'OFF'}:</strong> {' '}
                  {settings.honesty_mode 
                    ? 'AI will give you straightforward, practical advice even if it might be challenging to hear.'
                    : 'AI will provide gentle, supportive responses focused on emotional comfort.'
                  }
                </div>
              </div>
            </div>

            {/* Future settings can go here */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔜</span>
                <div>
                  <h3 className="font-medium text-gray-700">More Settings Coming</h3>
                  <p className="text-sm text-gray-500">
                    Themes, notifications, data export, and more features in development!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('success') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}