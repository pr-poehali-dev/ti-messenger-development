import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  is_online: boolean;
  avatar_url: string;
  last_seen: string;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message_text: string;
  image_url?: string;
  created_at: string;
  is_read: boolean;
}

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  
  const { toast } = useToast();

  const handleAuth = async () => {
    if (!username || !password) {
      toast({ title: "Ошибка", description: "Заполните все поля", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/5ccde1d2-dbf2-4d55-a558-76501bdd8e39', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          action: isRegistering ? 'register' : 'login'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data);
        setIsAuthenticated(true);
        loadUsers();
        toast({ title: isRegistering ? "Регистрация успешна!" : "Вход выполнен!" });
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось войти", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/66ede86c-9969-47e8-bbcc-36f0975b61c3');
      const data = await response.json();
      if (response.ok) {
        const filteredUsers = data.users.filter((u: User) => u.id !== currentUser?.id);
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMessages = async (userId: number) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(
        `https://functions.poehali.dev/2448875a-39de-446f-8f2e-b341884e3994?user1_id=${currentUser.id}&user2_id=${userId}`
      );
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText && !imageUrl) return;
    if (!selectedUser || !currentUser) return;

    try {
      const response = await fetch('https://functions.poehali.dev/2448875a-39de-446f-8f2e-b341884e3994', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          message_text: messageText,
          image_url: imageUrl || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([...messages, data]);
        setMessageText('');
        setImageUrl('');
        setShowImageInput(false);
        toast({ title: "Сообщение отправлено" });
      } else {
        toast({ title: "Ошибка", description: "Не удалось отправить сообщение", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleCall = () => {
    if (!selectedUser) return;
    window.location.href = `tel:+1234567890`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getUnreadCount = (userId: number) => {
    return messages.filter(
      (msg) => msg.sender_id === userId && msg.receiver_id === currentUser?.id && !msg.is_read
    ).length;
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                <Icon name="MessageCircle" size={40} className="text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Ti Messenger</h1>
            <p className="text-muted-foreground">Быстрые сообщения для всех</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Никнейм"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleAuth}
            >
              {isRegistering ? 'Зарегистрироваться' : 'Войти'}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Уже есть аккаунт?' : 'Создать аккаунт'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser?.avatar_url} />
              <AvatarFallback>{currentUser?.username[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold">{currentUser?.username}</h2>
              <p className="text-xs text-green-600">В сети</p>
            </div>
          </div>
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  loadMessages(user.id);
                }}
                className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-accent transition-colors ${
                  selectedUser?.id === user.id ? 'bg-accent' : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                  {user.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.is_online ? 'В сети' : `был(а) ${formatTime(user.last_seen)}`}
                  </div>
                </div>
                {getUnreadCount(user.id) > 0 && (
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
                    {getUnreadCount(user.id)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback>{selectedUser.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedUser.username}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.is_online ? 'В сети' : `был(а) ${formatTime(selectedUser.last_seen)}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCall}>
                <Icon name="Phone" size={20} />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt="Вложение"
                            className="rounded-lg mb-2 max-w-full"
                          />
                        )}
                        {msg.message_text && <p>{msg.message_text}</p>}
                        <div
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-card">
              {showImageInput && (
                <div className="mb-2 flex gap-2">
                  <Input
                    placeholder="URL изображения"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowImageInput(false);
                      setImageUrl('');
                    }}
                  >
                    <Icon name="X" size={20} />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Введите сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImageInput(!showImageInput)}
                >
                  <Icon name="Image" size={20} />
                </Button>
                <Button onClick={sendMessage}>
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <Icon name="MessageCircle" size={64} className="mx-auto opacity-20" />
              <p className="text-lg">Выберите чат для начала переписки</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}