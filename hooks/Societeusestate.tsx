"use client"
import { useState} from "react";

interface Societe {
  id:string
  nom: string;
  domaine: string;
  extension: string;
}

export default function changeEtat(){
     const [societe, setsociete] = useState<Societe>({
    id:"",
    nom: "",
    domaine: "",
    extension: ""
  });
    return {societe,setsociete}
}