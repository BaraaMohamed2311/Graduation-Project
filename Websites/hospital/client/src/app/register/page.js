
"use client";
import Form from "@/components/Form/Form";
import styles from "./register.module.css";
import { useRef, useState } from "react";
import {inputs_info } from "./data";
import userNotification from "@/utils/userNotification";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  let [formBtnState, setFormBtnState] = useState("Register");
  let router = useRouter();

  // ========================>MUST HAVE SAME ORDER IN references ARRAY AS inputs_info <=================



  let inputsBoxsRef = useRef({});
  /**************************************/
  function register_handler(e){
    // preventing refresh
    e.preventDefault();
      setFormBtnState("Loading...");
    // gathering values of body from refrences
    const requestBody ={};
    /******************************/
    inputs_info.forEach((input) => {
      requestBody[input.name]= inputsBoxsRef.current[input.name].value;
    });
    

    console.log("requestBody",requestBody);


    fetch(`${process.env.APIKEY}/user/register`, 
          {
          method:"POST",
          mode:"cors",
          headers: {
            'Content-Type': 'application/json'
          },
          body:JSON.stringify(requestBody)
        }
      )
      .then(res=>res.json())
      .then(data=>{
          if(data.success){
            // we assign user data to context
            setFormBtnState("Succeded")
            userNotification("success" , data.message);
            // navigate to home 
            router.replace("/")
            }
          
          else{
            setFormBtnState("Try Again");
            userNotification("error" , data.message)
          }
        })
        .catch(err=>{
          console.log("Error Login",err);
          setFormBtnState("Try Again");
          userNotification("error" , data.message)
        })
  }
  
  return (
    <>
      <div className={styles["register"]}>
        <div className={styles["center"]}>
          <h1>EMS - Register</h1>
          <Form 
          form_handler={register_handler} 
          formBtnState = {formBtnState} 
          inputs_info = { inputs_info} 
          references={{inputsBoxsRef}} 
          formKind={"register_form"}/>
        </div>
      </div>
    </>
  );
}


