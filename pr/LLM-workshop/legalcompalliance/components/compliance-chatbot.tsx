'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, AlertCircle, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface ComplianceChatbotProps {
  documentsUploaded?: boolean
}

export default function Compliancechatbot({ documentsUploaded = false }: ComplianceChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your compliance analysis assistant. Upload a document and I can help you understand compliance violations, regulatory requirements, and recommended fixes. What would you like to know?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: inputValue }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.answer || 'Sorry, I could not generate an answer.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error fetching chat response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'I encountered an error connecting to the compliance analysis server. Please ensure the backend is running.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-card rounded-lg border border-border mb-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${message.type === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-none'
                : 'bg-muted text-foreground rounded-bl-none border border-border'
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${message.type === 'user'
                ? 'text-primary-foreground/70'
                : 'text-muted-foreground'
                }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-lg rounded-bl-none px-4 py-3 border border-border">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {!documentsUploaded && messages.length <= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          {[
            { icon: AlertCircle, text: 'What are the main compliance issues?' },
            { icon: Lightbulb, text: 'How can I fix these violations?' },
            { icon: MessageCircle, text: 'Explain GDPR requirements' },
            { icon: MessageCircle, text: 'What frameworks apply?' },
          ].map((suggestion, idx) => {
            const Icon = suggestion.icon
            return (
              <button
                key={idx}
                onClick={() => setInputValue(suggestion.text)}
                className="flex items-center gap-2 p-3 text-sm text-left bg-muted hover:bg-muted/80 text-foreground rounded-lg border border-border transition-colors"
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-primary" />
                <span>{suggestion.text}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={documentsUploaded ? "Ask me anything about your documents..." : "Upload documents to get started..."}
          disabled={!documentsUploaded && messages.length === 1}
          className="flex-1 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="gap-2 px-4 py-3"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
    </div>
  )
}
