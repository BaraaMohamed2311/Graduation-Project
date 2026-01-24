"use client"
import { useUserDataContext } from "@/contexts/user_data"
import { useEmployeesCache } from "@/hooks/useEmployeesCache"
import { usePatientsCache } from "@/hooks/usePatientsCache"
import { useMyPatientsCache } from "@/hooks/useMyPatientsCache"
import {  useBookingListCache} from "@/hooks/useBookingListCache"
import {clearStore} from "../utils/indexDB/deleteCacheMethods"
import userNotification from "../utils/userNotification";
import { useIsLoginContext } from "@/contexts/isLogin";
import { useRouter } from "next/navigation";
import { global_store_names } from "@/global_data"
export default function  useLogOut(){
    let { setUser_Data } = useUserDataContext();
    let { setCached_Employees } = useEmployeesCache();
    let { setCached_Patients } = usePatientsCache();
    let { setCached_My_Patients } = useMyPatientsCache();
    let { setCached_Booking_List } = useBookingListCache();
    let {setIsLogin} = useIsLoginContext()
    const router = useRouter()
    // logout function
    return function (){

        router.replace("/")
        setUser_Data({
            emp_id: null,
            user_name: null,
            user_email: null,
            emp_title: null,
            emp_specialty: null,
            emp_salary: null,
            emp_bonus: null,
            emp_abscence: null,
            emp_rate: null,
            token: null
        })

        // hide logout button
        setIsLogin(false)
        // clear user cached data in states
        setCached_Employees([]);
        setCached_Patients([]);
        setCached_My_Patients([]);
        setCached_Booking_List({});

        // clear all data in indexedDB

        for (const storeName of global_store_names){
            clearStore(storeName);
        }

        // clear all data in localStorage
        localStorage.clear();
        // send notification
        userNotification("success","Loggedout Successfully")
    }

    
}