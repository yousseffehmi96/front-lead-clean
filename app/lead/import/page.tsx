// components/LeadImportDropzone.tsx
"use client";

import { log } from "console";
import { Upload } from "lucide-react";
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import LeadsPage from "./table";
import * as XLSX from "xlsx";


export default   function LeadImportDropzone() {
  
  const [file,setfile]=useState<File|null>(null);
  const [dragging,setdragging]=useState(false);
  const ACCEPTED=[".csv",".xlsx"];
  const [message,setmessage]=useState('')
  const [data, setData] = useState<Record<string, string>[]>([]);
  const accept=(f:File | undefined)=>{
    if(!f){
      setfile(null)
      return
    } 
    let ext=f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    
    if(!ACCEPTED.includes(ext)){
      
      setfile(null)
      setmessage("Format non pris en charge. Utilisez un fichier CSV ou XLSX.");
    }
    else{
      setfile(f)
      if (ext==='.csv'){
            readCsv(f)
      }
      else{
        readXlsx(f)
      }
    }
    return 
}


const readXlsx = async (f: File) => {
  const buffer = await f.arrayBuffer();        
  const workbook = XLSX.read(buffer);

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
 const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet);


  setData( rows)   
};

const detectDelimiter = (headerLine: string): string => {
  const candidates = [",", ";", "\t", "|"];

  return candidates.reduce((best, current) =>
    headerLine.split(current).length > headerLine.split(best).length
      ? current
      : best
  );
};

const readCsv = async (f: File) => {
  const text = await f.text();
  const lines = text.trim().split("\n");

  const delimiter = detectDelimiter(lines[0]);

  const headers = lines[0].split(delimiter).map((h) => h.trim());

  const rows = lines.slice(1).map((line) => {
    const values = line.split(delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i]?.trim() ?? "";
    });
    return obj;
  });

  setData(rows);
};
  return (
    <>
    {!file && <div className="flex items-center justify-center min-h-screen p-6" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}>
               <div className=" w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-indigo-950 p-8">
                    <h2 className="text-2xl font-semibold text-white ">Importer vos leads</h2>
                    <p className="pt-2 text-gray-400">Chaque ligne de votre fichier devient un contact dans votre pipeline.</p>
                    <label onDragOver={(e)=>{
                      e.preventDefault();
                      setdragging(true);
                    }}  onDragLeave={()=>{
                      setdragging(true)
                    }} onDrop={(e)=>{
                      e.preventDefault();
                      setdragging(false);
                      accept(e.dataTransfer.files?.[0])
                    }} className="mt-6 cursor-pointer flex flex-col items-center   rounded-2xl border-2 border-dashed border-white/15 border-white/[0.3] p-8 text-center ">
                            <input onChange={(e)=>{
                              const ext=accept(e.target.files?.[0])
                              

                            }} accept=".csv,.xlsx" type="file" name="" id="" className="sr-only"/>
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/10">
  <Upload size={28} strokeWidth={1.75}  className="text-teal-300" />
</div>

                              <p className="text-lg font-semibold text-slate-200">Glissez votre fichier ici</p>
                              <p className=" text-green-500 "><span className="text-gray-400">ou</span> <span className="underline">parcourez vos fichier</span></p>
                    </label>
               </div>
          </div>}

          {file && <LeadsPage data={data} filename={file.name}/>}
    
    </>
          
  );
}

