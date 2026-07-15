import { useEffect, useState } from "react"



export default  function Usefetch(url:any){
    const [data,setdata]=useState<any[]>([])
    // Permet de distinguer "en cours de chargement" de "aucun résultat"
    // (sans ça, les pages affichent "Aucune donnée" avant l'arrivée des données).
    const [loading,setloading]=useState(true)
    useEffect( ()=>{
        let annule = false
        async function getdata() {
                  setloading(true)
                  try{
                            const result=await fetch(url)

                            const res=await result.json()

                            // Ne stocker que des tableaux : si la route renvoie un objet
                            // (ex. erreur 401 {detail:"..."}), on garde une liste vide
                            // pour éviter "data.filter is not a function".
                            if (!annule) setdata(Array.isArray(res) ? res : [])
                    }
                catch(err){
                        console.log(err);
                        if (!annule) setdata([])
                }
                finally{
                        if (!annule) setloading(false)
                }
        }
        getdata()
        // Évite de traiter la réponse d'une requête obsolète (changement d'URL rapide)
        return () => { annule = true }
    },[url])
    return {data,loading}
}
