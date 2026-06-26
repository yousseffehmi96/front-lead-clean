"use client"
import { useState} from "react";

interface Societe {
  id:string
  nom: string;
  patterne: string;
}

export default function changeEtat(){
     const [societe, setsociete] = useState<Societe>({
    id:"",
    nom: "",
    patterne: ""
  });
    return {societe,setsociete}
}