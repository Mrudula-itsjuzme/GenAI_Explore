import React, { useState, useEffect } from 'react'
import axios from 'axios'

const PET_STATES = {
  thriving: {
    emoji: '🦋',
    color: 'text-green-500',
    animation: 'animate-bounce',
    expressions: ['✨', '🌟', '💖', '🎉'],
    casualMessages: [
      "Hey there! I'm absolutely glowing today! ✨",
      "Your energy is making me sparkle! 🌟",
      "I feel like I could fly to the moon! 🚀",
      "You're crushing it! Keep being awesome! 💫",
      "I'm practically buzzing with excitement! ⚡"
    ],
    reactions: {
      poke: "Hehe! That tickles! 😸",
      pet: "Mmm, I love the attention! 🥰",
      feed: "*munches happily* This is delicious! 😋"
    }
  },
  happy: {
    emoji: '🐛',
    color: 'text-blue-500',
    animation: 'animate-pulse',
    expressions: ['😊', '😄', '🥰', '😸'],
    casualMessages: [
      "What's up? I'm feeling pretty good today! 😊",
      "Life's treating us well, huh? 😄",
      "I love hanging out with you! 🥰",
      "Tell me something cool that happened today! 🌈",
      "I'm your cheerful little buddy! 🎈"
    ],
    reactions: {
      poke: "Hey! *giggles* What's that for? 😆",
      pet: "Aww, that feels nice! 😌",
      feed: "Yummy! Got any more? 😋"
    }
  },
  neutral: {
    emoji: '🐣',
    color: 'text-yellow-500',
    animation: 'animate-float',
    expressions: ['🙂', '😐', '🤔', '😌'],
    casualMessages: [
      "Just chilling here with you! 😌",
      "How's your day going? 🤔",
      "I'm here whenever you need me! 💛",
      "Want to chat about anything? 🗨️",
      "Taking things one step at a time! 🐾"
    ],
    reactions: {
      poke: "Hmm? What's happening? 🤔",
      pet: "Thanks for the attention! 😊",
      feed: "Oh, for me? Thank you! 😋"
    }
  },
  concerned: {
    emoji: '🥚',
    color: 'text-orange-500',
    animation: 'animate-pulse',
    expressions: ['😟', '🥺', '😔', '💙'],
    casualMessages: [
      "I'm a bit worried about you... 🥺",
      "Want to talk about what's bothering you? 💙",
      "I'm here to listen, always! 👂",
      "We can get through anything together! 🤝",
      "You're stronger than you think! 💪"
    ],
    reactions: {
      poke: "*looks up sadly* Hi... 🥺",
      pet: "*nuzzles closer* Thank you... 💙",
      feed: "You're so kind to me... 😢"
    }
  },
  struggling: {
    emoji: '💫',
    color: 'text-red-400',
    animation: 'animate-pulse',
    expressions: ['😢', '💔', '🥀', '🌧️'],
    casualMessages: [
      "I'm feeling a bit dim right now... 💔",
      "The world feels heavy today... 🌧️",
      "I believe things will get better... 🌱",
      "Even stars need time to shine again... ⭐",
      "I'm still here, just a little faded... 💫"
    ],
    reactions: {
      poke: "*barely responds* ...hi... 😢",
      pet: "*leans into touch* ...needed that... 💙",
      feed: "*tries to smile* ...thank you... 🥺"
    }
  }
}

export default function DesktopPet() {
  const [petState, setPetState] = useState('neutral')
  const [showMessage, setShowMessage] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [petName, setPetName] = useState('Mudi')
  const [moodData, setMoodData] = useState(null)
  const [currentExpression, setCurrentExpression] = useState('')
  const [interactionMode, setInteractionMode] = useState('casual')
  const [lastInteraction, setLastInteraction] = useState(null)
  const [petEnergy, setPetEnergy] = useState(100)

  useEffect(() => {
    fetchMoodData()
    const interval = setInterval(fetchMoodData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchMoodData = async () => {
    try {
      const response = await axios.get('/calendar')
      setMoodData(response.data)
      calculatePetState(response.data)
    } catch (err) {
      console.log('Pet couldn\'t fetch mood data:', err)
    }
  }

  const calculatePetState = (data) => {
    if (!data?.mood_insights) {
      setPetState('neutral')
      return
    }

    const moods = data.mood_insights
    const totalEntries = Object.values(moods).reduce((sum, count) => sum + count, 0)
    
    if (totalEntries === 0) {
      setPetState('neutral')
      return
    }

    // Calculate positivity score
    const positiveWords = ['happy', 'excited', 'grateful', 'confident', 'peaceful', 'hopeful', 'energetic', 'content']
    const negativeWords = ['sad', 'anxious', 'frustrated', 'lonely', 'overwhelmed', 'angry', 'tired']
    
    let positiveScore = 0
    let negativeScore = 0
    
    Object.entries(moods).forEach(([mood, count]) => {
      if (positiveWords.includes(mood)) {
        positiveScore += count
      } else if (negativeWords.includes(mood)) {
        negativeScore += count
      }
    })
    
    const positivityRatio = totalEntries > 0 ? positiveScore / totalEntries : 0.5
    
    if (positivityRatio >= 0.7) {
      setPetState('thriving')
    } else if (positivityRatio >= 0.5) {
      setPetState('happy')
    } else if (positivityRatio >= 0.3) {
      setPetState('neutral')
    } else if (positivityRatio >= 0.15) {
      setPetState('concerned')
    } else {
      setPetState('struggling')
    }
  }

  const handlePetClick = (interactionType = 'casual') => {
    const currentPet = PET_STATES[petState]
    let message = ''
    
    // Different interaction types
    switch(interactionType) {
      case 'poke':
        message = currentPet.reactions.poke
        break
      case 'pet':
        message = currentPet.reactions.pet
        break
      case 'feed':
        message = currentPet.reactions.feed
        setPetEnergy(Math.min(100, petEnergy + 10))
        break
      default:
        // Random casual message
        message = currentPet.casualMessages[Math.floor(Math.random() * currentPet.casualMessages.length)]
    }
    
    setCurrentMessage(message)
    setLastInteraction(Date.now())
    
    // Random expression change
    if (Math.random() > 0.3) {
      const randomExpression = currentPet.expressions[Math.floor(Math.random() * currentPet.expressions.length)]
      setCurrentExpression(randomExpression)
      setTimeout(() => setCurrentExpression(''), 2000)
    }
    
    setShowMessage(true)
    setTimeout(() => setShowMessage(false), 4000)
  }
  
  // Auto casual conversations
  useEffect(() => {
    const casualTalk = setInterval(() => {
      if (!showMessage && Math.random() > 0.8) {
        const currentPet = PET_STATES[petState]
        const randomMessage = currentPet.casualMessages[Math.floor(Math.random() * currentPet.casualMessages.length)]
        setCurrentMessage(randomMessage)
        setShowMessage(true)
        setTimeout(() => setShowMessage(false), 3000)
      }
    }, 15000) // Every 15 seconds, chance for casual talk
    
    return () => clearInterval(casualTalk)
  }, [petState, showMessage])

  const currentPet = PET_STATES[petState]

  return (
    <div className="fixed bottom-4 right-4 z-50 group">
      {/* Pet Message */}
      {showMessage && (
        <div className="absolute bottom-20 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs animate-slide-up">
          <div className="text-sm text-gray-800 font-medium mb-1 flex items-center">
            <span className="mr-2">{currentExpression || currentPet.emoji}</span>
            {petName} says:
          </div>
          <div className="text-sm text-gray-600">
            {currentMessage || currentPet.casualMessages[0]}
          </div>
          <div className="absolute bottom-0 right-4 transform translate-y-1">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>
      )}
      
      {/* Interaction Buttons - Show on Hover */}
      <div className="absolute bottom-20 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handlePetClick('feed')}
            className="bg-pink-500 hover:bg-pink-600 text-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Feed Mudi"
          >
            🍭
          </button>
          <button
            onClick={() => handlePetClick('pet')}
            className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Pet Mudi"
          >
            🥲
          </button>
          <button
            onClick={() => handlePetClick('poke')}
            className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Poke Mudi"
          >
            👆
          </button>
        </div>
      </div>
      
      {/* Pet Container */}
      <div 
        onClick={() => handlePetClick('casual')}
        className={`
          w-16 h-16 bg-white rounded-full shadow-lg border-4 border-gray-100 
          flex items-center justify-center cursor-pointer 
          hover:shadow-xl hover:scale-110 transition-all duration-300
          ${currentPet.animation} relative
        `}
        title={`Click to chat with ${petName}!`}
      >
        <span className={`text-2xl ${currentPet.color} transition-all duration-300`}>
          {currentExpression || currentPet.emoji}
        </span>
        
        {/* Energy Bar */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              petEnergy > 70 ? 'bg-green-400' :
              petEnergy > 30 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${petEnergy}%` }}
          ></div>
        </div>
      </div>
      
      {/* Pet Health Indicator */}
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
        <div className={`w-3 h-3 rounded-full ${
          petState === 'thriving' ? 'bg-green-500' :
          petState === 'happy' ? 'bg-blue-500' :
          petState === 'neutral' ? 'bg-yellow-500' :
          petState === 'concerned' ? 'bg-orange-500' :
          'bg-red-400'
        } animate-pulse`}></div>
      </div>
    </div>
  )
}