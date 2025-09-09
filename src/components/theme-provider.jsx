import React, { createContext, useContext, useState } from "react"
import ProPlanModal from "./Comman/ProPlanModal";
const ThemeProviderContext = createContext();

export function ThemeProvider({ children, ...props }) {
    const [isProModal, setIsProModal] = useState(false);
    const [isOwnerLimit, setIsOwnerLimit] = useState(false);

    const value = {

        onProModal: (value) => {
            setIsProModal(value)
        },
        setIsOwnerLimit: (value) => {
            setIsOwnerLimit(value)
        }
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
            <ProPlanModal {...{ isProModal, setIsProModal, isOwnerLimit, setIsOwnerLimit }} />
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")
    return context
}
