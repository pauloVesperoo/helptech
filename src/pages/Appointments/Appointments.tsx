import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { useSchedule } from '../../contexts/scheduleContext';

// Lista fictícia de técnicos parceiros
const partnerTechnicians = [
  { id: 1, name: 'João Silva', specialty: 'Computadores', rating: 4.8 },
  { id: 2, name: 'Maria Oliveira', specialty: 'Redes e Wi-Fi', rating: 4.7 },
  { id: 3, name: 'Carlos Souza', specialty: 'Notebooks', rating: 4.9 },
];

const Appointments = () => {
  const { profile } = useAuth();
  const {
    appointments,
    loading,
    createAppointment,
    fetchUserAppointments
  } = useSchedule();
  //novo::
  const [selectedTech, setSelectedTech] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [issue, setIssue] = useState('');
  const navigate = useNavigate();
  const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Aqui teríamos a lógica para buscar os agendamentos do usuário
  //const [appointments] = useState([]);

  // Estado para seleção de técnico
  //const [selectedTech, setSelectedTech] = useState<number | null>(null);

  // Simula o agendamento
  const handleSchedule = async (e: React.FormEvent) => {
    try {
      const newAppointment = await createAppointment({
        user_id: '',
        id: '',
        technician_id: '',
        date: '',
        service_type: '',
        details: ''
      })
    }
    catch (error: any) {
      console.error('Login error:', error);
      setError(error?.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }

    // alert('Agendamento realizado com um técnico parceiro!');
    // navigate('/dashboard?tab=agendamento');


  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meus Agendamentos</h1>
            <p className="text-gray-600">Gerencie seus serviços agendados</p>
          </div>
          <Button 
            onClick={() => navigate('/dashboard?tab=agendamento')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Agendar Novo Serviço
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700">Agende com um Técnico Parceiro</h2>
          <p className="text-gray-700 mb-6">
            O atendimento será realizado por um técnico parceiro da plataforma HelpTech. Escolha um profissional disponível abaixo:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {partnerTechnicians.map(tech => (
              <Card
                key={tech.id}
                className={`cursor-pointer transition border-2 ${selectedTech === tech.id ? 'border-blue-600' : 'border-gray-200'}`}
                onClick={() => setSelectedTech(tech.id)}
              >
                <CardContent className="flex flex-col items-center py-6">
                  <User className="w-10 h-10 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-lg">{tech.name}</h4>
                  <p className="text-gray-600 text-sm">{tech.specialty}</p>
                  <p className="text-yellow-500 text-sm mt-1">Nota: {tech.rating}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            disabled={selectedTech === null}
            onClick={handleSchedule}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirmar Agendamento
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {appointments.length > 0 ? (
            <div>
              {/* Aqui viriam os agendamentos do usuário */}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">Sem agendamentos</h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Você ainda não tem nenhum serviço agendado. Utilize nosso assistente virtual para agendar um serviço com um técnico parceiro.
                </p>
                <Button 
                  onClick={() => navigate('/dashboard?tab=agendamento')} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Agendar Agora
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
