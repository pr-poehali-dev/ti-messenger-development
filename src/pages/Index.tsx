import { useState } from 'react';
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

    const mockUser: User = {
      id: Date.now(),
      username,
      is_online: true,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      last_seen: new Date().toISOString()
    };

    setCurrentUser(mockUser);
    setIsAuthenticated(true);
    loadUsers();
    toast({ title: isRegistering ? "Регистрация успешна!" : "Вход выполнен!" });
  };

  const loadUsers = () => {
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'TestBot',
        is_online: false,
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TestBot',
        last_seen: new Date().toISOString()
      },
      {
        id: 2,
        username: 'Алиса',
        is_online: true,
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        last_seen: new Date().toISOString()
      },
      {
        id: 3,
        username: 'Боб',
        is_online: false,
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        last_seen: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    setUsers(mockUsers);
  };

  const loadMessages = (userId: number) => {
    const mockMessages: Message[] = [
      {
        id: 1,
        sender_id: currentUser?.id || 0,
        receiver_id: userId,
        message_text: 'Привет! Как дела?',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        is_read: true
      },
      {
        id: 2,
        sender_id: userId,
        receiver_id: currentUser?.id || 0,
        message_text: userId === 1 ? '' : 'Отлично, спасибо!',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: true
      }
    ];
    setMessages(userId === 1 ? [mockMessages[0]] : mockMessages);
  };

  const sendMessage = () => {
    if (!messageText && !imageUrl) return;
    if (!selectedUser || !currentUser) return;

    const newMessage: Message = {
      id: Date.now(),
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      message_text: messageText,
      image_url: imageUrl || undefined,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
    setImageUrl('');
    setShowImageInput(false);
    toast({ title: "Сообщение отправлено" });
  };

  const handleCall = () => {
    if (!selectedUser) return;
    window.location.href = `tel:+1234567890`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

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
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser?.avatar_url} />
              <AvatarFallback>{currentUser?.username[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold">{currentUser?.username}</h2>
              <p className="text-xs text-green-600">В сети</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {users.map((user) => (
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImageInput(!showImageInput)}
                >
                  <Icon name="Image" size={20} />
                </Button>
                <Input
                  placeholder="Введите сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
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
