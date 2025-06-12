import { useState, useEffect, createContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatInterface from '@/components/ChatInterface';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSchedule } from "@/contexts/scheduleContext";
import { Appointment } from '@/types/database.types';
import { partnerCompanies } from '@/data/partnerCompanies';

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
  const location = useLocation();
  const { createAppointment, fetchUserAppointments, appointments, setAppointments } = useSchedule();

  // Pegue o parâmetro tab da URL
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab');

  // Defina o estado inicial do activeTab conforme o parâmetro
  const [activeTab, setActiveTab] = useState(tabParam === 'localizacao' ? 'locations' : (tabParam === 'agendamento' ? 'scheduling' : 'chat'));

  // Atualize o activeTab se o parâmetro mudar
  useEffect(() => {
    if (tabParam === 'localizacao') setActiveTab('locations');
    else if (tabParam === 'agendamento') setActiveTab('scheduling');
    else setActiveTab('chat');
  }, [tabParam]);

  const [profileData, setProfile] = useState(undefined);
  const [userLocation, setUserLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerDetails, setPartnerDetails] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [tipoServico, setTipoServico] = useState("");
  const [dataServico, setDataServico] = useState(""); // novo estado para a data
  const [horaServico, setHoraServico] = useState(""); // novo estado para a hora
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [mensagemPergunta, setMensagemPergunta] = useState("");
  const navigate = useNavigate();

  const [meusAgendamentos, setMeusAgendamentos] = useState<any[]>([]);

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

  // Corrigido: Atualiza o estado de appointments corretamente
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
    if (user) fetchUserAppointments(user.id);
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

  // Função para agendar
  const handleSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedCompany === null || !user) return;
    setIsLoading(true);
    setError('');
    try {
      const company = partnerCompanies.find(c => c.id === selectedCompany);
      if (!company) return;
      // await createAppointment({
      //   user_id: user.id,
      //   service_type: 'Serviço com parceiro',
      //   date: new Date().toISOString().slice(0, 10),
      //   time: '09:00',
      //   details: '',
      //   company_name: company.name,
      //   specialties: company.specialties.join(', '),
      //   technician_id: '',
      //   status: 'pending',
      // });
      setSelectedCompany(null);
      await fetchUserAppointments(user.id);
      navigate('/form-appointments');
    } catch (error: any) {
      setError(error?.message || 'Erro ao agendar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para abrir detalhes
  const handleShowDetails = (company) => {
    setPartnerDetails(company);
    setShowPartnerModal(true);
  };

  // Função para abrir o modal de pergunta
  const handleOpenQuestionModal = () => {
    setPergunta("");
    setMensagemPergunta("");
    setShowQuestionModal(true);
  };

  // Função para enviar a pergunta
  const handleSubmitPergunta = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuestionLoading(true);
    setMensagemPergunta("");
    try {
      const empresa = partnerCompanies.find(c => c.id === selectedCompany);
      setMeusAgendamentos(prev => [
        ...prev,
        {
          empresa: empresa ? empresa.name : "Empresa não selecionada",
          data: dataServico,
          hora: horaServico,
          tipo: tipoServico,
          detalhes: pergunta,
        }
      ]);
      setMensagemPergunta("Agendamento salvo!");
      setPergunta("");
      setTipoServico("");
      setDataServico("");
      setHoraServico("");
      setShowQuestionModal(false);
    } catch {
      setMensagemPergunta("Erro ao salvar o agendamento.");
    } finally {
      setIsQuestionLoading(false);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Olá, {firstName}!</h1>
            <p className="text-gray-600">Bem-vindo ao seu assistente virtual</p>
          </div>
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
                      <p className="text-xs opacity-80">Empresas Parceiras HelpTech</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-b-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">
                    Agende com uma Empresa Parceira
                  </h2>
                  <p className="text-gray-600 mb-6 text-center">
                    O atendimento será realizado por uma empresa parceira da plataforma HelpTech.<br />
                    Escolha uma empresa disponível abaixo:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {partnerCompanies.map(company => (
                      <Card
                        key={company.id}
                        className={`cursor-pointer transition border-2 ${selectedCompany === company.id ? 'border-blue-600' : 'border-gray-200'}`}
                        onClick={() => setSelectedCompany(company.id)}
                      >
                        <CardContent className="flex flex-col items-center py-6">
                          <User className="w-10 h-10 text-blue-600 mb-2" />
                          <h4 className="font-semibold text-lg">{company.name}</h4>
                          <p className="text-gray-600 text-sm mb-1">
                            Especialidades: {company.specialties.join(', ')}
                          </p>
                          <p className="text-yellow-500 text-sm mt-1">Nota: {company.rating}</p>
                        </CardContent>
                        <Button
                          variant="outline"
                          className="mt-3 text-xs"
                          onClick={e => {
                            e.stopPropagation();
                            handleShowDetails(company);
                          }}
                        >
                          Ver detalhes
                        </Button>
                      </Card>
                    ))}
                  </div>
                  <Button
                    disabled={selectedCompany === null || isLoading}
                    // onClick={handleSchedule}
                    onClick={handleOpenQuestionModal}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? 'Agendando...' : 'Confirmar Agendamento'}
                  </Button>
                  {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                  <h3 className="text-lg font-semibold text-blue-700 mb-4 text-center flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Meus Agendamentos
                  </h3>
                  {meusAgendamentos.length > 0 ? (
                    <ul className="space-y-4">
                      {meusAgendamentos.map((appt, idx) => (
                        <li
                          key={idx}
                          className="bg-gradient-to-r from-blue-50 to-blue-100 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between px-6 py-4 border border-blue-200 hover:shadow-lg transition"
                        >
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded font-semibold shadow">
                                {appt.tipo}
                              </span>
                              <span className="inline-block px-3 py-1 bg-gray-200 text-blue-700 text-xs rounded font-semibold shadow">
                                {appt.data} às {appt.hora}
                              </span>
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold shadow">
                                {appt.empresa}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 mb-1">
                              <b>Detalhes:</b> {appt.detalhes}
                            </div>
                          </div>
                          <div className="flex flex-col items-end mt-2 md:mt-0 md:ml-4">
                            <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      <Calendar className="w-8 h-8 mx-auto mb-2" />
                      Nenhum agendamento realizado.
                    </div>
                  )}
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

      {showPartnerModal && partnerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-blue-700 text-xl"
              onClick={() => setShowPartnerModal(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-blue-700 mb-4">{partnerDetails.name}</h2>
            <p className="mb-2"><b>Especialidades:</b> {partnerDetails.specialties.join(', ')}</p>
            <p className="mb-2"><b>Nota:</b> {partnerDetails.rating}</p>
            <p className="mb-2"><b>Descrição:</b> {partnerDetails.description}</p>
            <p className="mb-2"><b>Endereço:</b> {partnerDetails.address}</p>
            <p className="mb-2"><b>Telefone:</b> {partnerDetails.phone}</p>
            <p className="mb-2"><b>Email:</b> {partnerDetails.email}</p>
          </div>
        </div>
      )}

      
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-blue-700 text-xl"
              onClick={() => setShowQuestionModal(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Formulário de Pergunta</h2>
            <form onSubmit={handleSubmitPergunta}>
              <label className="block mb-2 font-medium text-gray-700">
                Data desejada:
              </label>
              <input
                className="w-full border border-gray-300 rounded p-2 mb-4"
                type="date"
                value={dataServico}
                onChange={e => setDataServico(e.target.value)}
                required
              />
              <label className="block mb-2 font-medium text-gray-700">
                Horário:
              </label>
              <input
                className="w-full border border-gray-300 rounded p-2 mb-4"
                type="time"
                value={horaServico}
                onChange={e => setHoraServico(e.target.value)}
                required
              />
              <label className="block mb-2 font-medium text-gray-700">
                Tipo de serviço:
              </label>
              <input
                className="w-full border border-gray-300 rounded p-2 mb-4"
                type="text"
                value={tipoServico}
                onChange={e => setTipoServico(e.target.value)}
                placeholder="Ex: Manutenção, Instalação, Suporte..."
                required
              />
              <label className="block mb-2 font-medium text-gray-700">
                Detalhes:
              </label>
              <textarea
                className="w-full border border-gray-300 rounded p-2 mb-4"
                value={pergunta}
                onChange={e => setPergunta(e.target.value)}
                placeholder='Conte com mais detalhes qual é o problema.'
                rows={5}
                required
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isQuestionLoading}
              >
                {isQuestionLoading ? "Enviando..." : "Enviar"}
              </Button>
              {mensagemPergunta && (
                <p className="mt-4 text-center text-green-600">{mensagemPergunta}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

export interface ScheduleContextType {
  appointments: Appointment[];
  loading: boolean;
  createAppointment: (data: AppointmentInput) => Promise<void>;
  fetchUserAppointments: (userId: string) => Promise<void>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

export const ScheduleContext = createContext<ScheduleContextType>({
  appointments: [],
  loading: false,
  createAppointment: async () => {},
  fetchUserAppointments: async () => {},
  setAppointments: () => {},
});

type AppointmentInput = {
  status: string;
  company_name: string;
  specialties: string;
  user_id: string;
  service_type: string;
  date: string;
  time: string;
  details: string;
  technician_id: string;
};

export const ScheduleProvider = ({ children }: { children: React.ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // ...restante do código
  // Adicione implementações fictícias ou reais para createAppointment e fetchUserAppointments
  const createAppointment = async (data: AppointmentInput) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert([{
          user_id: data.user_id,
          service_type: data.service_type,
          date: data.date,
          time: data.time,
          details: data.details,
          status: data.status || 'pending',
          company_name: data.company_name,
          specialties: data.specialties,
          technician_id: data.technician_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // NÃO envie id aqui!
        }]);
      if (error) throw error;
      await fetchUserAppointments(data.user_id);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAppointments = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (error) throw error;
      setAppointments(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        appointments,
        loading,
        createAppointment,
        fetchUserAppointments,
        setAppointments,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
