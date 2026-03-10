import { useEffect, useState } from "react"



export default  function Usefetch(url:any){
    const [data,setdata]=useState<any[]>([])
    useEffect( ()=>{
        async function getdata() {
                  try{
                            const result=await fetch(url)
                            
                            const res=await result.json()
                            
                            setdata(res)
                    }
                catch(err){
                        console.log(err);
                }               
        }
        getdata() 
    },[url])
    return {data}
}
