import { useEffect, useState } from "react"



export default  function Usefetch(url:any){
    const [data,setdata]=useState<any[]>([])
    useEffect( ()=>{
        async function getdata() {
                  try{
                            const result=await fetch(url)

                            const res=await result.json()

                            // Ne stocker que des tableaux : si la route renvoie un objet
                            // (ex. erreur 401 {detail:"..."}), on garde une liste vide
                            // pour éviter "data.filter is not a function".
                            setdata(Array.isArray(res) ? res : [])
                    }
                catch(err){
                        console.log(err);
                        setdata([])
                }
        }
        getdata() 
    },[url])
    return {data}
}
