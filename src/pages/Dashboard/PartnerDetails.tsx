import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { partnerCompanies } from "@/data/partnerCompanies";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PartnerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerDetails, setPartnerDetails] = useState(null);
  const partner = partnerCompanies.find(p => String(p.id) === String(id));

  // Função para abrir detalhes
  const handleShowDetails = (company) => {
    setPartnerDetails(company);
    setShowPartnerModal(true);
  };

  if (!partner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Parceiro não encontrado</h2>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => navigate('/dashboard?tab=agendamento')}
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">{partner.name}</h2>
        <p className="mb-2"><b>Especialidades:</b> {partner.specialties.join(', ')}</p>
        <p className="mb-2"><b>Nota:</b> {partner.rating}</p>
        <p className="mb-2"><b>Descrição:</b> {partner.description}</p>
        <p className="mb-2"><b>Endereço:</b> {partner.address}</p>
        <p className="mb-2"><b>Telefone:</b> {partner.phone}</p>
        <p className="mb-2"><b>Email:</b> {partner.email}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => navigate('/dashboard?tab=agendamento')}
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default PartnerDetails;