import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/database.types';

export type AppointmentInput = {
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

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

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

export const useSchedule = () => useContext(ScheduleContext);