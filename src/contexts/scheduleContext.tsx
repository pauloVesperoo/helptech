import { createContext, useContext, useState, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Session, User } from '@supabase/supabase-js';
import { UUID } from 'crypto';
import { supabase } from '@/integrations/supabase/client.ts';


type Appointment = {
  id: string;
  user_id: string | null;
  technician_id: string;
  service_type: string;
  date: string;
  details: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type ScheduleContextType = {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  createAppointment: (appointment: Omit<Appointment, "status">) => Promise<Appointment>;
  fetchUserAppointments: (userId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);


export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createAppointment = async (appointment: Omit<Appointment, 'status'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
      .from('appointments')
      .insert([{user_id: appointment.user_id,
        service_type: 'Reparo de Computador',
        date: appointment.date.split('T')[0],
        time: appointment.date.split('T')[1],
        details: appointment.details,
        status: 'pending'}])
        .select();
        
        if (error) throw error;
                
        setAppointments(prev => {
          const newAppointment = data?.[0];
          
          
          if (!newAppointment || !isValidAppointment(newAppointment)) {
            return prev; 
          }
  
          return [...prev, {
            id: newAppointment.id,
            user_id: newAppointment.user_id,
            technician_id: newAppointment.technician_id,
            service_type: newAppointment.service_type,
            date: new Date(newAppointment.date).toISOString(),
            details: newAppointment.details || '',
            status: newAppointment.status || 'pending',
            created_at: newAppointment.created_at,
            updated_at: newAppointment.updated_at || newAppointment.created_at
    
          }];
      });



      return data[0];//fica ligeiro com isso aqui
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
  };

  const fetchUserAppointments = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
      .from('appointments')
      .select('id, user_id, technician_id, service_type, date, time, details, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('date', { ascending: true });
      
      if (error) throw error;
      
      
      setAppointments(data?.map(item => ({
          ...item,
          technician_id: item.technician_id || '', //valor padrão
      })) || []);
    } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
  };
  
  const cancelAppointment = async (appointmentId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      
        if (error) throw error;
        
        setAppointments(prev => 
          prev.map(app => 
            app.id === appointmentId ? { ...app, status: 'cancelled' } : app
          )
        );
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
    }
  };
  
  return (
    <ScheduleContext.Provider
    value={{
        appointments,
        loading,
        error,
        createAppointment,
        fetchUserAppointments,
        cancelAppointment
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
function isValidAppointment(item: any): item is Partial<Appointment> {
  return (
          typeof item?.id === 'string' || item?.id === undefined) &&
          typeof item?.user_id === 'string' &&
          typeof item?.technician_id === 'string' &&
          item?.date && !isNaN(new Date(item.date).getTime()
  );
}