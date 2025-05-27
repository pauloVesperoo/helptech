import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatInterface from '@/components/ChatInterface';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from 'react-router-dom'; // Adicione esta linha
import { Button } from '@/components/ui/button';
import { Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MapsNearby = ({ latitude, longitude, query }) => (
  <iframe
    width="100%"
    height="400"
    style={{ border: 0 }}
    loading="lazy"
    allowFullScreen
    src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyCHTWtF-R4ccWdeOaOHBbJmGrZwRp69Ipc&q=${encodeURIComponent(query)}&center=${latitude},${longitude}&zoom=14`}
  />
);

// Lista fictícia de técnicos parceiros
const partnerTechnicians = [
  { id: 1, name: 'João Silva', specialty: 'Computadores', rating: 4.8 },
  { id: 2, name: 'Maria Oliveira', specialty: 'Redes e Wi-Fi', rating: 4.7 },
  { id: 3, name: 'Carlos Souza', specialty: 'Notebooks', rating: 4.9 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation(); // Adicione esta linha

  // Pegue o parâmetro tab da URL
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab');

  // Defina o estado inicial do activeTab conforme o parâmetro
  const [activeTab, setActiveTab] = useState(tabParam === 'localizacao' ? 'locations' : 'chat');

  // Atualize o activeTab se o parâmetro mudar
  useEffect(() => {
    if (tabParam === 'localizacao') setActiveTab('locations');
    else setActiveTab('chat');
  }, [tabParam]);

  const [profileData, setProfile] = useState(undefined);
  const [userLocation, setUserLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [selectedTech, setSelectedTech] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    } else {
      setProfile(null);
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (user) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: false });
      if (!error && data) {
        setAppointments(data);
      }
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, [user]);

  const firstName = profileData?.full_name
    ? profileData.full_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'Usuário';

  // Função para buscar latitude/longitude pelo CEP usando ViaCEP + Nominatim
  const buscarLocalizacaoPorCep = async () => {
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado');
      const endereco = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`;
      const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`);
      const geoData = await geoResp.json();
      if (geoData.length === 0) throw new Error('Localização não encontrada');
      setUserLocation({
        latitude: geoData[0].lat,
        longitude: geoData[0].lon,
      });
      setShowMap(true);
    } catch (err) {
      alert('Não foi possível encontrar a localização para o CEP informado.');
    }
    setLoadingCep(false);
  };

  // Função para simular agendamento
  const handleSchedule = async () => {
    const tech = partnerTechnicians.find(t => t.id === selectedTech);
    if (tech && user) {
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // yyyy-mm-dd
      const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

      const { error } = await supabase
        .from('appointments')
        .insert([{
          user_id: user.id, // deve ser uuid
          date: date,       // yyyy-mm-dd
          time: time,       // HH:MM:SS
          service_type: tech.specialty,
          details: `Agendamento com ${tech.name} (nota: ${tech.rating})`,
          status: 'agendado'
        }]);
      if (!error) {
        setSelectedTech(null);
        setTimeout(fetchAppointments, 300);
      } else {
        alert('Erro ao agendar. Tente novamente.');
      }
    }
  };

  if (profileData === undefined) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <span className="text-gray-500 text-lg">Carregando...</span>
        </div>
      </div>
    );
  }

  if (profileData === null) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <span className="text-red-500 text-lg">Perfil não encontrado.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Topo restaurado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Olá, {firstName}!</h1>
            <p className="text-gray-600">Bem-vindo ao seu assistente virtual</p>
          </div>
          {/* Exemplo de botão de configuração de API, se existir */}
          {/* <Button className="bg-indigo-600 hover:bg-indigo-700">Configurar API</Button> */}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <Tabs
            defaultValue="chat"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="chat">Assistente Virtual</TabsTrigger>
              <TabsTrigger value="scheduling">Agendar com Parceiros</TabsTrigger>
              <TabsTrigger value="locations">Assistências Recomendadas</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="h-[600px] overflow-auto">
              <ChatInterface />
            </TabsContent>

            <TabsContent value="scheduling" className="h-[600px] overflow-auto">
              <div className="max-w-8xl mx-auto pt-8 h-full">
                <div className="bg-blue-600 flex items-center justify-between p-4 rounded-t-lg text-white">
                  <div className="flex items-center gap-2">
                    <User className="w-7 h-7 text-white" />
                    <div>
                      <h1 className="font-bold text-lg"><b>HelpTech</b></h1>
                      <p className="text-xs opacity-80">Técnicos Parceiros HelpTech</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-b-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">
                    Agende com um Técnico Parceiro
                  </h2>
                  <p className="text-gray-600 mb-6 text-center">
                    O atendimento será realizado por um técnico parceiro da plataforma HelpTech.<br />
                    Escolha um profissional disponível abaixo:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {partnerTechnicians.map(tech => (
                      <Card
                        key={tech.id}
                        className={`cursor-pointer transition border-2 shadow-md hover:shadow-xl ${
                          selectedTech === tech.id ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedTech(tech.id)}
                      >
                        <CardContent className="flex flex-col items-center py-6">
                          {/* Avatar fictício */}
                          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                            <User className="w-8 h-8 text-blue-600" />
                          </div>
                          <h4 className="font-semibold text-lg mb-1">{tech.name}</h4>
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded mb-1">{tech.specialty}</span>
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-yellow-500 font-bold">{tech.rating}</span>
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.564-.955L10 0l2.948 5.955 6.564.955-4.756 4.635 1.122 6.545z"/></svg>
                          </div>
                          <button
                            className="mt-3 text-xs text-blue-600 underline hover:text-blue-800"
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              alert(`Especialidade: ${tech.specialty}\nNota: ${tech.rating}`);
                            }}
                          >
                            Ver detalhes
                          </button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button
                      disabled={selectedTech === null}
                      onClick={handleSchedule}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Confirmar Agendamento
                    </Button>
                  </div>
                  {/* Lista de agendamentos realizados */}
                  <div className="mt-10">
                    <h3 className="text-lg font-semibold text-blue-700 mb-4 text-center">Meus Agendamentos</h3>
                    {appointments.length === 0 ? (
                      <div className="text-center text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-2" />
                        <span>Nenhum agendamento realizado ainda.</span>
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        {appointments.map((appt, idx) => (
                          <li key={appt.id || idx} className="bg-white rounded shadow flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 border border-blue-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold">{appt.tech_name}</div>
                                <div className="text-xs text-blue-700">{appt.tech_specialty}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 mt-2 md:mt-0">
                              Agendado em: <span className="font-mono">{new Date(appt.scheduled_at).toLocaleString('pt-BR')}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="locations" className="h-[600px] overflow-auto">
              <div className="max-w-8xl mx-auto pt-8 h-full">
                <div className="bg-blue-600 flex items-center justify-between p-4 rounded-t-lg text-white">
                  <div className="flex items-center gap-2">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
                    </svg>
                    <div>
                      <h1 className="font-bold text-lg">HelpTech</h1>
                      <p className="text-xs opacity-80">Assistências Técnicas Recomendadas</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-b-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">
                    Encontre Assistências Técnicas Recomendadas Próximas
                  </h2>
                  <p className="text-gray-600 mb-6 text-center">
                    Digite seu CEP para localizar assistências técnicas recomendadas pela HelpTech e resolver seu problema com confiança e agilidade.
                  </p>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      buscarLocalizacaoPorCep();
                    }}
                    className="flex flex-col sm:flex-row items-center gap-3 mb-6"
                  >
                    <input
                      type="text"
                      id="cep"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="Ex: 01001-000"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      maxLength={9}
                      required
                    />
                    <button
                      type="submit"
                      disabled={loadingCep || cep.length < 8}
                      className={`px-6 py-2 rounded-md text-white font-semibold transition ${
                        loadingCep || cep.length < 8
                          ? 'bg-indigo-300 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {loadingCep ? 'Buscando...' : 'Buscar'}
                    </button>
                  </form>
                  {showMap && userLocation && (
                    <div className="bg-white rounded-lg shadow p-4">
                      <h3 className="text-lg font-medium mb-2 text-indigo-700">
                        Assistências recomendadas próximas ao CEP <span className="font-mono">{cep}</span>
                      </h3>
                      <MapsNearby
                        latitude={userLocation.latitude}
                        longitude={userLocation.longitude}
                        query="assistência técnica recomendada"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Resultados fornecidos pelo Google Maps. As assistências exibidas são recomendações da HelpTech para sua região.
                      </p>
                    </div>
                  )}
                  {!showMap && (
                    <div className="text-center text-gray-400 mt-8">
                      <svg className="mx-auto mb-2" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="24" cy="24" r="22" strokeDasharray="4 2" />
                        <path d="M24 14v10l6 6" strokeLinecap="round" />
                      </svg>
                      <span>O mapa aparecerá aqui após a busca.</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
