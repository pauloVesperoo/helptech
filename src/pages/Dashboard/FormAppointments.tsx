import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedule } from "@/contexts/scheduleContext";
import { Button } from "@/components/ui/button";

const FormAppointments = () => {
  const [pergunta, setPergunta] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const { createAppointment, fetchUserAppointments } = useSchedule();
  const navigate = useNavigate();

  // Exemplo de função para salvar a resposta no banco (ajuste conforme sua lógica)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMensagem("");
    try {
      // Aqui você pode adaptar para atualizar um agendamento existente ou criar um novo campo no banco
      // Exemplo: salvar a pergunta como um novo agendamento (ajuste conforme sua estrutura)
      await createAppointment({
        user_id: "usuario_id", // Substitua pelo id real do usuário
        service_type: "Pergunta personalizada",
        date: new Date().toISOString().slice(0, 10),
        time: "09:00",
        details: pergunta,
        company_name: "",
        specialties: "",
        technician_id: "",
        status: "pending",
      });
      setMensagem("Pergunta enviada com sucesso!");
      setPergunta("");
      // Opcional: navegue para outra página ou atualize a lista
      // navigate('/dashboard');
    } catch (error) {
      setMensagem("Erro ao enviar a pergunta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Formulário de Agendamento</h2>
        <label className="block mb-2 font-medium text-gray-700">
          Observações:
        </label>
        <textarea
          className="w-full border border-gray-300 rounded p-2 mb-4"
          value={pergunta}
          onChange={e => setPergunta(e.target.value)}
          rows={5}
          required
        />
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? "Enviando..." : "Enviar"}
        </Button>
        {mensagem && (
          <p className="mt-4 text-center text-green-600">{mensagem}</p>
        )}
      </form>
    </div>
  );
};

export default FormAppointments;