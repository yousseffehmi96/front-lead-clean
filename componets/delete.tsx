import { useState } from "react";
type DeleteProps = {
  deletes: React.Dispatch<React.SetStateAction<boolean>>
  setRefresh: React.Dispatch<React.SetStateAction<number>>
  id: number
}

export default function Delete({deletes,setRefresh,id}:DeleteProps){
  const [sucee,setsucee]=useState<any>(null)
  const [err,seterror]=useState<any>(null)

      const handleClick = () => {
    deletes(false);
  };



  const handledelete = async () => {

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/societe/${id}`, {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json"
  }
})
  if (!res.ok) {
      
      const errorData = await res.json();
      seterror(errorData.detail);
      return;
    }

    seterror(null)
    setRefresh((prev) => prev + 1)
      const data = await res.json();
      setsucee(data.message)
      setTimeout(() => {
            deletes(false)
}, 2000)



}
        return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">

      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Confirmer la suppression
      </h2>

      <p className="text-gray-600 mb-6">
        ⚠️ Êtes-vous sûr de vouloir supprimer cette société ?
      </p>

      <div className="flex justify-end gap-4">
        
       
        <button
          onClick={handleClick}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          Annuler
        </button>

       
        <button
        onClick={handledelete}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          Supprimer
        </button>

      </div>
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
        )
}