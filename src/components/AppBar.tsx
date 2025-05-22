import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, PhoneCall, User, LogOut, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const AppBar = ({ onChatClick }: { onChatClick?: () => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20"> {/* Alterado de h-16 para h-20 */}
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer py-2"> {/* Adicionado py-2 */}
            <Bot className="mr-3 text-blue-600" size={36} /> {/* Aumentado size e mr */}
            <span className="text-2xl font-bold text-blue-600">HelpTech</span> {/* Aumentado text-xl para text-2xl */}
          </Link>


          {/* Contact and Chat Button */}
          <div className="hidden md:flex items-center space-x-6"> {/* Aumentado space-x-4 para space-x-6 */}
            <div className="flex items-center gap-3 text-gray-700"> {/* Aumentado gap */}
            </div>
            
            {!user ? (
              <Link to="/login">
                <Button variant="outline" size="lg" className="flex items-center gap-3 py-2 px-4 text-base"> {/* Aumentado size, gap, padding e fonte */}
                  <User size={20} /> {/* Aumentado size */}
                  Entrar
                </Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full"> {/* Aumentado h/w */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(profile?.full_name || '')}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {profile?.full_name && (
                        <p className="font-medium">{profile.full_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            

          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        {isMenuOpen && (
          <nav className="bg-white shadow-md absolute top-16 left-0 right-0 z-40 p-4 space-y-4">
            <div className="flex items-center gap-2 text-gray-700 py-2">
              <PhoneCall size={18} className="text-blue-600" />
              <span>(11) 5555-1234</span>
            </div>
            
            {!user ? (
              <Link 
                to="/login"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <User size={16} />
                  Entrar
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(profile?.full_name || '')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{profile?.full_name || 'Usuário'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    navigate('/dashboard');
                    setIsMenuOpen(false);
                  }}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600" 
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            )}
            
            {onChatClick && (
              <Button 
                onClick={() => {
                  onChatClick();
                  setIsMenuOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 w-full"
              >
                Iniciar Chat
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default AppBar;
