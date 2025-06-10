import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Users, Calendar, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) {
      console.log('Perfil ainda não carregado.');
      return;
    }

    console.log('Perfil carregado no AdminDashboard:', profile);

    if (profile.role !== 'admin') {
      console.log('Redirecionando para /dashboard porque o role é:', profile.role);
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  // Buscar usuários e agendamentos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Busca usuários (tabela profiles)
      const { data: usersData } = await supabase.from('profiles').select('*');
      setUsers(usersData || []);
      // Busca agendamentos (tabela appointments)
      const { data: appointmentsData } = await supabase.from('appointments').select('*');
      setAppointments(appointmentsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Se ainda não carregou o perfil ou não é admin, não mostrar o dashboard
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1 flex justify-center items-center">
          <Alert variant="destructive" className="w-full max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription>
              Esta página é restrita para administradores do sistema.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1 flex justify-center items-center">
          <span className="text-gray-500 text-lg">Carregando dados do admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
            <p className="text-gray-600">Gerenciamento completo do sistema</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="p-4 border-b w-full flex overflow-x-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                      <CardDescription>Total de usuários</CardDescription>
                    </div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                      <CardDescription>Total de serviços</CardDescription>
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{appointments.length}</p>
                    <p className="text-xs text-muted-foreground">Agendamentos realizados</p>
                  </CardContent>
                </Card>
                

                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-medium">Total de Parceiros</CardTitle>
                      <CardDescription>Técnicos cadastrados na plataforma</CardDescription>
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.role === 'partner' || u.role === 'tecnico' || u.role === 'tecnicos').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Parceiros disponíveis</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {(() => {
                        // Junta usuários e agendamentos, marcando o tipo
                        const recent = [
                          ...users
                            .filter(u => u.created_at)
                            .map(u => ({
                              type: 'user',
                              created_at: u.created_at,
                              name: u.full_name || u.email,
                              email: u.email,
                              id: u.id,
                            })),
                          ...appointments
                            .filter(a => a.created_at)
                            .map(a => ({
                              type: 'appointment',
                              created_at: a.created_at,
                              details: a.details || a.service_type,
                              user_id: a.user_id,
                              id: a.id,
                              date: a.date,
                              time: a.time,
                              status: a.status,
                            })),
                        ]
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 5); // Mostra só os 5 mais recentes

                        if (recent.length === 0) {
                          return (
                            <div className="text-center text-gray-400 py-8">
                              Nenhuma atividade recente encontrada.
                            </div>
                          );
                        }

                        return recent.map((item, idx) =>
                          item.type === 'user' ? (
                            <div key={item.id || idx} className="flex items-center justify-between py-3 px-4">
                              <div>
                                <p className="font-medium">Novo usuário cadastrado</p>
                                <p className="text-sm text-muted-foreground">
                                  {'name' in item ? item.name : ''}
                                </p>
                                {'email' in item && (
                                  <p className="text-xs text-muted-foreground">{item.email}</p>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : ''}
                              </p>
                            </div>
                          ) : (
                            <div key={item.id || idx} className="flex items-center justify-between py-3 px-4">
                              <div>
                                <p className="font-medium">
                                  {'details' in item ? item.details : item.type === 'user' ? (item.name || item.email) : ''}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Usuário: {'user_id' in item ? (users.find(u => u.id === item.user_id)?.full_name || item.user_id) : ''}
                                </p>
                                {'status' in item && (
                                  <span className="text-xs text-blue-700">{item.status}</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : ''}
                              </p>
                            </div>
                          )
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="users">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Lista de Usuários</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {users.map((user, index) => (
                        <div key={user.id || index} className="flex items-center justify-between py-3 px-4">
                          <div>
                            <p className="font-medium">{user.full_name || user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Cliente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="appointments">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Lista de Agendamentos</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {appointments.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">Nenhum agendamento encontrado.</div>
                      ) : (
                        appointments.map((appt, index) => (
                          <div key={appt.id || index} className="flex flex-col md:flex-row md:items-center md:justify-between py-3 px-4">
                            <div>
                              <p className="font-medium">{appt.details || appt.service_type}</p>
                              <p className="text-sm text-muted-foreground">
                                Usuário: {users.find(u => u.id === appt.user_id)?.full_name || appt.user_id}
                              </p>
                            </div>
                            <div className="text-xs text-blue-700 mt-2 md:mt-0">
                              {appt.date} {appt.time} <span className="ml-2">{appt.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="site">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Configurações do Site</h3>
                <p className="text-gray-500">Implementação completa em breve.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="ai-assistant">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Configurações do Assistente IA</h3>
                <p className="text-gray-500">Implementação completa em breve.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
