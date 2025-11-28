
export default function Select({ styles , select_options , isLabeld= true , defaultValue , reference, onChange}){
    console.log("reference xxx",reference.current ,select_options );
    return ( 
        <div  className={`${styles["select-wrapper"]} select-div`}>
        { isLabeld && <label className="select-label" htmlFor={select_options.name}>{select_options.label}</label>}
            
            <select onChange={onChange} key={select_options.name} ref={(el)=>reference.current[select_options.name] = el}  name={select_options.name} id={select_options.name}>
                
                { !isLabeld && <option value="" disabled selected hidden>{select_options.label}</option>}
            {
                select_options.options &&
                select_options.options.map((option)=>{
            
                    return (
                        <>
                        {/* we use selected to mark option as default either if defaultValue=== option.value or option is marked as selected in select_options*/}
                            <option key={option.value} value={option.value} selected={defaultValue? defaultValue === option.value :( option.selected || false)}>{option.text}</option>
                        </>
                    )
                })
            }
            </select>
        </div>
    )
}





