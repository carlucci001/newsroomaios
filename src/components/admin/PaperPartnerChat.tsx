'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Send,
  Paperclip,
  Search,
  X,
  MessageSquare,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'admin' | 'partner';
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: { name: string; url: string }[];
}

interface Conversation {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerStatus: 'online' | 'offline' | 'away';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

interface PaperPartnerChatProps {
  conversations: Conversation[];
  currentUserId: string;
  onSendMessage?: (conversationId: string, message: string) => void;
}

export function PaperPartnerChat({
  conversations: initialConversations,
  currentUserId,
  onSendMessage,
}: PaperPartnerChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find((c) => c.id === activeConversation);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [currentConversation?.messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversation) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: 'Admin',
      senderType: 'admin',
      content: messageInput,
      timestamp: new Date(),
      read: false,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: messageInput,
              lastMessageTime: new Date(),
            }
          : conv
      )
    );

    onSendMessage?.(activeConversation, messageInput);
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Conversation['partnerStatus']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Partner Communications
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex gap-0 p-0 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    activeConversation === conv.id ? 'bg-brand-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12 bg-brand-100 text-brand-700 flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {conv.partnerName.charAt(0).toUpperCase()}
                        </span>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                          conv.partnerStatus
                        )}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm truncate">{conv.partnerName}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(conv.lastMessageTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && (
                          <Badge className="ml-2 bg-brand-600 text-white">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {currentConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10 bg-brand-100 text-brand-700 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {currentConversation.partnerName.charAt(0).toUpperCase()}
                    </span>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                      currentConversation.partnerStatus
                    )}`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{currentConversation.partnerName}</h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {currentConversation.partnerStatus}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                {currentConversation.messages.map((message, index) => {
                  const isCurrentUser = message.senderType === 'admin';
                  const showAvatar =
                    index === 0 ||
                    currentConversation.messages[index - 1].senderId !== message.senderId;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                    >
                      {showAvatar ? (
                        <Avatar
                          className={`w-8 h-8 flex items-center justify-center ${
                            isCurrentUser
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          <span className="text-xs font-semibold">
                            {message.senderName.charAt(0).toUpperCase()}
                          </span>
                        </Avatar>
                      ) : (
                        <div className="w-8" />
                      )}

                      <div
                        className={`flex flex-col max-w-[70%] ${
                          isCurrentUser ? 'items-end' : 'items-start'
                        }`}
                      >
                        {showAvatar && (
                          <span className="text-xs text-gray-500 mb-1 px-1">
                            {message.senderName}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isCurrentUser
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-1 px-1 ${
                            isCurrentUser ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isCurrentUser && (
                            <span className="text-brand-600">
                              {message.read ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>

                <Textarea
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={1}
                />

                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
