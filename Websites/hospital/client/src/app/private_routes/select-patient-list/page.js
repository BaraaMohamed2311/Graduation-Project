"use client"
import private_routes from "../page";
import { Suspense , lazy ,useState , useRef , useEffect} from "react";
import LoaderForComponents from "@/components/LoaderForComponents/LoaderForComponents";
import SearchOptions from "@/components/SearchOptions/SearchOptions";
import styles from "./selectPatientList.module.css"
import {selectsElementsData , inputs_info} from "./data";
import userNotification from "@/utils/userNotification";
import stringifyFields from "@/utils/stringifyFields";
import statusNotification from "@/utils/statusNotification";
import { useUserDataContext } from "@/contexts/user_data";
import {useCachedPatientsContext} from "@/contexts/cached_patients"
import Table from '@/components/Table/Table';
import { useRouter } from "next/navigation";


function SelectPatientPage() {
  

  

}

export default  private_routes(SelectPatientPage)