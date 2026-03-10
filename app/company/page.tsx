"use client"
import Delete from "@/componets/delete";
import Usefetch from "@/hooks/SocieteFetch";
import changeEtat from "@/hooks/Societeusestate"
import { useEffect, useState } from "react";
export default function company(){
  const {societe,setsociete}=changeEtat()
  const [sucee,setsucee]=useState<any>(null)
  const [err,seterror]=useState<any>(null)
  const [showForm, setShowForm] = useState(false)
   const [isEdit, setisedit] = useState(false)
  const [refresh, setRefresh] = useState<number>(0)
const [deletedata,setDeletedata]=useState(false)
const [idsociete,setidsociete]=useState<number>(0)
const {data}=Usefetch(
 `${process.env.NEXT_PUBLIC_API_URL}/societe?refresh=`+refresh
)
  const handle=(e:any)=>{
    const {name,value}=e.target
    setsociete(prev=>({
      ...prev,
      [name]:value
    }))
  }



const handleUpdate = async () => {

  const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/societe/${societe.id
  }`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(societe)
  })
  if (!res.ok) {
      
      const errorData = await res.json();
      seterror(errorData.detail);
      return;
    }

    seterror(null)
    setRefresh(prev=>prev+1)
      const data = await res.json();
      setsucee(data.message)
     



}
  


   const handleClick = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/societe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(societe)
      });
    if (!res.ok) {
      
      const errorData = await res.json();
      seterror(errorData.detail);
      return;
    }
    seterror(null)
    setRefresh(prev=>prev+1)
      const data = await res.json();
      setsucee(data.message)
      setsociete({
    id:"",
    nom: "",
    domaine: "",
    extension: ""
  })

    } catch (error) {
      seterror(error)
    }
  };
    return (
      <>
      
<div className="mt-10 w-full max-w-8xl bg-white shadow-lg rounded-xl p-6">
  <div className="flex justify-between items-baseline">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">
    Liste des sociétés
  </h2>
  <button onClick={()=>setShowForm(true)} className=" w-1/8  py-2 bg-blue-700 text-white rounded-xl  ">Ajouter une societè</button>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100 text-gray-700">
          <th className="p-3 text-left">Nom</th>
          <th className="p-3 text-left">Domaine</th>
          <th className="p-3 text-left">Extension</th>
          <th className="p-3 text-center">Actions</th>
        </tr>
      </thead>

      <tbody>
        
        

          {data?.map(d=>
          
          <tr key={d.id}  className="border-b hover:bg-gray-50 transition">
             <td className="p-3">{d.nom}</td>
                  <td className="p-3">{d.domaine}</td>
                  <td className="p-3">{d.extension}</td>
                  <td className="p-3 flex justify-center gap-4">
          
            <button onClick={()=>
            {
              setisedit(true)
              setShowForm(true)
               setsociete({
    id:d.id,
    nom: d.nom,
    domaine: d.domaine,
    extension: d.extension
  })
            }} className="text-blue-600 hover:text-blue-800 transition text-lg">
              ✏️
            </button>

           
            <button onClick={()=>{setDeletedata(true)
              setidsociete(d.id)
            }} className="text-red-600 hover:text-red-800 transition text-lg">
              🗑️
            </button>
          </td>
        </tr>
                 
          )}
         

          
      </tbody>
    </table>
  </div>
</div>

{showForm && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md relative">

      {/* bouton fermer */}
      <button
        onClick={() =>{ 
          setShowForm(false) 
          setisedit(false)
 setsociete({
    id:"",
    nom: "",
    domaine: "",
    extension: ""
  })
  seterror("")
  setsucee("")
         }}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
      >
        ✖
      </button>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {isEdit? "Modifier une société":"Ajouter une société"}
      </h2>

      <div className="space-y-4">

        <input
          name="nom"
          placeholder="Nom"
          className="w-full border p-2 rounded-lg"
          value={societe?.nom}
          onChange={handle}
        />

        <input
          name="domaine"
          placeholder="Domaine"
          className="w-full border p-2 rounded-lg"
          value={societe?.domaine}
          onChange={handle}
        />

        <input
          name="extension"
          placeholder="Extension"
          className="w-full border p-2 rounded-lg"
          value={societe?.extension}
          onChange={handle}
        />

        <button
          onClick={isEdit?handleUpdate:handleClick}
          className={`${isEdit?"w-full bg-orange-600 text-white py-2 rounded-lg":"w-full bg-blue-600 text-white py-2 rounded-lg"}`}
        >
           {isEdit? "Modifier":"Ajouter"}
        </button>
        {sucee && (
  <div className="mt-4 p-3 bg-green-100 text-green-700 border border-green-400 rounded-lg text-center font-medium">
    {sucee}
  </div>
  
)}

{err && (
  <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded-lg text-center font-medium">
    {err}
  </div>
  
)}

      </div>

    </div>
  </div>
)}

{deletedata && <Delete deletes={setDeletedata}  setRefresh={setRefresh} id={idsociete} />}
</>
    )
}