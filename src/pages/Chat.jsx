import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'

const CHAT_MODES = {
  supportive: {
    name: 'Supportive',
    description: 'Gentle and empathetic responses',
    icon: '💝',
    color: 'text-pink-600'
  },
  practical: {
    name: 'Practical',
    description: 'Action-oriented advice',
    icon: '🎯',
    color: 'text-blue-600'
  },
  honest: {
    name: 'Direct',
    description: 'Straightforward and honest feedback',
    icon: '🎭',
    color: 'text-purple-600'
  }
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I'm Mudi, your AI companion. I'm here to listen and support you through whatever you're experiencing. How are you feeling today?",
      timestamp: new Date(),
      contextUsed: []
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentMode, setCurrentMode] = useState('supportive')
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || isLoading) {
      return
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      contextUsed: []
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post('/chat', {
        message: userMessage.content,
        mode: currentMode
      })

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        contextUsed: response.data.context_used || []
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError('Failed to get response from Mudi. Please try again.')
      console.error('Chat error:', err)
      
      // Add fallback message
      const fallbackMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm having trouble connecting right now, but I'm here to listen. Could you tell me more about what's on your mind? Sometimes just putting thoughts into words can be helpful.",
        timestamp: new Date(),
        contextUsed: []
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const clearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          id: 1,
          type: 'assistant',
          content: "Hi! I'm Mudi, your AI companion. I'm here to listen and support you. How are you feeling today?",
          timestamp: new Date(),
          contextUsed: []
        }
      ])
    }
  }

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <span className="mr-3">💬</span>
            Chat with Mudi
          </h1>
          <p className="text-gray-600">Your AI companion for emotional support and guidance</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Mode:</span>
            <select
              value={currentMode}
              onChange={(e) => setCurrentMode(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(CHAT_MODES).map(([key, mode]) => (
                <option key={key} value={key}>
                  {mode.icon} {mode.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={clearChat}
            className="btn-ghost text-sm"
            title="Clear chat history"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Mode Description */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <span className="text-lg mr-2">{CHAT_MODES[currentMode].icon}</span>
          <span className="font-medium text-gray-900 mr-2">
            {CHAT_MODES[currentMode].name} Mode
          </span>
          <span className="text-sm text-gray-600">
            - {CHAT_MODES[currentMode].description}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 mb-4 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-96">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                {message.type === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">M</span>
                  </div>
                )}
                
                <div className="flex flex-col">
                  <div className={`chat-bubble ${message.type}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 px-2">
                    <span className="text-xs text-gray-400">
                      {format(message.timestamp, 'h:mm a')}
                    </span>
                    {message.contextUsed && message.contextUsed.length > 0 && (
                      <div 
                        className="text-xs text-gray-400 cursor-help flex items-center"
                        title={`Based on your journal entries: ${message.contextUsed.join(', ')}`}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Context used
                      </div>
                    )}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">M</span>
                </div>
                <div className="chat-bubble assistant">
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Form */}
        <div className="border-t border-gray-100 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
                maxLength={1000}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="btn-primary self-end px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Help Text */}
      <div className="text-xs text-gray-500 text-center">
        <p>💡 Tip: Mudi uses your journal entries to provide more personalized support. Your conversations are private and secure.</p>
      </div>
    </div>
  )
}
