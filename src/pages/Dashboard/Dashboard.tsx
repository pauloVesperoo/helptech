import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatInterface from '@/components/ChatInterface';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from 'react-router-dom'; // Adicione esta linha
import { Button } from '@/components/ui/button';

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
            <h1 className="text-3xl font-bold mb-1">Olá, {firstName}</h1>
            <p className="text-gray-600">Bem-vindo ao seu assistente virtual</p>
          </div>
          {/* Exemplo de botão de configuração de API, se existir */}
          {/* <Button className="bg-indigo-600 hover:bg-indigo-700">Configurar API</Button> */}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="chat">Assistente Virtual</TabsTrigger>
              <TabsTrigger value="locations">Assistências Recomendadas</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="h-[600px] overflow-auto">
              <ChatInterface />
            </TabsContent>

            <TabsContent value="locations" className="h-[600px] overflow-auto">
              <div className="max-w-8xl mx-auto pt-8 h-full">
                <div className="bg-indigo-600 flex items-center justify-between p-4 rounded-t-lg text-white">
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
                <div className="bg-indigo-50 rounded-b-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-indigo-700 mb-2 text-center">
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
