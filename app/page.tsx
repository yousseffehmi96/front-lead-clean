
"use client"
import Image from "next/image";
import UploadPage from "./upload/page";
import { redirect } from "next/dist/server/api-utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function Home() {
    const route=useRouter()

    useEffect(()=>{
          route.replace("/dashboard")
    },[])
}
