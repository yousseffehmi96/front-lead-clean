"use client"
import { Database, HomeIcon, Shield, Sparkles, Upload,Building2, BrushCleaning } from "lucide-react";
import { LayoutDashboard  } from "lucide-react";

 import Navitems from "./navItems";
import Home from "@/app/page";
import { useState } from "react";

export default function Navbar(){
    const [item,setitem]=useState("Dashboard")
    return(
         <div className="h-screen w-60 bg-white border-r p-4">
      <h1 className="text-xl text-blue-900 font-bold mb-6">LeadsCleaner</h1>

      <div  className="flex flex-col gap-4">
        
        <Navitems onClick={()=>setitem("Upload")} href="/upload" active={item==="Upload"} text={"Upload"}  icon={<Upload size={18}/>}   />
        <Navitems onClick={()=>setitem("Leads")} href="/lead/prod" active={item==="Leads"} text={"Leads"}  icon={<Database size={18}/>}   />
        <Navitems onClick={()=>setitem("Blacklist")} href="/lead/black" active={item==="Blacklist"} text={"Blacklist"}  icon={<Shield size={18}/>}   />
                <Navitems onClick={()=>setitem("Clean")} href="/lead/clean" active={item==="Clean"} text={"Clean"}  icon={<BrushCleaning size={18}/>}   />

        <Navitems onClick={()=>setitem("Company")} href="/company" active={item==="Company"} text={"Company"}  icon={<Building2 size={18}/>}   />

      </div>
    </div>
    )
}