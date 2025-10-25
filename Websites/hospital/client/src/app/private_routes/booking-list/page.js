"use client";
import { useRouter } from "next/navigation";
import styles from "./bookinglistpage.module.css";
import private_routes from "../page";
import SearchOptions from "@/components/SearchOptions/SearchOptions";
import BookingCard from "@/components/BookingCard/BookingCard";
import { selectsElementsData} from "./data"
import { useRef } from "react";
function BookingListPage() {
    const selectBoxsRef =useRef({})
    return (
        <div>
            <SearchOptions 
                references={{selectBoxsRef}}
                selectsElementsData={selectsElementsData}
            />
            <BookingCard />
        </div>
    )
}


export default private_routes(BookingListPage)