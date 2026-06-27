import { create } from 'zustand';

interface EmergencyState {
    isActive: boolean;
    threatDescription: string;
    threatImage: string | null;
    isSilent: boolean;
    
    // Acciones
    triggerEmergency: (description: string, image?: string | null, silent?: boolean) => void;
    dismissEmergency: () => void;
}

export const useEmergencyStore = create<EmergencyState>((set) => ({
    isActive: false,
    threatDescription: "",
    threatImage: null,
    isSilent: false,

    triggerEmergency: (description, image = null, silent = false) => {
        set({
            isActive: true,
            threatDescription: description,
            threatImage: image,
            isSilent: silent
        });
    },

    dismissEmergency: () => {
        set({
            isActive: false,
            threatDescription: "",
            threatImage: null,
            isSilent: false
        });
    }
}));
