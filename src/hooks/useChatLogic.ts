import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createChatMessage, ChatState } from '../utils/chatUtils';
import { sendMessageToOpenAI, OpenAIMessage } from '../utils/openaiService';
import { servicesList } from '../data/faqData';

export const useChatLogic = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    botState: 'greeting',
    contact: null,
    appointment: null,
    isTyping: false
  });
  
  const [useOpenAI, setUseOpenAI] = useState<boolean>(true);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('openai_api_key') || '';
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const initial = "Olá! Sou o assistente virtual da HelpTech. Posso te ajudar com dúvidas e problemas de tecnologia. Se quiser agendar um serviço com um parceiro, clique no botão 'Agendar'. Para encontrar assistências técnicas próximas, clique em 'Assistências Recomendadas'.";
    setTimeout(() => {
      setBotResponse(initial);
    }, 500);
  }, []);
  
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
    }
  }, [apiKey]);

  const setBotResponse = (text: string) => {
    setChatState(prev => ({ ...prev, isTyping: true }));
    
    const typingDelay = Math.min(1000, Math.max(700, text.length * 10));
    
    setTimeout(() => {
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, createChatMessage(text, 'bot')],
        isTyping: false
      }));
    }, typingDelay);
  };

  const clearChatHistory = () => {
    setChatState({
      messages: [],
      botState: 'greeting',
      contact: null,
      appointment: null,
      isTyping: false
    });
    
    setTimeout(() => {
      setBotResponse("Olá! Sou o assistente virtual da HelpTech. Posso te ajudar com dúvidas e problemas de tecnologia. Se quiser agendar um serviço, clique em 'Agendar com Parceiros'. Para encontrar assistências técnicas próximas, clique em 'Assistências Recomendadas'.");
    }, 500);
    
    toast({
      title: "Histórico limpo",
      description: "O histórico de conversa foi limpo com sucesso.",
      variant: "default",
    });
  };

  const handleUserMessage = async (text: string) => {
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, createChatMessage(text, 'user')]
    }));

    setChatState(prev => ({ ...prev, isTyping: true }));

    let responseText = "";
    const lower = text.toLowerCase();

    // Se o usuário falar sobre agendamento
    if (
      lower.includes("agendar") ||
      lower.includes("marcar") ||
      lower.includes("atendimento") ||
      lower.includes("visita") ||
      lower.includes("parceiro")
    ) {
      responseText =
        "Para agendar um serviço com um parceiro, clique no botão 'Agendar' acima e siga as instruções na plataforma. A HelpTech faz apenas a intermediação entre você e empresas parceiras.";
    }
    // Se o usuário falar sobre assistência próxima
    else if (
      lower.includes("assistência") ||
      lower.includes("empresa") ||
      lower.includes("loja") ||
      lower.includes("próxima") ||
      lower.includes("perto")
    ) {
      responseText =
        "Para ver assistências técnicas próximas de você, clique no botão 'Assistências Recomendadas' acima e informe seu CEP.";
    }
    // Para dúvidas técnicas, usa o ChatGPT normalmente
    else {
      try {
        const systemPrompt = `Você é um assistente virtual da HelpTech, uma plataforma que conecta usuários a empresas e técnicos parceiros de tecnologia. 
Ajude o usuário com dúvidas e problemas de computador, mas nunca agende serviços diretamente pelo chat. 
Se o usuário quiser agendar um serviço, oriente a clicar no botão 'Agendar'. 
Se quiser encontrar assistências próximas, oriente a clicar em 'Assistências Recomendadas'. 
Responda dúvidas técnicas normalmente.`;

        const messages: OpenAIMessage[] = [
          { role: 'system', content: systemPrompt },
        ];
        
        chatState.messages.forEach(msg => {
          messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });
        
        messages.push({ role: 'user', content: text });
        
        responseText = await sendMessageToOpenAI(messages, apiKey);
      } catch (error) {
        responseText = "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.";
      }
    }

    const typingDelay = Math.min(1000, Math.max(700, responseText.length * 10));
    
    setTimeout(() => {
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, createChatMessage(responseText, 'bot')],
        isTyping: false
      }));
    }, typingDelay);
  };

  const handleServiceButtonClick = (serviceId: string) => {
    const selectedService = servicesList.find(service => service.id === serviceId);
    
    if (selectedService) {
      const userMessage = `Gostaria de saber sobre o serviço de ${selectedService.name}`;
      
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, createChatMessage(userMessage, 'user')]
      }));
      
      handleUserMessage(userMessage);
    }
  };
  
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      setUseOpenAI(true);
      toast({
        title: "ChatGPT ativado",
        description: "O chat agora está usando a API do ChatGPT para responder suas mensagens.",
        variant: "default",
      });
    } else {
      setUseOpenAI(false);
    }
  };

  const toggleOpenAI = () => {
    if (!apiKey) {
      toast({
        title: "Chave de API necessária",
        description: "Configure sua chave de API do ChatGPT primeiro.",
        variant: "default",
      });
      return;
    }
    
    setUseOpenAI(!useOpenAI);
    toast({
      title: useOpenAI ? "Modo local ativado" : "ChatGPT ativado",
      description: useOpenAI 
        ? "O chat agora está usando respostas pré-programadas." 
        : "O chat agora está usando a API do ChatGPT para respostas mais inteligentes.",
      variant: "default",
    });
  };

  return {
    chatState,
    apiKey,
    useOpenAI,
    handleUserMessage,
    handleServiceButtonClick,
    handleSaveApiKey,
    toggleOpenAI,
    clearChatHistory
  };
};
