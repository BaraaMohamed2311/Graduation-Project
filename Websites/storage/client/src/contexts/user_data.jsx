"use client";
import { createContext, useContext, useState, useEffect } from "react";


const user_data_context = createContext();

const useUserDataContext = () => useContext(user_data_context);

function UserDataProvider({ children }) {

    const initial_values =  {
            user_id: null,
            user_name: null,
            user_email: null,
            token: null
        };
        
    const [user_data, setUser_Data] = useState(initial_values);

    useEffect(() => {

            const storedData = localStorage.getItem("user_data");
            if (storedData) {
                setUser_Data(JSON.parse(storedData));
            }

    }, []);

    useEffect(() => {
        if (user_data.token !== null) {
            localStorage.setItem("user_data", JSON.stringify(user_data));
            
        }
    }, [ user_data.token ]);

    return (
        <user_data_context.Provider value={{ user_data, setUser_Data }}>
            {children}
        </user_data_context.Provider>
    );
}

export { useUserDataContext, UserDataProvider };
